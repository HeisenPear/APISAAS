/**
 * Génère les numéros pour la création EN MASSE de ruches.
 * `prefixe` est conservé tel quel (ex. « R- », « Ruche  ») ; on y accole un
 * compteur de `depart` à `depart + quantite - 1`. Ex : ('R', 1, 3) → ['R1','R2','R3'].
 *
 * Bornes défensives : quantité 1..2000, départ ≥ 0 — alignées sur le schéma serveur.
 */
export const BULK_RUCHES_MAX = 2000;

export function genererNumerosRuches(prefixe: string, depart: number, quantite: number): string[] {
  const start = Math.max(0, Math.floor(Number(depart) || 0));
  const n = Math.max(1, Math.min(BULK_RUCHES_MAX, Math.floor(Number(quantite) || 1)));
  const p = prefixe ?? '';
  return Array.from({ length: n }, (_, i) => `${p}${start + i}`);
}
