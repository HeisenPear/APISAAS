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
