/**
 * Règle de décimales pour les quantités de stock.
 *
 * Par défaut, une quantité de stock est un entier (cadres, hausses, corps, pots,
 * pièces, équipement…). Les décimales n'ont de sens que pour les articles mesurés
 * au poids/volume (sirop de nourrissement en kg/L, traitements en ml/g, miel vendu
 * au kilo…). Cette fonction centralise ce choix, partagée par le front et l'API.
 */

/** Unités de poids/volume où les décimales sont pertinentes. */
const DECIMAL_UNITS = new Set([
  'kg',
  'kilo',
  'kilos',
  'kilogramme',
  'kilogrammes',
  'g',
  'gr',
  'gramme',
  'grammes',
  'l',
  'litre',
  'litres',
  'ml',
  'cl',
  'dl',
  't',
  'tonne',
  'tonnes',
]);

/** Catégories de stock intrinsèquement mesurées au poids/volume. */
const DECIMAL_CATEGORIES = new Set(['nourrissement', 'traitement']);

/**
 * Les quantités décimales sont-elles autorisées pour cet article ?
 * @param unite     unité saisie (ex: "kg", "pots", "pièces")
 * @param categorie catégorie de stock (ex: "nourrissement", "cadres")
 */
export function allowsDecimalQuantity(unite?: string | null, categorie?: string | null): boolean {
  const u = (unite ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (DECIMAL_UNITS.has(u)) return true;
  if (categorie && DECIMAL_CATEGORIES.has(categorie)) return true;
  return false;
}

/**
 * Normalise une quantité selon la règle : arrondit à l'entier si les décimales
 * ne sont pas autorisées pour cet article, sinon arrondit à 2 décimales.
 */
export function normalizeStockQuantity(
  value: number,
  unite?: string | null,
  categorie?: string | null,
): number {
  if (!allowsDecimalQuantity(unite, categorie)) return Math.round(value);
  return Math.round(value * 100) / 100;
}
