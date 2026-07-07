// Score d'emplacement de transhumance : « vaut-il le coup de poser ses ruches
// ici, maintenant ? ». Combine 3 axes : le terrain (rayon de butinage, occupation
// du sol réelle), les miellées possibles (floraisons compatibles à cette
// saison/altitude) et la météo du moment. Fonctions pures → testables.

import type { Floraison } from '~/utils/floraisons';

/** Score miellées 0-100 : potentiel cumulé des floraisons compatibles ici. */
export function scoreFloraisons(
  compatibles: Pick<Floraison, 'potentielProductionKgRuche'>[],
): number {
  const total = compatibles.reduce(
    (s, f) => s + (Number(f.potentielProductionKgRuche ?? 0) || 0),
    0,
  );
  // ~50 kg de potentiel cumulé = excellent (100).
  return Math.round(Math.min(100, (total / 50) * 100));
}

export interface ComposantesScore {
  /** Potentiel mellifère du terrain (rayon de butinage), 0-100 ou null si pas encore chargé. */
  butinage: number | null;
  /** Potentiel des miellées compatibles, 0-100. */
  floraisons: number;
  /** Conditions météo du moment, 0-100 ou null. */
  meteo: number | null;
}

export interface ScoreEmplacement {
  global: number;
  label: 'faible' | 'moyen' | 'bon' | 'excellent';
  butinage: number | null;
  floraisons: number;
  meteo: number | null;
}

const POIDS = { butinage: 0.45, floraisons: 0.35, meteo: 0.2 };

/**
 * Combine les 3 axes en un score global (pondéré). Les composantes absentes
 * (non encore chargées) sont ignorées et les poids renormalisés.
 */
export function scoreEmplacement(c: ComposantesScore): ScoreEmplacement {
  const parts: Array<{ v: number; w: number }> = [{ v: c.floraisons, w: POIDS.floraisons }];
  if (c.butinage != null) parts.push({ v: c.butinage, w: POIDS.butinage });
  if (c.meteo != null) parts.push({ v: c.meteo, w: POIDS.meteo });
  const sw = parts.reduce((s, p) => s + p.w, 0) || 1;
  const global = Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / sw);
  const label =
    global >= 75 ? 'excellent' : global >= 55 ? 'bon' : global >= 35 ? 'moyen' : 'faible';
  return { global, label, butinage: c.butinage, floraisons: c.floraisons, meteo: c.meteo };
}
