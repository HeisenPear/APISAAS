/**
 * Calcul de prix centralisé — source de vérité unique pour TOUS les totaux
 * de lignes (ventes, achats, bons de livraison, commandes de campagne).
 *
 * Règle métier (cf. décision produit) :
 *   - mode 'format' : prix fixe par unité vendue   → total = quantité × prixUnitaire
 *   - mode 'poids'  : prix par unité de mesure (kg/L) → total = quantité × contenance × prixUnitaire
 *
 * Exemple : 10 seaux de 25 kg à 10 €/kg
 *   { quantite: 10, prixUnitaire: 10, modePrix: 'poids', contenance: 25 }
 *   → 10 × 25 × 10 = 2500 €  (et non 10 × 10 = 100 €, le bug d'origine)
 *
 * NE JAMAIS faire confiance au total envoyé par le client : le serveur
 * recalcule toujours via ces fonctions.
 */

export type ModePrix = 'format' | 'poids';

export interface LignePricingInput {
  quantite: number | string | null | undefined;
  prixUnitaire: number | string | null | undefined;
  modePrix?: ModePrix | null;
  /** Contenance d'une unité (ex: 25 pour un seau de 25 kg) — requis si modePrix = 'poids' */
  contenance?: number | string | null;
}

/** Arrondi monétaire à 2 décimales, robuste aux erreurs flottantes. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Total HT d'une ligne, arrondi à 2 décimales.
 *
 * En mode 'poids', si la contenance est absente/0 on retombe sur un calcul
 * format (quantité × prix) plutôt que de renvoyer 0 — évite de "perdre" une
 * ligne mal saisie.
 */
export function ligneTotalHt(input: LignePricingInput): number {
  const quantite = toNum(input.quantite);
  const prixUnitaire = toNum(input.prixUnitaire);

  if (input.modePrix === 'poids') {
    const contenance = toNum(input.contenance);
    if (contenance > 0) {
      return round2(quantite * contenance * prixUnitaire);
    }
    // contenance manquante en mode poids → fallback format (defensive)
  }

  return round2(quantite * prixUnitaire);
}

/** Montant de TVA d'une ligne à partir de son total HT et de son taux (%). */
export function ligneTva(totalHt: number, tauxTva: number | string | null | undefined): number {
  return round2((totalHt * toNum(tauxTva)) / 100);
}

export interface FactureLigneInput extends LignePricingInput {
  tauxTva?: number | string | null;
}

export interface FactureTotaux<T> {
  /** Lignes d'entrée enrichies de leur total HT recalculé serveur */
  lignes: Array<T & { total: number }>;
  /** HT brut (somme des lignes, avant remise) */
  sousTotal: number;
  /** Montant de la remise en euros */
  remiseMontant: number;
  /** HT net (après remise) */
  sousTotalNet: number;
  /** TVA totale (sur le HT remisé, ligne par ligne — taux mixtes possibles) */
  tva: number;
  /** TTC = HT net + TVA */
  total: number;
}

/**
 * Totaux d'une facture/vente — SOURCE DE VÉRITÉ UNIQUE partagée entre la
 * création (ventes.post) et l'édition (factures/[id].put), pour qu'une facture
 * créée et la même facture rééditée donnent EXACTEMENT les mêmes montants.
 *
 * - total de chaque ligne via ligneTotalHt (gère format vs poids/contenance) ;
 * - remise (%) appliquée sur le HT, proportionnellement sur chaque ligne pour
 *   la TVA ; TVA calculée par ligne (autorise des taux mixtes sur une facture) ;
 * - tous les montants arrondis à 2 décimales.
 */
export function computeFactureTotals<T extends FactureLigneInput>(
  lignes: T[],
  remise?: number | string | null,
): FactureTotaux<T> {
  const lignesWithTotals = lignes.map((l) => ({ ...l, total: ligneTotalHt(l) }));
  return { lignes: lignesWithTotals, ...totauxDepuisLignes(lignesWithTotals, remise) };
}

/**
 * Les totaux d'en-tête à partir de lignes DÉJÀ chiffrées.
 *
 * ⚠️ CETTE ARITHMÉTIQUE EXISTAIT EN TROIS EXEMPLAIRES. `computeFactureTotals`
 * la portait, et les deux routes qui transforment un bon de livraison en
 * facture — `convertir` et `facturer-groupe` — la réécrivaient à la main. Le
 * commentaire de `convertir.post.ts` raconte déjà l'histoire pour la
 * NUMÉROTATION : « la correction n'a jamais été back-portée sur les deux
 * routes de bons de livraison ». Ce sont les mêmes deux routes, et c'était le
 * même schéma : elles émettent de vraies factures numérotées, et toute
 * évolution de la règle de TVA ou de remise les aurait laissées derrière.
 *
 * Séparée de `computeFactureTotals` parce qu'une CONVERSION ne doit pas
 * re-tarifer : le bon de livraison porte les montants convenus à la livraison.
 * On partage donc l'arithmétique d'en-tête, pas le calcul des lignes.
 */
export function totauxDepuisLignes(
  lignes: ReadonlyArray<{ total: number; tauxTva?: number | string | null }>,
  remise?: number | string | null,
): Omit<FactureTotaux<never>, 'lignes'> {
  const remisePct = Math.min(Math.max(toNum(remise), 0), 100);
  const remiseRatio = remisePct > 0 ? (100 - remisePct) / 100 : 1;

  const sousTotal = round2(lignes.reduce((sum, l) => sum + l.total, 0));
  const remiseMontant = remisePct > 0 ? round2((sousTotal * remisePct) / 100) : 0;
  const sousTotalNet = round2(sousTotal - remiseMontant);
  const tva = round2(
    lignes.reduce((sum, l) => sum + (l.total * remiseRatio * toNum(l.tauxTva)) / 100, 0),
  );
  const total = round2(sousTotalNet + tva);

  return { sousTotal, remiseMontant, sousTotalNet, tva, total };
}
