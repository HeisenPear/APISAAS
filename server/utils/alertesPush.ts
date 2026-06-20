// ═══════════════════════════════════════════════════════════
// Push ADAPTATIF : éviter d'inonder l'utilisateur.
// Quand un run de génération produit beaucoup d'alertes d'un coup
// (ex. création en masse de ruches, parc qui dépasse le délai de visite),
// on envoie UN push résumé au lieu d'un par alerte.
// ═══════════════════════════════════════════════════════════

export type PrioriteAlerte = 'basse' | 'moyenne' | 'haute' | 'critique';

/** Au-delà de ce nombre de nouvelles alertes pushables, on agrège en un seul push. */
export const PUSH_GROUPE_SEUIL = 3;

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
