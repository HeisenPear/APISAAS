import { eq, and, sql, lte } from 'drizzle-orm';
import { profils, stocks, transactions, alertes } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';

const VISITE_DELAI_JOURS = 21;
const USER_BATCH_SIZE = 25; // 25 users en parallele = 75 requetes concurrentes max

type AlerteInsert = typeof alertes.$inferInsert;

async function buildAlertesForUser(userId: string): Promise<AlerteInsert[]> {
  const nouvelles: AlerteInsert[] = [];

  // 1. Alertes existantes non-lues (pour dedupe)
  const existantes = await db
    .select({ type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), eq(alertes.lue, false)));

  const existantesSet = new Set(existantes.map((a) => `${a.type}:${a.referenceId ?? ''}`));
  const dejaExiste = (type: string, referenceId?: string): boolean =>
    existantesSet.has(`${type}:${referenceId ?? ''}`);

  // 2. Trois requetes data en parallele (gain de latence sur le user)
  const [ruchesAvecDerniereVisite, stocksBas, facturesRetard] = await Promise.all([
    db.execute(sql`
      SELECT r.id, r.numero, li.date_visite
      FROM ruches r
      LEFT JOIN LATERAL (
        SELECT i.date_visite FROM interventions i
        WHERE i.ruche_id = r.id AND i.type = 'controle'
        ORDER BY i.date_visite DESC LIMIT 1
      ) li ON true
      WHERE r.user_id = ${userId} AND r.statut = 'active'
    `) as unknown as Promise<Array<{ id: string; numero: string; date_visite: string | null }>>,

    db
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.userId, userId),
          sql`${stocks.seuilAlerte} IS NOT NULL AND ${stocks.quantite}::numeric <= ${stocks.seuilAlerte}::numeric`,
        ),
      ),

    db
      .select({ id: transactions.id, numero: transactions.numero, total: transactions.total })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'vente'),
          eq(transactions.statut, 'envoyee'),
          lte(transactions.dateEcheance, new Date()),
        ),
      ),
  ]);

  // 3. Visites en retard
  const cutoffVisite = new Date();
  cutoffVisite.setDate(cutoffVisite.getDate() - VISITE_DELAI_JOURS);

  for (const r of ruchesAvecDerniereVisite) {
    const derniere = r.date_visite ? new Date(r.date_visite) : null;
    if ((!derniere || derniere < cutoffVisite) && !dejaExiste('visite_requise', r.id)) {
      const joursDepuis = derniere
        ? Math.floor((Date.now() - derniere.getTime()) / 86400000)
        : null;
      nouvelles.push({
        userId,
        type: 'visite_requise',
        titre: `Ruche ${r.numero} non visitee`,
        message: joursDepuis
          ? `Derniere visite il y a ${joursDepuis} jours (seuil : ${VISITE_DELAI_JOURS} j)`
          : `Cette ruche n'a jamais ete visitee`,
        priorite: joursDepuis && joursDepuis > 45 ? 'haute' : 'moyenne',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

  // 4. Stocks bas
  for (const s of stocksBas) {
    if (!dejaExiste('stock_bas', s.id)) {
      nouvelles.push({
        userId,
        type: 'stock_bas',
        titre: `Stock bas — ${s.nom}`,
        message: `Quantite actuelle : ${s.quantite} ${s.unite ?? ''}. Seuil : ${s.seuilAlerte} ${s.unite ?? ''}.`,
        priorite: 'moyenne',
        referenceType: 'stock',
        referenceId: s.id,
        actionUrl: `/stocks`,
        lue: false,
      });
    }
  }

  // 5. Factures en retard
  for (const f of facturesRetard) {
    if (!dejaExiste('facture_retard', f.id)) {
      nouvelles.push({
        userId,
        type: 'facture_retard',
        titre: `Facture en retard — ${f.numero ?? f.id.slice(0, 8)}`,
        message: `Montant : ${f.total ?? 0} €. Echeance depassee.`,
        priorite: 'haute',
        referenceType: 'transaction',
        referenceId: f.id,
        actionUrl: `/finances/ventes`,
        lue: false,
      });
    }
  }

  return nouvelles;
}

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const users = await db.select({ id: profils.id }).from(profils);

  if (users.length === 0) {
    return { data: { users: 0, created: 0, failed: 0 } };
  }

  // Process par batches paralleles — empeche le timeout et limite la
  // pression sur le pool de connexions DB
  const { results, errors } = await processInBatches(users, USER_BATCH_SIZE, async (user) =>
    buildAlertesForUser(user.id),
  );

  // Aplatir toutes les alertes generees et inserer en UN seul batch
  const allAlertes = results.flat();

  let inserted = 0;
  if (allAlertes.length > 0) {
    // Chunks de 1000 pour eviter la limite de parametres Postgres
    const CHUNK = 1000;
    for (let i = 0; i < allAlertes.length; i += CHUNK) {
      const chunk = allAlertes.slice(i, i + CHUNK);
      await db.insert(alertes).values(chunk);
      inserted += chunk.length;
    }
  }

  // Log les echecs sans bloquer (le cron rapporte mais ne crashe pas)
  if (errors.length > 0) {
    console.error('[cron/alertes] users failed', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ userId: e.item.id, error: String(e.error) })),
    });
  }

  return { data: { users: users.length, created: inserted, failed: errors.length } };
});
