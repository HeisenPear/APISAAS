/**
 * Règle de décimales pour les quantités de stock (côté serveur).
 * Doit rester identique à app/utils/stockQuantity.ts — duplication assumée pour
 * garder une frontière nette entre les bundles app et server (pas d'import croisé).
 * Cf. ce fichier app pour les explications détaillées.
 */

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

const DECIMAL_CATEGORIES = new Set(['nourrissement', 'traitement']);

export function allowsDecimalQuantity(unite?: string | null, categorie?: string | null): boolean {
  const u = (unite ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (DECIMAL_UNITS.has(u)) return true;
  if (categorie && DECIMAL_CATEGORIES.has(categorie)) return true;
  return false;
}
