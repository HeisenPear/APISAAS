import { eq, and, sql, lte } from 'drizzle-orm';
import { profils, stocks, transactions, alertes } from '~~/server/database/schema';

const VISITE_DELAI_JOURS = 21;

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.NUXT_CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Non autorisé' });
  }

  const users = await db.select({ id: profils.id }).from(profils);
  let totalCreated = 0;

  for (const user of users) {
    const userId = user.id;

    const existantes = await db
      .select({ type: alertes.type, referenceId: alertes.referenceId })
      .from(alertes)
      .where(and(eq(alertes.userId, userId), eq(alertes.lue, false)));

    const existantesSet = new Set(existantes.map((a) => `${a.type}:${a.referenceId ?? ''}`));
    const nouvelles: (typeof alertes.$inferInsert)[] = [];

    function dejaExiste(type: string, referenceId?: string): boolean {
      return existantesSet.has(`${type}:${referenceId ?? ''}`);
    }

    // 1. Ruches non visitées depuis > 21 jours
    const ruchesAvecDerniereVisite = (await db.execute(sql`
      SELECT r.id, r.numero, li.date_visite
      FROM ruches r
      LEFT JOIN LATERAL (
        SELECT i.date_visite FROM interventions i
        WHERE i.ruche_id = r.id AND i.type = 'controle'
        ORDER BY i.date_visite DESC LIMIT 1
      ) li ON true
      WHERE r.user_id = ${userId} AND r.statut = 'active'
    `)) as unknown as Array<{ id: string; numero: string; date_visite: string | null }>;

    const cutoffVisite = new Date();
    cutoffVisite.setDate(cutoffVisite.getDate() - VISITE_DELAI_JOURS);

    for (const r of ruchesAvecDerniereVisite) {
      const derniere = r.date_visite ? new Date(r.date_visite) : null;
      if ((!derniere || derniere < cutoffVisite) && !dejaExiste('visite_requise', r.id)) {
        const joursDepuis = derniere ? Math.floor((Date.now() - derniere.getTime()) / 86400000) : null;
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

    // 2. Stocks sous le seuil d'alerte
    const stocksBas = await db
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.userId, userId),
          sql`${stocks.seuilAlerte} IS NOT NULL AND ${stocks.quantite}::numeric <= ${stocks.seuilAlerte}::numeric`,
        ),
      );

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

    // 3. Factures en retard
    const facturesRetard = await db
      .select({ id: transactions.id, numero: transactions.numero, total: transactions.total })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'vente'),
          eq(transactions.statut, 'envoyee'),
          lte(transactions.dateEcheance, new Date()),
        ),
      );

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

    if (nouvelles.length > 0) {
      await db.insert(alertes).values(nouvelles);
      totalCreated += nouvelles.length;
    }
  }

  return { data: { users: users.length, created: totalCreated } };
});
