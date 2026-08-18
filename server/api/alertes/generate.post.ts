import { eq, and, sql, lte, gte, isNull, inArray } from 'drizzle-orm';
import { alertes, profils, stocks, transactions, interventions } from '~~/server/database/schema';
import { sendPushToUser } from '~~/server/utils/webPush';
import { claimAndSendWelcomeEmail } from '~~/server/utils/welcomeEmail';
import { construireAlertesExtra, autoResoudreExtra } from '~~/server/utils/alertesExtra';
import { detecterVisites, detecterSanteCritique } from '~~/server/utils/alertesCore';
import {
  chargerCheptel,
  compterRuchesJamaisVisitees,
  type RucheSnapshot,
} from '~~/server/utils/moteurAlertes/cheptel';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import { construireAlertesSaison, autoResoudreSaison } from '~~/server/utils/alertesSaison';
import { construireAlertesAvancees, autoResoudreAvancees } from '~~/server/utils/alertesAvancees';
import { planifierPush, type PrioriteAlerte } from '~~/server/utils/alertesPush';
import { normaliserPrefs } from '~~/server/utils/alertesCategories';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  // Les alertes appartiennent à l'espace partagé : on les génère sur le
  // propriétaire (le cron fait de même en itérant sur les comptes propriétaires).
  const ownerId = await resolveOwnerId(event);

  // Déclencheur opportuniste de l'email de bienvenue différé (~1 h après
  // l'inscription) : cette route est appelée à chaque visite du dashboard.
  // Idempotent (claim atomique), fire-and-forget. Reste personnel à l'utilisateur.
  dbWatchdog(claimAndSendWelcomeEmail(user.id), 'welcome-email').catch(() => {});

  try {
    // Borné : tâche best-effort — sur pool empoisonné (sockets morts après
    // gel de la lambda) on abandonne vite, le watchdog recycle le pool.
    return await dbWatchdog(genererAlertes(ownerId, new Date()), 'alertes/generate', 15_000);
  } catch (err) {
    // Génération d'alertes = tâche best-effort déclenchée en fire-and-forget au
    // chargement du dashboard. Elle ne doit JAMAIS renvoyer un 500 au client
    // (sinon bruit console + faux signal d'erreur). On loggue l'erreur réelle
    // côté serveur (visible dans les logs Vercel) et on renvoie un résultat neutre.
    console.error(
      '[alertes/generate] échec génération:',
      err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : err,
    );
    return { data: { created: 0 } };
  }
});

async function genererAlertes(userId: string, maintenant: Date) {
  // Récupère les préférences de notifications push de l'utilisateur
  const [profil] = await db
    .select({ pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, userId));
  const prefs = normaliserPrefs(profil?.pushNotifPrefs as Record<string, unknown> | null);

  // Le cheptel : UNE requête pour les trois règles qui en dépendent (visite,
  // première visite, santé critique) ET pour la résolution de « première visite ».
  const cheptel = await chargerCheptel(userId);

  // ── 1. Auto-résolution des alertes obsolètes ──────────────────────────────
  // Résout les alertes dont la condition n'est plus vraie, pour qu'un nouveau
  // déclenchement puisse créer une alerte fraîche si la condition réapparaît.
  // Isolé : un échec de résolution ne doit pas empêcher la génération de
  // nouvelles alertes (et inversement).
  try {
    await autoResoudre(userId, maintenant, cheptel);
    await autoResoudreExtra(userId, maintenant);
    await autoResoudreSaison(userId, maintenant);
    await autoResoudreAvancees(userId, maintenant);
  } catch (err) {
    console.error(
      '[alertes/generate] autoResoudre a échoué (génération poursuivie):',
      err instanceof Error ? err.message : err,
    );
  }

  // ── 2. Alertes actives (non résolues) — pour la déduplication ─────────────
  // On vérifie TOUTES les alertes actives (lues ou non) pour éviter qu'une
  // alerte lue soit recréée tant que la condition persiste.
  const actives = await db
    .select({ type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));

  const activesSet = new Set(actives.map((a) => `${a.type}:${a.referenceId ?? ''}`));
  const dejaExiste = (type: string, referenceId?: string) =>
    activesSet.has(`${type}:${referenceId ?? ''}`);

  const nouvelles: (typeof alertes.$inferInsert)[] = [];

  // ── 3. Ruches non visitées (socle partagé avec le cron) ───────────────────
  // En retard → une par ruche ; jamais visitées → UNE alerte groupée.
  nouvelles.push(...detecterVisites(userId, cheptel, dejaExiste, maintenant));

  // ── 4. Score de santé critique ────────────────────────────────────────────
  nouvelles.push(...detecterSanteCritique(userId, cheptel, dejaExiste, maintenant));

  // ── 5. Stocks bas ─────────────────────────────────────────────────────────
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
        message: `Quantité actuelle : ${s.quantite} ${s.unite ?? ''}. Seuil d'alerte : ${s.seuilAlerte} ${s.unite ?? ''}.`,
        priorite: 'moyenne',
        referenceType: 'stock',
        referenceId: s.id,
        actionUrl: `/stocks`,
        lue: false,
      });
    }
  }

  // ── 6. Factures en retard ─────────────────────────────────────────────────
  const facturesRetard = await db
    .select({ id: transactions.id, numero: transactions.numero, total: transactions.total })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        eq(transactions.statut, 'envoyee'),
        lte(transactions.dateEcheance, maintenant),
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

  // ── 6b. Alertes supplémentaires (NAPI, traitement, transhumance, reine) ────
  nouvelles.push(...(await construireAlertesExtra(userId, dejaExiste, maintenant)));

  // ── 6c. Nudges saisonniers (calendrier apicole) — 1 par fenêtre, groupés ───
  // Uniquement pour les comptes avec au moins une ruche active.
  if (cheptel.length > 0) {
    nouvelles.push(...construireAlertesSaison(userId, maintenant, dejaExiste));
  }

  // ── 6d. Alertes avancées (varroa, maladie, orpheline, mortalité, pesée, cmd) ─
  // Toutes groupées (1 pour N) sauf loque/commande. La météo reste au cron (HTTP).
  nouvelles.push(...(await construireAlertesAvancees(userId, dejaExiste, maintenant)));

  // ── 7. Insérer + envoyer les push (planification anti-spam) ────────────────
  if (nouvelles.length > 0) {
    // Anti-rafale : si une alerte a déjà été créée il y a < 10 min (rechargements
    // successifs du dashboard), on diffère les push non urgents au prochain run.
    const [recent] = (await db.execute(sql`
      SELECT (max(created_at) > ${maintenant.toISOString()}::timestamptz - interval '10 minutes') AS r
      FROM alertes WHERE user_id = ${userId}
    `)) as unknown as Array<{ r: boolean | null }>;
    const recemmentNotifie = recent?.r === true;

    await db.insert(alertes).values(nouvelles);

    // Liste blanche TYPES_PUSH + catégories + critiques isolées + heures calmes +
    // résumé adaptatif : voir planifierPush. Tout le reste reste en cloche.
    const payloads = planifierPush(
      nouvelles.map((a) => ({
        type: a.type ?? '',
        titre: a.titre,
        message: a.message,
        actionUrl: a.actionUrl,
        priorite: (a.priorite ?? 'moyenne') as PrioriteAlerte,
        referenceId: a.referenceId,
      })),
      prefs,
      maintenant,
      { recemmentNotifie },
    );
    for (const p of payloads) {
      await sendPushToUser(userId, p).catch(() => {});
    }
  }

  return { data: { created: nouvelles.length } };
}

/**
 * Résout les alertes dont la condition sous-jacente n'est plus vraie.
 * Les alertes résolues sont marquées resolvedAt = now() et ne bloquent plus
 * la création d'une nouvelle alerte si la condition réapparaît.
 */
async function autoResoudre(
  userId: string,
  maintenant: Date,
  cheptel: readonly RucheSnapshot[],
): Promise<void> {
  const now = maintenant;

  // Alertes actives existantes (non résolues)
  const existantes = await db
    .select({ id: alertes.id, type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt)));

  if (existantes.length === 0) return;

  const aResoudre: string[] = [];

  // visite_requise — résoudre si la ruche a été visitée récemment
  const visiteIds = existantes
    .filter((a) => a.type === 'visite_requise' && a.referenceId)
    .map((a) => a.referenceId!);
  if (visiteIds.length > 0) {
    const cutoff = new Date(maintenant);
    cutoff.setDate(cutoff.getDate() - intervalleVisiteJours(maintenant));
    // Query builder + inArray plutôt que `ANY(${arr}::uuid[])` en SQL brut :
    // le binding d'un tableau JS en paramètre unique est fragile derrière le
    // pooler Supabase en mode transaction (prepare:false) et faisait échouer
    // toute la résolution. inArray génère des placeholders explicites, sûrs.
    const visitesRecentes = await db
      .selectDistinct({ rucheId: interventions.rucheId })
      .from(interventions)
      .where(
        and(
          inArray(interventions.rucheId, visiteIds),
          eq(interventions.type, 'controle'),
          gte(interventions.dateVisite, cutoff),
        ),
      );
    const ruchesOK = new Set(visitesRecentes.map((v) => v.rucheId));
    existantes
      .filter((a) => a.type === 'visite_requise' && ruchesOK.has(a.referenceId ?? ''))
      .forEach((a) => aResoudre.push(a.id));
  }

  // stock_bas — résoudre si le stock est repassé au-dessus du seuil
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
      const alerte = existantes.find((a) => a.type === 'stock_bas' && a.referenceId === s.id);
      if (alerte) aResoudre.push(alerte.id);
    });
  }

  // facture_retard — résoudre si la facture n'est plus en retard
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
      const alerte = existantes.find((a) => a.type === 'facture_retard' && a.referenceId === f.id);
      if (alerte) aResoudre.push(alerte.id);
    });
  }

  // premiere_visite (groupée) — résoudre dès qu'il n'y a plus AUCUNE ruche jamais
  // visitée (toutes ont reçu un premier contrôle).
  const premieresVisite = existantes.filter((a) => a.type === 'premiere_visite');
  if (premieresVisite.length > 0 && compterRuchesJamaisVisitees(cheptel) === 0) {
    premieresVisite.forEach((a) => aResoudre.push(a.id));
  }

  if (aResoudre.length > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: now, updatedAt: now })
      .where(inArray(alertes.id, aResoudre));
  }
}
