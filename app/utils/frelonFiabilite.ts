// Validation communautaire des signalements de frelons (anti-fraude, type Waze).
// Logique PURE et testable : score de fiabilité + statut dérivé des votes.
import type { FrelonStatut } from '~/config/frelon';

/** Votes nets de comptes DISTINCTS pour valider / rejeter / acter une destruction. */
export const SEUIL_CONFIRME = 2;
export const SEUIL_REJET = 2;
export const SEUIL_DETRUIT = 2;
/** Décroissance lente (un nid persiste des semaines) — fiabilité érodée sur ~75 j. */
export const DECAY_JOURS = 75;
/**
 * Au-delà de ce silence, un signalement quitte la carte.
 *
 * ⚠️ CE NOMBRE EST UN CHOIX DE PRODUIT, PAS UNE CONSTANTE PHYSIQUE — à
 * arbitrer par l'apiculteur. Le raisonnement qui a conduit à 120 jours : un nid
 * de frelon asiatique est ANNUEL. Fondé au printemps, il est déserté après les
 * premières gelées ; un nid signalé en juillet ne veut plus rien dire au mois
 * de mars suivant. Quatre mois de silence couvrent donc une saison entière sans
 * effacer un nid encore actif que personne n'a pris le temps de reconfirmer.
 *
 * ⚠️ ET LE SILENCE SE ROMPT FACILEMENT : re-signaler le nid (ou simplement le
 * confirmer d'un clic) remet le compteur à zéro. On n'efface pas une
 * information, on cesse d'afficher une information que PLUS PERSONNE ne
 * soutient.
 */
export const PEREMPTION_JOURS = 120;
/** Anti-flood : signalements max par compte sur 24 h. */
export const MAX_SIGNALEMENTS_PAR_JOUR = 10;
/** Rayon de dédoublonnage : un report plus proche = même nid → devient un vote. */
export const RAYON_DOUBLON_M = 150;
/** Réputation gagnée/perdue par l'auteur quand son signalement bascule. */
export const REPUTATION_CONFIRME = 5;
export const REPUTATION_REJETE = 5;

export interface CompteurVotes {
  confirmations: number;
  infirmations: number;
  destructions: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Score de fiabilité 0-100. Part de la réputation de l'auteur (centrée sur 50),
 * monte avec les confirmations, descend plus vite avec les infirmations
 * (asymétrie anti-faux), et s'érode avec le SILENCE. Une infirmation pèse
 * 1,5× une confirmation.
 *
 * ⚠️ `silenceJours` COMPTE DEPUIS LE DERNIER SIGNE DE VIE, PAS DEPUIS LA
 * CRÉATION — et les trois différences se paient ensemble :
 *
 * 1. La décroissance ne se déclenchait QUE si `confirmations === 0`. Une seule
 *    confirmation la désactivait POUR TOUJOURS : un nid confirmé une fois puis
 *    oublié pendant deux ans gardait 62/100, présenté à l'apiculteur comme une
 *    information fiable.
 * 2. Elle était plafonnée à −40, donc ne pouvait jamais faire tomber à zéro.
 * 3. Elle mesurait l'âge depuis `createdAt` : confirmer un nid ne rajeunissait
 *    rien, et le geste qui prouve qu'il est encore là ne comptait pas.
 *
 * Le silence est désormais la seule horloge. Confirmer un nid — d'un clic, ou
 * en le re-signalant à moins de 150 m — le remet à neuf.
 */
export function scoreFiabilite(
  v: CompteurVotes,
  reputationAuteur: number,
  silenceJours: number,
): number {
  let s = 50 + clamp(reputationAuteur, -30, 30);
  s += v.confirmations * 12;
  s -= v.infirmations * 18;
  if (silenceJours > 0) {
    // Sans plafond : `clamp` en dessous borne à 0. Le plafond de −40 empêchait
    // un signalement abandonné de descendre sous 22/100, c'est-à-dire de
    // devenir reconnaissable comme périmé.
    s -= (silenceJours / DECAY_JOURS) * 40;
  }
  return Math.round(clamp(s, 0, 100));
}

/**
 * Le dernier SIGNE DE VIE d'un signalement : la date la plus récente entre sa
 * création et sa dernière confirmation.
 *
 * ⚠️ SEULES LES CONFIRMATIONS COMPTENT. Une infirmation dit « il n'y est pas »
 * — ce n'est pas un signe de vie, et elle pousse déjà le statut vers « rejeté »
 * à son seuil. Une destruction est terminale. Compter tous les votes ferait
 * qu'un nid contesté par trois personnes paraîtrait plus vivant qu'un nid
 * tranquille.
 */
export function dernierSigneDeVie(
  creeLe: Date | string,
  derniereConfirmation: Date | string | null | undefined,
): Date {
  const cree = new Date(creeLe);
  if (!derniereConfirmation) return cree;
  const conf = new Date(derniereConfirmation);
  return conf > cree ? conf : cree;
}

/** Jours écoulés depuis le dernier signe de vie. Jamais négatif. */
export function silenceEnJours(dernierSigne: Date | string, maintenant: Date): number {
  const ms = maintenant.getTime() - new Date(dernierSigne).getTime();
  return Math.max(0, ms / 86_400_000);
}

/**
 * Ce signalement a-t-il cessé de compter ?
 *
 * ⚠️ « PÉRIMÉ » N'EST PAS UN STATUT, ET C'EST DÉLIBÉRÉ. Ajouter une valeur à
 * l'énumération `FrelonStatut` aurait cassé silencieusement ce qui l'indexe :
 * `statsFrelon` fait `s[n.statut] += 1` sur un objet aux quatre clés connues —
 * un cinquième statut y produit `NaN`, et le compteur affiché à l'apiculteur
 * devient vide sans qu'aucune erreur ne remonte. La péremption est donc une
 * PROPRIÉTÉ DU TEMPS, calculée à la lecture, et non un état gravé en base :
 * rien à migrer, rien à faire tourner, et un nid re-signalé redevient visible
 * le jour même.
 */
export function estPerime(silenceJours: number): boolean {
  return silenceJours >= PEREMPTION_JOURS;
}

/**
 * Statut communautaire dérivé des votes de comptes distincts.
 * Détruit > Rejeté > Confirmé > À vérifier (priorité descendante).
 */
export function statutCommunautaire(v: CompteurVotes): FrelonStatut {
  if (v.destructions >= SEUIL_DETRUIT) return 'detruit';
  if (v.infirmations - v.confirmations >= SEUIL_REJET) return 'rejete';
  if (v.confirmations - v.infirmations >= SEUIL_CONFIRME) return 'confirme';
  return 'a_verifier';
}

/** Variation de réputation de l'auteur lors d'une bascule de statut. */
export function deltaReputation(ancien: FrelonStatut, nouveau: FrelonStatut): number {
  if (ancien === nouveau) return 0;
  if (nouveau === 'confirme') return REPUTATION_CONFIRME;
  if (nouveau === 'rejete') return -REPUTATION_REJETE;
  // Retour depuis confirmé/rejeté (votes qui s'inversent) → on annule le gain/perte.
  if (ancien === 'confirme') return -REPUTATION_CONFIRME;
  if (ancien === 'rejete') return REPUTATION_REJETE;
  return 0;
}

/**
 * Un signalement situé : ce n'est PAS une simple coordonnée, il porte un id.
 *
 * ⚠️ Il s'appelait `PointGeo`, comme le `{ lat, lng }` de `useCarteCollab` —
 * deux formes DIFFÉRENTES sous un même nom, toutes deux auto-importées.
 * L'auto-import retenait celle-ci, avec son `id` OBLIGATOIRE : un composant
 * qui écrivait `const p: PointGeo = { lat, lng }` se voyait réclamer un champ
 * qui n'a aucun sens pour un centre de carte.
 */
export interface PointSignalement {
  id: string;
  lat: number;
  lng: number;
}

function metres(a: PointSignalement, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Cherche un signalement existant assez proche pour être considéré comme le
 * MÊME nid (dédoublonnage anti-spam). Retourne son id, ou null.
 */
export function trouverDoublon(
  cible: { lat: number; lng: number },
  existants: PointSignalement[],
  rayonM = RAYON_DOUBLON_M,
): string | null {
  let best: { id: string; d: number } | null = null;
  for (const e of existants) {
    const d = metres(e, cible);
    if (d <= rayonM && (!best || d < best.d)) best = { id: e.id, d };
  }
  return best?.id ?? null;
}

/**
 * CE QU'ON DIT À L'APICULTEUR DU SILENCE D'UN SIGNALEMENT.
 *
 * ⚠️ ANNONCER LA DISPARITION EST LA MOITIÉ DU TRAVAIL. Un nid qui s'efface sans
 * prévenir est une information perdue : l'apiculteur qui le croise chaque
 * semaine n'a aucune raison de le confirmer s'il ignore qu'il va partir. On
 * nomme donc l'échéance, et le geste qui l'annule.
 *
 * Rend `null` tant qu'il n'y a rien à dire — la carte reste silencieuse quand
 * tout va bien.
 */
export function messageDeSilence(silenceJours: number): string | null {
  if (estPerime(silenceJours)) {
    return 'Sans nouvelles depuis plus de quatre mois — ce signalement a quitté la carte.';
  }
  const restant = Math.ceil(PEREMPTION_JOURS - silenceJours);
  if (restant > 30) return null;
  const semaines = Math.max(1, Math.round(restant / 7));
  return (
    `Sans nouvelles depuis ${Math.floor(silenceJours)} jours. Il quittera la carte dans ` +
    `${semaines === 1 ? 'une semaine' : `${semaines} semaines`} — confirmez-le si le nid est ` +
    'toujours là.'
  );
}
