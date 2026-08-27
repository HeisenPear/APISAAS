// Validation communautaire des signalements de frelons (anti-fraude, type Waze).
// Logique PURE et testable : score de fiabilité + statut dérivé des votes.
import type { FrelonStatut } from '~/config/frelon';

/** Votes nets de comptes DISTINCTS pour valider / rejeter / acter une destruction. */
export const SEUIL_CONFIRME = 2;
export const SEUIL_REJET = 2;
export const SEUIL_DETRUIT = 2;
/** Décroissance lente (un nid persiste des semaines) — fiabilité érodée sur ~75 j. */
export const DECAY_JOURS = 75;
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
 * (asymétrie anti-faux), et s'érode avec le temps tant qu'aucune confirmation
 * n'est venue. Une infirmation pèse 1,5× une confirmation.
 */
export function scoreFiabilite(
  v: CompteurVotes,
  reputationAuteur: number,
  ageJours: number,
): number {
  let s = 50 + clamp(reputationAuteur, -30, 30);
  s += v.confirmations * 12;
  s -= v.infirmations * 18;
  if (v.confirmations === 0 && ageJours > 0) {
    s -= Math.min(40, (ageJours / DECAY_JOURS) * 40);
  }
  return Math.round(clamp(s, 0, 100));
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
