import { alertes, profils } from '~~/server/database/schema';
import { eq, sql } from 'drizzle-orm';
import { hasFeature, type Plan } from '~~/app/config/plans';
import {
  normaliserPrefs,
  resumeQuotidienActif,
  type CategorieNotif,
} from '~~/server/utils/alertesCategories';
import {
  planifierPushDetaille,
  type PushItem,
  type PushPayload,
} from '~~/server/utils/alertesPush';
import { sendPushBatchToUser } from '~~/server/utils/webPush';
import { chargerCheptel } from './cheptel';
import { appliquerResolutions, chargerAlertesActives } from './resolution';
import { horodaterNotifiees, rattraperPushDifferes } from './rattrapage';
import type { AlerteCreee, AlerteInsert, ProfilMoteur } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// L'ORCHESTRATEUR — un seul chemin pour les deux points d'entrée.
//
// Séquence : charger → résoudre → dédupliquer → détecter → insérer → planifier.
//
// ⚠️ LE PIÈGE À NE JAMAIS RÉINTRODUIRE : `dejaExiste` doit être construit sur
// les alertes actives MOINS celles qu'on vient de résoudre. Les alertes météo
// sont résolues puis régénérées à chaque run ; si `dejaExiste` s'appuyait sur
// l'instantané pris AVANT la résolution, il les croirait encore actives et la
// météo ne serait plus jamais recréée — elle disparaîtrait du produit.
// ═══════════════════════════════════════════════════════════════════════════

/** Types que la feuille de route du matin regroupe déjà (Pro+). */
const TYPES_BRIEFING = new Set([
  'visite_requise',
  'premiere_visite',
  'rdv_rappel',
  'traitement_fin',
]);

export interface PreferencesNotif {
  categories: Record<CategorieNotif, boolean>;
  /** Pro+ ET résumé quotidien activé → ne pas doubler les types du briefing. */
  briefingActif: boolean;
  /**
   * Le plan de l'apiculteur. Il était lu pour calculer `briefingActif` puis
   * jeté — or la diffusion push en a besoin elle aussi : certaines
   * notifications ne sont pas offertes à toutes les formules (`peutRecevoir`).
   * Le porter ici évite une seconde requête à chaque appelant.
   */
  plan: Plan;
}

/** Plan + préférences brutes → préférences exploitables. PURE. */
export function preferencesDepuisProfil(
  plan: string | null,
  brut: Record<string, unknown> | null,
): PreferencesNotif {
  return {
    plan: (plan ?? 'decouverte') as Plan,
    categories: normaliserPrefs(brut),
    briefingActif:
      resumeQuotidienActif(brut) && hasFeature((plan ?? 'decouverte') as Plan, 'tourneeOptimisee'),
  };
}

/** Lit plan + préférences quand l'appelant ne les a pas déjà (route à la demande). */
export async function chargerPreferencesNotif(userId: string): Promise<PreferencesNotif> {
  const [profil] = await db
    .select({ plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, userId));
  return preferencesDepuisProfil(
    profil?.plan ?? null,
    (profil?.pushNotifPrefs as Record<string, unknown> | null) ?? null,
  );
}

export interface EntreeMoteur {
  userId: string;
  profil: ProfilMoteur;
  maintenant: Date;
  /** Fournies par le cron (déjà chargées en masse) ; lues sinon. */
  preferences?: PreferencesNotif;
}

export interface ResultatMoteur {
  userId: string;
  creees: AlerteCreee[];
  push: PushPayload[];
  /** Alertes dont le sort push est tranché — horodatées APRÈS envoi. */
  aHorodater: string[];
}

/**
 * Envoie les notifications de plusieurs runs — un envoi groupé par compte, donc
 * UNE lecture d'abonnements par compte quel que soit le nombre de payloads.
 * Best-effort intégral : un push qui échoue n'annule pas les alertes créées.
 */
export async function diffuserPush(
  resultats: readonly ResultatMoteur[],
  maintenant: Date,
): Promise<number> {
  let envoyes = 0;
  for (const r of resultats) {
    if (r.push.length > 0) {
      envoyes += await sendPushBatchToUser(r.userId, r.push).catch(() => 0);
    }
    // Horodatage APRÈS l'envoi, jamais avant : horodater d'abord donnerait de
    // l'at-most-once, donc un envoi raté ne serait jamais retenté — exactement
    // la perte silencieuse qu'on corrige. On assume donc un doublon possible au
    // pire, que le `tag` du payload fait fusionner côté navigateur.
    await horodaterNotifiees(r.aHorodater, maintenant).catch(() => {});
  }
  return envoyes;
}

/** Une alerte a-t-elle été créée très récemment ? (rechargements du dashboard) */
async function recemmentNotifie(userId: string, maintenant: Date): Promise<boolean> {
  const [recent] = (await db.execute(sql`
    SELECT (max(created_at) > ${maintenant.toISOString()}::timestamptz - interval '10 minutes') AS r
    FROM alertes WHERE user_id = ${userId}
  `)) as unknown as Array<{ r: boolean | null }>;
  return recent?.r === true;
}

/**
 * Un run du moteur pour un utilisateur.
 *
 * Chaque détecteur est isolé : celui qui échoue est logué et n'emporte ni les
 * autres règles ni l'utilisateur. Le cron perdait jusqu'ici le compte entier au
 * moindre throw, `processInBatches` capturant l'erreur au niveau de l'utilisateur.
 */
export async function executerMoteurAlertes(e: EntreeMoteur): Promise<ResultatMoteur> {
  const { userId, profil, maintenant } = e;
  const preferences = e.preferences ?? (await chargerPreferencesNotif(userId));

  const [cheptel, existantes] = await Promise.all([
    chargerCheptel(userId),
    chargerAlertesActives(userId),
  ]);

  // 1. Résolution — tous les résolveurs du profil, une seule mise à jour.
  const resolveurs = profil.detecteurs.flatMap((d) => (d.resoudre ? [d.resoudre] : []));
  const resolus = await appliquerResolutions(
    { userId, maintenant, existantes, cheptel },
    resolveurs,
  );

  // 2. Anti-doublon SUR LES ALERTES ENCORE ACTIVES (cf. avertissement en tête).
  const actives = new Set(
    existantes.filter((a) => !resolus.has(a.id)).map((a) => `${a.type}:${a.referenceId ?? ''}`),
  );
  const dejaExiste = (type: string, referenceId?: string) =>
    actives.has(`${type}:${referenceId ?? ''}`);

  // 3. Détection.
  const aDesRuches = cheptel.length > 0;
  const nouvelles: AlerteInsert[] = [];
  for (const detecteur of profil.detecteurs) {
    if (detecteur.requiertCheptel && !aDesRuches) continue;
    try {
      nouvelles.push(...(await detecteur.detecter({ userId, maintenant, dejaExiste, cheptel })));
    } catch (err) {
      console.error('[moteurAlertes] détecteur en échec', {
        profil: profil.cle,
        detecteur: detecteur.cle,
        userId,
        erreur: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 4. Insertion (chunks : un parc de 1 000 ruches produit autant d'alertes).
  // `.returning()` donne les ids, indispensables pour horodater la notification.
  const creees: AlerteCreee[] = [];
  const CHUNK = 1000;
  for (let i = 0; i < nouvelles.length; i += CHUNK) {
    const lot = nouvelles.slice(i, i + CHUNK);
    const ids = await db.insert(alertes).values(lot).returning({ id: alertes.id });
    lot.forEach((a, j) => {
      const id = ids[j]?.id;
      if (id) creees.push({ ...a, id });
    });
  }

  // 5. Planification du push.
  const versItem = (a: AlerteCreee): PushItem => ({
    id: a.id,
    type: a.type ?? '',
    titre: a.titre,
    message: a.message,
    actionUrl: a.actionUrl,
    priorite: a.priorite as PushPayload['priorite'],
    referenceId: a.referenceId,
  });

  // Les types que la feuille de route du matin regroupe déjà ne sont pas poussés
  // en double — leur sort est donc TRANCHÉ (couverts par le résumé), pas
  // reporté : sans ça, le balayage les repousserait et créerait la double
  // notification qu'on cherche justement à éviter.
  const brief = profil.respecterBriefing && preferences.briefingActif;
  const couvertesParBriefing = brief ? creees.filter((a) => TYPES_BRIEFING.has(a.type ?? '')) : [];
  const aPousser = brief ? creees.filter((a) => !TYPES_BRIEFING.has(a.type ?? '')) : creees;

  const rafale = profil.antiRafale ? await recemmentNotifie(userId, maintenant) : false;
  const plan = planifierPushDetaille(
    aPousser.map(versItem),
    preferences.categories,
    maintenant,
    preferences.plan,
    {
      recemmentNotifie: rafale,
    },
  );

  const aHorodater = [
    ...couvertesParBriefing.map((a) => a.id),
    ...plan.tranchees.map((a) => a.id).filter((id): id is string => !!id),
  ];

  // 6. Repêchage des notifications reportées lors des runs précédents.
  if (profil.rattrapagePush) {
    try {
      const rattrapage = await rattraperPushDifferes(userId, preferences, maintenant);
      plan.payloads.push(...rattrapage.payloads);
      aHorodater.push(...rattrapage.aHorodater);
    } catch (err) {
      console.error('[moteurAlertes] rattrapage en échec', {
        userId,
        erreur: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { userId, creees, push: plan.payloads, aHorodater };
}
