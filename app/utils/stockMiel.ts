/**
 * Valorisation du stock de miel — source de vérité unique.
 *
 * Formule métier :
 *
 *        n · m · p
 *  V  =  ─────────
 *          1000
 *
 *   - n = nombre de pots (quantité en stock)
 *   - m = poids d'un pot en grammes
 *   - p = prix au kilo (€ / kg)
 *
 * Le /1000 convertit les grammes en kilos : (n · m / 1000) = poids total en kg,
 * que l'on multiplie ensuite par le prix au kilo.
 *
 * Cette formule fonctionne pour n'importe quelle taille de pot (125 g, 500 g,
 * seau de 25 kg…) et corrige le calcul d'origine (quantité × prixUnitaire) qui
 * surévaluait le stock en ignorant le poids unitaire du conditionnement.
 */

import { CONDITIONNEMENTS_MIEL } from '~/types/enums';

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Champs nécessaires au calcul — sous-ensemble du type Stock. */
export interface StockMielValorisable {
  quantite?: number | string | null;
  prixUnitaire?: number | string | null;
  conditionnement?: string | null;
  /** Contenance d'une unité (ex: 25 pour un seau de 25 kg) — fallback. */
  contenance?: number | string | null;
  /** Unité de la contenance ('g' | 'kg' | 'L'). */
  uniteContenance?: string | null;
}

/**
 * Poids d'un pot/unité en grammes (le « m » de la formule).
 *
 * Priorité :
 *   1. Conditionnement normalisé (pot250 → 250 g, seau25kg → 25000 g…)
 *   2. Champ `contenance` + `uniteContenance` (saisie libre)
 *   3. Vrac / inconnu → 1000 g : la quantité est alors déjà exprimée en kg,
 *      donc V = n · 1000 · p / 1000 = n · p (cohérent avec le stock en vrac).
 */
export function poidsUnitaireGrammes(stock: StockMielValorisable): number {
  const cond = CONDITIONNEMENTS_MIEL.find((c) => c.value === stock.conditionnement);
  if (cond && cond.poids != null) {
    return cond.poids * 1000; // poids enum en kg → g
  }

  const contenance = toNum(stock.contenance);
  if (contenance > 0) {
    switch (stock.uniteContenance) {
      case 'g':
        return contenance;
      case 'kg':
      case 'L': // densité miel ≈ 1, approximation acceptable
        return contenance * 1000;
      default:
        return contenance * 1000;
    }
  }

  // Vrac ou conditionnement inconnu : quantité supposée en kg.
  return 1000;
}

/** Poids total du stock en kilos : (n · m) / 1000. */
export function poidsTotalMielKg(stock: StockMielValorisable): number {
  const n = toNum(stock.quantite);
  const m = poidsUnitaireGrammes(stock);
  return (n * m) / 1000;
}

/**
 * Valeur du stock de miel : V = (n · m · p) / 1000.
 *
 * @returns valeur en euros (HT, le prixUnitaire étant exprimé HT).
 */
export function valeurStockMiel(stock: StockMielValorisable): number {
  const p = toNum(stock.prixUnitaire);
  return poidsTotalMielKg(stock) * p;
}
