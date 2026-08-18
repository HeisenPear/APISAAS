import { alertes, profils } from '~~/server/database/schema';
import { eq, sql } from 'drizzle-orm';
import { hasFeature, type Plan } from '~~/app/config/plans';
import {
  normaliserPrefs,
  resumeQuotidienActif,
  type CategorieNotif,
} from '~~/server/utils/alertesCategories';
import { planifierPush, type PushPayload } from '~~/server/utils/alertesPush';
import { sendPushBatchToUser } from '~~/server/utils/webPush';
import { chargerCheptel } from './cheptel';
import { appliquerResolutions, chargerAlertesActives } from './resolution';
import type { AlerteInsert, ProfilMoteur } from './types';

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
}

/** Plan + préférences brutes → préférences exploitables. PURE. */
export function preferencesDepuisProfil(
  plan: string | null,
  brut: Record<string, unknown> | null,
): PreferencesNotif {
  return {
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
  creees: AlerteInsert[];
  push: PushPayload[];
}

/**
 * Envoie les notifications de plusieurs runs — un envoi groupé par compte, donc
 * UNE lecture d'abonnements par compte quel que soit le nombre de payloads.
 * Best-effort intégral : un push qui échoue n'annule pas les alertes créées.
 */
export async function diffuserPush(resultats: readonly ResultatMoteur[]): Promise<number> {
  let envoyes = 0;
  for (const r of resultats) {
    if (r.push.length === 0) continue;
    envoyes += await sendPushBatchToUser(r.userId, r.push).catch(() => 0);
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

  if (nouvelles.length === 0) return { userId, creees: [], push: [] };

  // 4. Insertion (chunks : un parc de 1 000 ruches produit autant d'alertes).
  const CHUNK = 1000;
  for (let i = 0; i < nouvelles.length; i += CHUNK) {
    await db.insert(alertes).values(nouvelles.slice(i, i + CHUNK));
  }

  // 5. Planification du push. Les types regroupés par la feuille de route du
  // matin ne sont pas poussés en double.
  const aPousser =
    profil.respecterBriefing && preferences.briefingActif
      ? nouvelles.filter((a) => !TYPES_BRIEFING.has(a.type ?? ''))
      : nouvelles;

  const rafale = profil.antiRafale ? await recemmentNotifie(userId, maintenant) : false;
  const push = planifierPush(
    aPousser.map((a) => ({
      type: a.type ?? '',
      titre: a.titre,
      message: a.message,
      actionUrl: a.actionUrl,
      priorite: a.priorite as PushPayload['priorite'],
      referenceId: a.referenceId,
    })),
    preferences.categories,
    maintenant,
    { recemmentNotifie: rafale },
  );

  return { userId, creees: nouvelles, push };
}
