import { eq, and, sql, lte, isNull, inArray } from 'drizzle-orm';
import { profils, stocks, transactions, alertes } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';
import { construireAlertesExtra, autoResoudreExtra } from '~~/server/utils/alertesExtra';
import {
  construireAlertesVisite,
  compterRuchesJamaisVisitees,
  aDesRuchesActives,
} from '~~/server/utils/alertesCore';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { construireAlertesSaison, autoResoudreSaison } from '~~/server/utils/alertesSaison';
import { construireAlertesAvancees, autoResoudreAvancees } from '~~/server/utils/alertesAvancees';
import { construireAlertesMeteo, autoResoudreMeteo } from '~~/server/utils/alertesMeteo';
import { construireAlertesBalancesMuettes } from '~~/server/utils/balances/alertes';
import { planifierPush, type PushPayload, type PrioriteAlerte } from '~~/server/utils/alertesPush';
import { normaliserPrefs, resumeQuotidienActif } from '~~/server/utils/alertesCategories';
import { RDV_TYPE_LABELS } from '~~/server/utils/rdv';
import { heureMinuteParis, memeJourParis } from '~~/server/utils/horloge';
import { hasFeature, type Plan } from '~~/app/config/plans';

const USER_BATCH_SIZE = 25;

// Types d'alertes « terrain/agenda » regroupés par la feuille de route du jour :
// pour les comptes Pro+ qui reçoivent le résumé consolidé (envoyé par le cron
// dédié `feuille-de-route` à l'heure choisie), on ne pousse PAS ces types
// individuellement ici (sinon double notif). Les critiques restent poussées à part.
const TYPES_BRIEFING = new Set([
  'visite_requise',
  'premiere_visite',
  'rdv_rappel',
  'traitement_fin',
]);

type AlerteInsert = typeof alertes.$inferInsert;

type PushAvecUser = PushPayload & { userId: string };

async function autoResoudre(userId: string, maintenant: Date): Promise<void> {
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
    const cutoff = new Date(maintenant);
    cutoff.setDate(cutoff.getDate() - intervalleVisiteJours(maintenant));
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

  // premiere_visite (groupée) — résoudre quand plus aucune ruche jamais visitée.
  const premieresVisite = existantes.filter((a) => a.type === 'premiere_visite');
  if (premieresVisite.length > 0 && (await compterRuchesJamaisVisitees(userId)) === 0) {
    premieresVisite.forEach((a) => aResoudre.push(a.id));
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
      WHERE id = ANY(${rdvIds}::uuid[])
        AND date_visite < ${maintenant.toISOString()}::timestamptz
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
          sql`NOT (statut = 'envoyee' AND date_echeance IS NOT NULL AND date_echeance < ${maintenant.toISOString()})`,
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
      .set({ resolvedAt: maintenant, updatedAt: maintenant })
      .where(inArray(alertes.id, aResoudre));
  }
}

async function buildAlertesForUser(
  userId: string,
  prefs: Record<string, boolean>,
  plan: Plan,
  resumeActif: boolean,
  maintenant: Date,
): Promise<{ nouvelles: AlerteInsert[]; push: PushAvecUser[] }> {
  await autoResoudre(userId, maintenant);
  await autoResoudreExtra(userId, maintenant);
  await autoResoudreSaison(userId, maintenant);
  await autoResoudreAvancees(userId, maintenant);
  await autoResoudreMeteo(userId, maintenant);

  const actives = await db
    .select({ type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));

  const activesSet = new Set(actives.map((a) => `${a.type}:${a.referenceId ?? ''}`));
  const dejaExiste = (type: string, referenceId?: string) =>
    activesSet.has(`${type}:${referenceId ?? ''}`);

  const nouvelles: AlerteInsert[] = [];

  // Visite (socle partagé : en retard → 1/ruche, jamais visitées → 1 groupée)
  nouvelles.push(...(await construireAlertesVisite(userId, dejaExiste, maintenant)));

  const [stocksBas, facturesRetard, rdvProches] = await Promise.all([
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
          lte(transactions.dateEcheance, maintenant),
        ),
      ),
    // RDV pro dans les prochaines 36 h — le cron tourne à 8h, on couvre donc
    // les RDV du jour et du lendemain matin
    db.execute(sql`
      SELECT id, date_visite, donnees, notes
      FROM interventions
      WHERE user_id = ${userId}
        AND type = 'rendez_vous_pro'
        AND date_visite BETWEEN ${maintenant.toISOString()}::timestamptz
                            AND ${maintenant.toISOString()}::timestamptz + interval '36 hours'
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
    // Jour civil de PARIS des deux côtés : `toDateString()` comparait des jours
    // SERVEUR (UTC) alors que l'heure affichée juste après est déjà en heure de
    // Paris — un RDV du lendemain 00 h 30 était annoncé « aujourd'hui à 00:30 ».
    const aujourdhui = memeJourParis(date, maintenant);
    const quand = `${aujourdhui ? "aujourd'hui" : 'demain'} à ${heureMinuteParis(date)}`;
    const typeLabel = RDV_TYPE_LABELS[rdv.donnees?.typeRdv ?? ''] || '';
    const contact = rdv.donnees?.contact ? ` avec ${rdv.donnees.contact}` : '';
    nouvelles.push({
      userId,
      type: 'rdv_rappel',
      titre: `Rendez-vous ${typeLabel || 'pro'} ${quand}`,
      message: `${rdv.notes ?? `RDV${contact}`} — pensez à préparer vos documents.`,
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

  nouvelles.push(...(await construireAlertesExtra(userId, dejaExiste, maintenant)));
  // Avancées (varroa, maladie, orpheline, mortalité, pesée, commande) — commande
  // ne dépend pas du cheptel, donc toujours évaluées.
  nouvelles.push(...(await construireAlertesAvancees(userId, dejaExiste, maintenant)));

  // Balance muette : c'est la SEULE alerte de balance qui ne peut pas être
  // détectée à l'ingestion — par définition, rien n'arrive. Sans ce passage
  // par le cron, un capteur mort resterait silencieux indéfiniment.
  nouvelles.push(...(await construireAlertesBalancesMuettes(userId, dejaExiste, maintenant)));

  // Saison + météo : uniquement si le compte a au moins une ruche active.
  if (await aDesRuchesActives(userId)) {
    nouvelles.push(...construireAlertesSaison(userId, maintenant, dejaExiste));
    nouvelles.push(...(await construireAlertesMeteo(userId, dejaExiste)));
  }

  const toPushItem = (a: AlerteInsert) => ({
    type: a.type ?? '',
    titre: a.titre,
    message: a.message,
    actionUrl: a.actionUrl,
    priorite: (a.priorite ?? 'moyenne') as PrioriteAlerte,
    referenceId: a.referenceId,
  });

  // Feuille de route du jour (Pro+, résumé activé) : la notif consolidée est
  // envoyée par le cron dédié `feuille-de-route` à l'heure choisie par l'apiculteur.
  // Ici on se contente de NE PAS pousser en double les types qu'elle regroupe
  // (visites, RDV, traitements). Critiques / stock / factures : planification normale.
  const briefingActif = resumeActif && hasFeature(plan, 'tourneeOptimisee');
  const aPousser = briefingActif
    ? nouvelles.filter((a) => !TYPES_BRIEFING.has(a.type ?? ''))
    : nouvelles;

  // Planification anti-spam (liste blanche TYPES_PUSH + catégories + critiques
  // isolées + heures calmes + résumé adaptatif). La météo n'est jamais poussée.
  const push: PushAvecUser[] = planifierPush(aPousser.map(toPushItem), prefs, maintenant).map(
    (p) => ({
      ...p,
      userId,
    }),
  );

  return { nouvelles, push };
}

export default defineEventHandler(async (event) => {
  assertCronAuth(event);
  const maintenant = new Date();

  const users = await db
    .select({ id: profils.id, plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);
  if (users.length === 0) return { data: { users: 0, created: 0, failed: 0 } };

  const { results, errors } = await processInBatches(users, USER_BATCH_SIZE, async (user) => {
    const brut = user.pushNotifPrefs as Record<string, unknown> | null;
    const prefs = normaliserPrefs(brut);
    return buildAlertesForUser(
      user.id,
      prefs,
      (user.plan ?? 'decouverte') as Plan,
      resumeQuotidienActif(brut),
      maintenant,
    );
  });

  const allNouv = results.flatMap((r) => r.nouvelles);
  const allPush = results.flatMap((r) => r.push);

  let inserted = 0;
  if (allNouv.length > 0) {
    const CHUNK = 1000;
    for (let i = 0; i < allNouv.length; i += CHUNK) {
      await db.insert(alertes).values(allNouv.slice(i, i + CHUNK));
      inserted += Math.min(CHUNK, allNouv.length - i);
    }
  }

  // Push notifications — best-effort, sans bloquer le cron
  for (const p of allPush) {
    await sendPushToUser(p.userId, {
      title: p.title,
      body: p.body,
      url: p.url,
      priorite: p.priorite,
      tag: p.tag,
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
