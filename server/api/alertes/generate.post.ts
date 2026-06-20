import { eq, and, sql, lte, gte, isNull, inArray } from 'drizzle-orm';
import { alertes, profils, stocks, transactions, interventions } from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';
import { sendPushToUser } from '~~/server/utils/webPush';
import { claimAndSendWelcomeEmail } from '~~/server/utils/welcomeEmail';
import { construireAlertesExtra, autoResoudreExtra } from '~~/server/utils/alertesExtra';
import {
  construireAlertesVisite,
  compterRuchesJamaisVisitees,
  VISITE_DELAI_JOURS,
} from '~~/server/utils/alertesCore';
import { construireAlertesSaison, autoResoudreSaison } from '~~/server/utils/alertesSaison';
import { construireResumePush, type PrioriteAlerte } from '~~/server/utils/alertesPush';
import { normaliserPrefs, typeActif } from '~~/server/utils/alertesCategories';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const userId = user.id;

  // Déclencheur opportuniste de l'email de bienvenue différé (~1 h après
  // l'inscription) : cette route est appelée à chaque visite du dashboard.
  // Idempotent (claim atomique), fire-and-forget.
  dbWatchdog(claimAndSendWelcomeEmail(userId), 'welcome-email').catch(() => {});

  try {
    // Borné : tâche best-effort — sur pool empoisonné (sockets morts après
    // gel de la lambda) on abandonne vite, le watchdog recycle le pool.
    return await dbWatchdog(genererAlertes(userId), 'alertes/generate', 15_000);
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

async function genererAlertes(userId: string) {
  // Récupère les préférences de notifications push de l'utilisateur
  const [profil] = await db
    .select({ pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, userId));
  const prefs = normaliserPrefs(profil?.pushNotifPrefs as Record<string, unknown> | null);

  // ── 1. Auto-résolution des alertes obsolètes ──────────────────────────────
  // Résout les alertes dont la condition n'est plus vraie, pour qu'un nouveau
  // déclenchement puisse créer une alerte fraîche si la condition réapparaît.
  // Isolé : un échec de résolution ne doit pas empêcher la génération de
  // nouvelles alertes (et inversement).
  try {
    await autoResoudre(userId);
    await autoResoudreExtra(userId);
    await autoResoudreSaison(userId, new Date());
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
  nouvelles.push(...(await construireAlertesVisite(userId, dejaExiste)));

  // ── 4. Score de santé critique ────────────────────────────────────────────
  const ruchesAvecScore = (await db.execute(sql`
    SELECT r.id, r.numero, r.statut, r.qualite_reine,
      li.date_visite, li.force_colonie, li.couvain, li.reserves,
      li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite,
        CASE WHEN i.donnees->>'force_colonie' ~ '^[0-9]+$' THEN (i.donnees->>'force_colonie')::int ELSE i.force_colonie END AS force_colonie,
        CASE WHEN lower(i.donnees->>'reine_vue') IN ('true','false','t','f') THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
        CASE WHEN lower(i.donnees->>'couvain_present') IN ('true','false','t','f') THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
        CASE WHEN lower(i.donnees->>'reserves_presentes') IN ('true','false','t','f') THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
        COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
        i.varroa, i.signe_essaimage, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
  `)) as unknown as Array<{
    id: string;
    numero: string;
    statut: string;
    qualite_reine: string | null;
    date_visite: string | null;
    force_colonie: number | null;
    couvain: number | null;
    reserves: number | null;
    reine_vue: boolean | null;
    varroa: number | null;
    comportement: string | null;
    signe_essaimage: boolean | null;
    maladie_observee: string | null;
  }>;

  for (const r of ruchesAvecScore) {
    const score = computeScore({
      rucheId: r.id,
      numero: r.numero,
      rucherId: '',
      statut: r.statut,
      qualiteReine: r.qualite_reine,
      dateVisite: r.date_visite,
      forceColonie: r.force_colonie,
      couvain: r.couvain,
      reserves: r.reserves,
      reineVue: r.reine_vue,
      varroa: r.varroa,
      comportement: r.comportement,
      signeEssaimage: r.signe_essaimage,
      maladieObservee: r.maladie_observee,
    });
    if (score < 40 && !dejaExiste('sante_critique', r.id)) {
      nouvelles.push({
        userId,
        type: 'sante_critique',
        titre: `Santé critique — Ruche ${r.numero}`,
        message: `Score de santé : ${score}/100. Une intervention urgente est recommandée.`,
        priorite: score < 20 ? 'critique' : 'haute',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

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

  // ── 6b. Alertes supplémentaires (NAPI, traitement, transhumance, reine) ────
  nouvelles.push(...(await construireAlertesExtra(userId, dejaExiste)));

  // ── 6c. Nudges saisonniers (calendrier apicole) — 1 par fenêtre, groupés ───
  // Uniquement pour les comptes avec au moins une ruche active.
  if (ruchesAvecScore.length > 0) {
    nouvelles.push(...construireAlertesSaison(userId, new Date(), dejaExiste));
  }

  // ── 7. Insérer + envoyer les push ─────────────────────────────────────────
  if (nouvelles.length > 0) {
    await db.insert(alertes).values(nouvelles);

    // Push ADAPTATIF : on ne pousse que les types non désactivés par l'utilisateur,
    // et si le lot est gros (création en masse, parc entier en retard…), on envoie
    // UN push résumé au lieu d'un par alerte — sinon 100 ruches = 100 push.
    const aPusher = nouvelles.filter((a) => typeActif(prefs, a.type ?? ''));
    const resume = construireResumePush(
      aPusher.map((a) => ({
        type: a.type ?? '',
        priorite: (a.priorite ?? 'moyenne') as PrioriteAlerte,
      })),
    );
    if (resume) {
      await sendPushToUser(userId, resume).catch(() => {});
    } else {
      for (const a of aPusher) {
        await sendPushToUser(userId, {
          title: a.titre ?? 'APIGO',
          body: a.message ?? '',
          url: a.actionUrl ?? '/alertes',
          priorite: (a.priorite ?? 'moyenne') as 'critique' | 'haute' | 'moyenne' | 'basse',
          tag: `${a.type}:${a.referenceId ?? ''}`,
        }).catch(() => {});
      }
    }
  }

  return { data: { created: nouvelles.length } };
}

/**
 * Résout les alertes dont la condition sous-jacente n'est plus vraie.
 * Les alertes résolues sont marquées resolvedAt = now() et ne bloquent plus
 * la création d'une nouvelle alerte si la condition réapparaît.
 */
async function autoResoudre(userId: string): Promise<void> {
  const now = new Date();

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
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - VISITE_DELAI_JOURS);
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
  if (premieresVisite.length > 0 && (await compterRuchesJamaisVisitees(userId)) === 0) {
    premieresVisite.forEach((a) => aResoudre.push(a.id));
  }

  if (aResoudre.length > 0) {
    await db
      .update(alertes)
      .set({ resolvedAt: now, updatedAt: now })
      .where(inArray(alertes.id, aResoudre));
  }
}
