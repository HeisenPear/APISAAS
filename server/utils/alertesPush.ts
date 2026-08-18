// ═══════════════════════════════════════════════════════════
// Push ADAPTATIF : éviter d'inonder l'utilisateur.
// Quand un run de génération produit beaucoup d'alertes d'un coup
// (ex. création en masse de ruches, parc qui dépasse le délai de visite),
// on envoie UN push résumé au lieu d'un par alerte.
// ═══════════════════════════════════════════════════════════

import { typeActif } from '~~/server/utils/alertesCategories';
import { partiesParisOuNull } from '~~/server/utils/horloge';

export type PrioriteAlerte = 'basse' | 'moyenne' | 'haute' | 'critique';

/** Au-delà de ce nombre de nouvelles alertes pushables non critiques, on agrège en un seul push. */
export const PUSH_GROUPE_SEUIL = 2;

/**
 * LISTE BLANCHE des types autorisés à POUSSER une notification.
 * Tout type absent d'ici n'apparaît QUE dans la cloche (in-app), jamais en push.
 * Logique inversée volontairement : un futur type oublié est in-app par défaut,
 * pas spam. On réserve le push au vital / urgent / actionnable.
 */
export const TYPES_PUSH = new Set<string>([
  // Socle historique
  'sante_critique',
  'visite_requise',
  'premiere_visite',
  'stock_bas',
  'facture_retard',
  'rdv_rappel',
  'traitement_fin',
  'transhumance_proche',
  'reine_agee',
  'napi',
  'rappel_saison',
  // Nouveaux types vitaux
  'varroa_seuil',
  'maladie_observee',
  'maladie_loque',
  'colonie_orpheline',
  'mortalite_anormale',
  'pesee_chute',
  'commande_a_cloturer',
]);
// In-app uniquement (jamais poussés) : meteo_favorable, meteo_danger, miel_a_conditionner…

const ORDRE_PRIORITE: Record<PrioriteAlerte, number> = {
  basse: 0,
  moyenne: 1,
  haute: 2,
  critique: 3,
};

/** Libellé pluriel court par type d'alerte, pour le corps du push résumé. */
const LIBELLE_TYPE_ALERTE: Record<string, string> = {
  visite_requise: 'à visiter',
  premiere_visite: 'en attente de 1re visite',
  sante_critique: 'en santé critique',
  stock_bas: 'en stock bas',
  facture_retard: 'facture(s) en retard',
  traitement_fin: 'fin de traitement',
  transhumance_proche: 'transhumance proche',
  reine_agee: 'reine âgée',
  napi: 'déclaration NAPI',
  rappel_saison: 'rappel de saison',
  varroa_seuil: 'au-dessus du seuil varroa',
  maladie_observee: 'maladie observée',
  maladie_loque: 'loque suspectée',
  colonie_orpheline: 'colonie peut-être orpheline',
  mortalite_anormale: 'mortalité anormale',
  pesee_chute: 'chute de poids',
  commande_a_cloturer: 'commande à clôturer',
};

export interface ResumePush {
  title: string;
  body: string;
  url: string;
  priorite: PrioriteAlerte;
  tag: string;
}

/**
 * Construit UN push résumé si le lot dépasse le seuil, sinon `null`
 * (l'appelant envoie alors les push individuels). Pur et testable.
 */
export function construireResumePush(
  alertes: Array<{ type: string; priorite: PrioriteAlerte }>,
): ResumePush | null {
  if (alertes.length <= PUSH_GROUPE_SEUIL) return null;

  const parType = new Map<string, number>();
  for (const a of alertes) parType.set(a.type, (parType.get(a.type) ?? 0) + 1);

  const body = [...parType.entries()]
    .map(([t, n]) => `${n} ${LIBELLE_TYPE_ALERTE[t] ?? t}`)
    .join(' · ');

  const priorite = alertes.reduce<PrioriteAlerte>(
    (max, a) => (ORDRE_PRIORITE[a.priorite] > ORDRE_PRIORITE[max] ? a.priorite : max),
    'basse',
  );

  return {
    title: `${alertes.length} nouvelles alertes 🐝`,
    body,
    url: '/alertes',
    priorite,
    tag: 'alertes-groupe',
  };
}

/**
 * Heures calmes : pas de push « confort » entre 21 h et 8 h (Europe/Paris).
 * Un horodatage illisible est traité COMME des heures calmes — dans le doute on
 * se tait plutôt que de réveiller quelqu'un.
 */
export function dansHeuresCalmes(now: Date): boolean {
  const p = partiesParisOuNull(now);
  return p === null || p.heure < 8 || p.heure >= 21;
}

/** Ce type peut-il pousser ? (catégorie activée ET dans la liste blanche push). */
export function estPushable(
  prefs: Record<string, boolean | undefined> | null | undefined,
  type: string,
): boolean {
  return typeActif(prefs, type) && TYPES_PUSH.has(type);
}

export interface PushItem {
  /** Id de l'alerte insérée — sert à horodater `notifiee_le` après envoi. */
  id?: string | null;
  type: string;
  titre?: string | null;
  message?: string | null;
  actionUrl?: string | null;
  priorite?: PrioriteAlerte | null;
  referenceId?: string | null;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  priorite: PrioriteAlerte;
  tag: string;
}

/**
 * Résultat de la planification.
 *
 * La distinction `tranchees` / `differees` est ce qui empêche la perte
 * silencieuse : une alerte non poussable par nature (type hors liste blanche,
 * catégorie coupée par l'utilisateur) a un sort DÉFINITIF et doit être
 * horodatée, sinon le balayage la réexaminerait chaque jour à perpétuité. Une
 * alerte simplement REPORTÉE (heures calmes, anti-rafale) reste en attente.
 */
export interface PlanPush {
  payloads: PushPayload[];
  /** Sort définitif : poussée, ou jamais poussable → horodater `notifiee_le`. */
  tranchees: PushItem[];
  /** Pushable mais reportée → `notifiee_le` reste NULL, le cron repêchera. */
  differees: PushItem[];
}

/**
 * Décide QUOI pousser pour un utilisateur, à partir des alertes tout juste créées.
 * Pur et testable — l'appelant se charge de l'envoi réseau.
 *
 * Garde-fous anti-spam empilés :
 *  - liste blanche `TYPES_PUSH` + préférences de catégorie (estPushable) ;
 *  - les alertes CRITIQUES partent toujours, individuellement (jamais étouffées) ;
 *  - en heures calmes OU juste après une rafale (rechargements), on diffère les
 *    priorités basse/moyenne — elles restent en cloche et seront poussées par le
 *    balayage du cron du matin ;
 *  - le reste est agrégé en UN push résumé au-delà du seuil.
 */
export function planifierPushDetaille(
  nouvelles: PushItem[],
  prefs: Record<string, boolean | undefined> | null | undefined,
  maintenant: Date,
  opts: { recemmentNotifie?: boolean } = {},
): PlanPush {
  const prio = (a: PushItem): PrioriteAlerte => (a.priorite ?? 'moyenne') as PrioriteAlerte;
  const indiv = (a: PushItem): PushPayload => ({
    title: a.titre ?? 'APIGO',
    body: a.message ?? '',
    url: a.actionUrl ?? '/alertes',
    priorite: prio(a),
    tag: `${a.type}:${a.referenceId ?? ''}`,
  });

  // Non pushable par nature : le sort est tranché une fois pour toutes.
  const tranchees = nouvelles.filter((a) => !estPushable(prefs, a.type));
  const pushables = nouvelles.filter((a) => estPushable(prefs, a.type));
  if (pushables.length === 0) return { payloads: [], tranchees, differees: [] };

  const critiques = pushables.filter((a) => prio(a) === 'critique');
  const nonCritiques = pushables.filter((a) => prio(a) !== 'critique');

  // Heures calmes / anti-rafale : seules les priorités hautes passent, le reste
  // est REPORTÉ (et non perdu — cf. le balayage du cron).
  const silence = dansHeuresCalmes(maintenant) || opts.recemmentNotifie === true;
  const retenues = silence ? nonCritiques.filter((a) => prio(a) === 'haute') : nonCritiques;
  const differees = silence ? nonCritiques.filter((a) => prio(a) !== 'haute') : [];

  const payloads: PushPayload[] = critiques.map(indiv);
  const resume = construireResumePush(retenues.map((a) => ({ type: a.type, priorite: prio(a) })));
  if (resume) {
    payloads.push({
      title: resume.title,
      body: resume.body,
      url: resume.url,
      priorite: resume.priorite,
      tag: resume.tag,
    });
  } else {
    payloads.push(...retenues.map(indiv));
  }

  return { payloads, tranchees: [...tranchees, ...critiques, ...retenues], differees };
}

/** Rétro-compatible : les payloads seuls. */
export function planifierPush(
  nouvelles: PushItem[],
  prefs: Record<string, boolean | undefined> | null | undefined,
  maintenant: Date,
  opts: { recemmentNotifie?: boolean } = {},
): PushPayload[] {
  return planifierPushDetaille(nouvelles, prefs, maintenant, opts).payloads;
}
