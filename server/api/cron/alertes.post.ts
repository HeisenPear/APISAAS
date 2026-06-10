import { eq, and, sql, lte, isNull, inArray } from 'drizzle-orm';
import { profils, stocks, transactions, alertes } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';

const VISITE_DELAI_JOURS = 21;
const USER_BATCH_SIZE = 25;

const DEFAULT_PREFS: Record<string, boolean> = {
  visite_requise: true,
  sante_critique: true,
  stock_bas: true,
  facture_retard: true,
  rdv_rappel: true,
};

const RDV_LABELS: Record<string, string> = {
  veterinaire: 'vétérinaire',
  syndicat: 'syndicat',
  fournisseur: 'fournisseur',
  client: 'client',
  administration: 'administration',
  autre: '',
};

type AlerteInsert = typeof alertes.$inferInsert;

async function autoResoudre(userId: string): Promise<void> {
  const now = new Date();
  const existantes = await db
    .select({ id: alertes.id, type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));

  if (existantes.length === 0) return;

  const aResoudre: string[] = [];

  const visiteIds = existantes
    .filter((a) => a.type === 'visite_requise' && a.referenceId)
    .map((a) => a.referenceId!);
  if (visiteIds.length > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - VISITE_DELAI_JOURS);
    const visitesRecentes = (await db.execute(sql`
      SELECT DISTINCT i.ruche_id FROM interventions i
      WHERE i.ruche_id = ANY(${visiteIds}::uuid[]) AND i.type = 'controle'
        AND i.date_visite >= ${cutoff.toISOString()}
    `)) as unknown as Array<{ ruche_id: string }>;
    const ruchesOK = new Set(visitesRecentes.map((v) => v.ruche_id));
    existantes
      .filter((a) => a.type === 'visite_requise' && ruchesOK.has(a.referenceId ?? ''))
      .forEach((a) => aResoudre.push(a.id));
  }

  const stockIds = existantes
    .filter((a) => a.type === 'stock_bas' && a.referenceId)
    .map((a) => a.referenceId!);
  if (stockIds.length > 0) {
    const stocksOK = await db
      .select({ id: stocks.id })
      .from(stocks)
      .where(
        and(
          inArray(stocks.id, stockIds),
          sql`${stocks.seuilAlerte} IS NULL OR ${stocks.quantite}::numeric > ${stocks.seuilAlerte}::numeric`,
        ),
      );
    stocksOK.forEach((s) => {
      const a = existantes.find((x) => x.type === 'stock_bas' && x.referenceId === s.id);
      if (a) aResoudre.push(a.id);
    });
  }

  // Rappels de RDV dont la date est passée → résolus automatiquement
  const rdvIds = existantes
    .filter((a) => a.type === 'rdv_rappel' && a.referenceId)
    .map((a) => a.referenceId!);
  if (rdvIds.length > 0) {
    const rdvPasses = (await db.execute(sql`
      SELECT id FROM interventions
      WHERE id = ANY(${rdvIds}::uuid[]) AND date_visite < now()
    `)) as unknown as Array<{ id: string }>;
    const passes = new Set(rdvPasses.map((r) => r.id));
    existantes
      .filter((a) => a.type === 'rdv_rappel' && passes.has(a.referenceId ?? ''))
      .forEach((a) => aResoudre.push(a.id));
  }

  const factureIds = existantes
    .filter((a) => a.type === 'facture_retard' && a.referenceId)
    .map((a) => a.referenceId!);
  if (factureIds.length > 0) {
    const facturesOK = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          inArray(transactions.id, factureIds),
          sql`NOT (statut = 'envoyee' AND date_echeance IS NOT NULL AND date_echeance < ${now.toISOString()})`,
        ),
      );
    facturesOK.forEach((f) => {
      const a = existantes.find((x) => x.type === 'facture_retard' && x.referenceId === f.id);
      if (a) aResoudre.push(a.id);
    });
  }

  if (aResoudre.length > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: now, updatedAt: now })
      .where(inArray(alertes.id, aResoudre));
  }
}

async function buildAlertesForUser(
  userId: string,
  prefs: Record<string, boolean>,
): Promise<{ nouvelles: AlerteInsert[]; pushItems: AlerteInsert[] }> {
  await autoResoudre(userId);

  const actives = await db
    .select({ type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));

  const activesSet = new Set(actives.map((a) => `${a.type}:${a.referenceId ?? ''}`));
  const dejaExiste = (type: string, referenceId?: string) =>
    activesSet.has(`${type}:${referenceId ?? ''}`);

  const nouvelles: AlerteInsert[] = [];

  const [ruchesAvecDerniereVisite, stocksBas, facturesRetard, rdvProches] = await Promise.all([
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
    // RDV pro dans les prochaines 36 h — le cron tourne à 8h, on couvre donc
    // les RDV du jour et du lendemain matin
    db.execute(sql`
      SELECT id, date_visite, donnees, notes
      FROM interventions
      WHERE user_id = ${userId}
        AND type = 'rendez_vous_pro'
        AND date_visite BETWEEN now() AND now() + interval '36 hours'
      ORDER BY date_visite ASC
      LIMIT 20
    `) as unknown as Promise<
      Array<{
        id: string;
        date_visite: string;
        donnees: { typeRdv?: string; contact?: string } | null;
        notes: string | null;
      }>
    >,
  ]);

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
        titre: `Ruche ${r.numero} non visitée`,
        message: joursDepuis
          ? `Dernière visite il y a ${joursDepuis} jours (seuil : ${VISITE_DELAI_JOURS} j)`
          : `Cette ruche n'a jamais été visitée`,
        priorite: joursDepuis && joursDepuis > 45 ? 'haute' : 'moyenne',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }
  for (const s of stocksBas) {
    if (!dejaExiste('stock_bas', s.id)) {
      nouvelles.push({
        userId,
        type: 'stock_bas',
        titre: `Stock bas — ${s.nom}`,
        message: `Quantité actuelle : ${s.quantite} ${s.unite ?? ''}. Seuil : ${s.seuilAlerte} ${s.unite ?? ''}.`,
        priorite: 'moyenne',
        referenceType: 'stock',
        referenceId: s.id,
        actionUrl: `/stocks`,
        lue: false,
      });
    }
  }
  for (const rdv of rdvProches) {
    if (dejaExiste('rdv_rappel', rdv.id)) continue;
    const date = new Date(rdv.date_visite);
    const aujourdhui = date.toDateString() === new Date().toDateString();
    const quand = `${aujourdhui ? "aujourd'hui" : 'demain'} à ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    })}`;
    const typeLabel = RDV_LABELS[rdv.donnees?.typeRdv ?? ''] || '';
    const contact = rdv.donnees?.contact ? ` avec ${rdv.donnees.contact}` : '';
    nouvelles.push({
      userId,
      type: 'rdv_rappel',
      titre: `Rendez-vous ${typeLabel || 'pro'} ${quand}`,
      message: `${rdv.notes ?? `RDV${contact}`} — pensez à préparer vos documents.`,
      // 'haute' : passe le filtre push (seules haute/critique sont poussées)
      priorite: 'haute',
      referenceType: 'intervention',
      referenceId: rdv.id,
      actionUrl: '/calendrier',
      lue: false,
    });
  }
  for (const f of facturesRetard) {
    if (!dejaExiste('facture_retard', f.id)) {
      nouvelles.push({
        userId,
        type: 'facture_retard',
        titre: `Facture en retard — ${f.numero ?? f.id.slice(0, 8)}`,
        message: `Montant : ${f.total ?? 0} €. Échéance dépassée.`,
        priorite: 'haute',
        referenceType: 'transaction',
        referenceId: f.id,
        actionUrl: `/finances/ventes`,
        lue: false,
      });
    }
  }

  const pushItems = nouvelles.filter((a) => {
    const typeEnabled = prefs[a.type ?? ''] !== false;
    const importante = a.priorite === 'critique' || a.priorite === 'haute';
    return typeEnabled && importante;
  });

  return { nouvelles, pushItems };
}

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const users = await db
    .select({ id: profils.id, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);
  if (users.length === 0) return { data: { users: 0, created: 0, failed: 0 } };

  const { results, errors } = await processInBatches(users, USER_BATCH_SIZE, async (user) => {
    const prefs = { ...DEFAULT_PREFS, ...(user.pushNotifPrefs ?? {}) };
    return buildAlertesForUser(user.id, prefs);
  });

  const allNouv = results.flatMap((r) => r.nouvelles);
  const pushByUser = results.flatMap((r) => r.pushItems);

  let inserted = 0;
  if (allNouv.length > 0) {
    const CHUNK = 1000;
    for (let i = 0; i < allNouv.length; i += CHUNK) {
      await db.insert(alertes).values(allNouv.slice(i, i + CHUNK));
      inserted += Math.min(CHUNK, allNouv.length - i);
    }
  }

  // Push notifications — best-effort, sans bloquer le cron
  for (const a of pushByUser) {
    if (!a.userId) continue;
    await sendPushToUser(a.userId, {
      title: a.titre ?? 'APIGO',
      body: a.message ?? '',
      url: a.actionUrl ?? '/alertes',
      priorite: a.priorite === 'critique' ? 'critique' : 'haute',
      tag: `${a.type}:${a.referenceId ?? ''}`,
    }).catch(() => {});
  }

  if (errors.length > 0) {
    console.error('[cron/alertes] users failed', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ userId: e.item.id, error: String(e.error) })),
    });
  }

  return { data: { users: users.length, created: inserted, failed: errors.length } };
});
