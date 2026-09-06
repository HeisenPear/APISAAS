/**
 * CADENCE DU CINÉMATIQUE D'ONBOARDING.
 *
 * Chaque bloc d'une scène porte déjà son animation d'entrée dans
 * `maya-onboarding.css`. Ce qui les fait se dérouler l'un APRÈS l'autre — au
 * lieu d'apparaître tous ensemble — c'est le retard posé élément par élément.
 *
 * Dans la maquette de référence, ce retard était écrit en ligne dans le JSX
 * (`style={{ animationDelay: … }}`), donc il n'est PAS passé dans l'extraction
 * du CSS. Sans lui, les keyframes sont exactes mais la scène tombe à plat :
 * les trois piliers surgissent d'un bloc au lieu d'arriver pendant que Maya
 * parle. C'est le défaut qu'on a mis le plus longtemps à voir.
 *
 * Les valeurs d'amorce et de pas viennent de
 * `design/maya/mockup/onboarding/Maya - La naissance.html` — à reporter, jamais
 * à réestimer.
 */
export function cascade(i: number, amorce: number, pas: number): Record<string, string> {
  return { animationDelay: `${(amorce + i * pas).toFixed(2)}s` };
}
