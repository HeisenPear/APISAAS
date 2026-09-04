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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ LE CŒUR DE LA FORMULE A DÉMÉNAGÉ DANS `app/utils/prixLigne.ts`.
 *
 * Il ne s'agit pas d'un rangement : ce que l'apiculteur IMPRIME et ce qu'il
 * LIT en saisissant sont calculés par des expressions écrites dans les PAGES,
 * qu'aucun serveur n'a vues. Elles disaient toutes « quantité × prixUnitaire »
 * — donc 100 € là où la base stockait 2 500 €, sur le bon de livraison qui
 * part avec la marchandise. Une formule ne peut pas être unique si elle n'est
 * pas atteignable des deux côtés.
 *
 * Ce module RÉEXPORTE le cœur au lieu de le redéfinir, pour que Nitro continue
 * de l'auto-importer sous les mêmes noms — et pour qu'il n'existe aucune
 * seconde définition à faire diverger. Les deux espaces d'auto-import sont
 * disjoints (Nitro ne voit que `server/utils`, Nuxt que `app/utils` et
 * `app/composables`), donc ce réexport ne fabrique pas le second chemin que
 * `collisionsAutoImport` interdit : chaque espace garde un seul exportateur.
 *
 * Ce qui RESTE ici est ce qui n'a de sens qu'au serveur : les totaux d'un
 * document entier, la remise, et le chemin inverse depuis un TTC.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ⚠️ ON IMPORTE ET ON RÉEXPORTE — LES DEUX, ET C'EST NÉCESSAIRE.
 *
 * `export { x } from '…'` ne crée AUCUNE liaison locale : il ouvre un chemin
 * pour les autres, pas pour soi. Écrit sans la ligne d'import ci-dessous,
 * `computeFactureTotals` levait `ReferenceError: ligneTotalHt is not defined`
 * — donc toute création et toute édition de facture.
 *
 * Et `npm run typecheck` NE L'A PAS VU : mesuré, zéro erreur sur ce défaut
 * exact. Nitro déclare les exports de `server/utils/` comme des globales
 * d'auto-import, si bien que TypeScript trouvait le nom sans se demander si le
 * module qui l'exporte peut se l'auto-importer à lui-même. Ce sont les bancs
 * qui l'ont attrapé, à l'exécution — et `reexportSansLiaison.test.ts` le tient
 * désormais pour tout le serveur.
 */
import { nombreMonetaire as toNum, ligneTotalHt, ligneTva, round2 } from '~~/app/utils/prixLigne';

export type { ModePrix, LignePricingInput } from '~~/app/utils/prixLigne';
export { round2, ligneTotalHt, ligneTva } from '~~/app/utils/prixLigne';

/**
 * LE CHEMIN INVERSE : d'un montant TTC vers son HT et sa TVA.
 *
 * ⚠️ IL EXISTE PARCE QU'UNE DÉPENSE SE DICTE EN TTC, ET QU'UNE FACTURE SE
 * SAISIT EN HT. L'apiculteur qui dit à Maya « j'ai acheté 200 euros de candi »
 * lit le total de son ticket de caisse — un TTC. Le formulaire d'achat, lui,
 * saisit des lignes HT et ajoute la TVA par-dessus. Traiter les 200 € comme un
 * HT aurait écrit 240 € en base : Maya aurait répondu « c'est noté, 200 € »
 * pendant que le tableau de bord affichait 240. C'est exactement la classe de
 * défaut que `statutsFacture.ts` vient de fermer sur le chiffre d'affaires —
 * un chiffre annoncé qui n'est pas celui qu'on enregistre.
 *
 * Elle vit ICI et pas chez l'appelant parce que ce module est le seul autorisé
 * à écrire une formule monétaire (cf. `tests/unit/server/argentUneSeuleRegle`).
 * La TVA reste calculée par `ligneTva` : une seule formule de TVA, y compris
 * quand on l'aborde par l'autre bout.
 *
 * ⚠️ LE TTC RENDU PEUT DIFFÉRER D'UN CENTIME DU TTC DONNÉ, et c'est assumé :
 * deux arrondis successifs ne se rattrapent pas toujours (99,99 € à 20 %
 * redonne 99,99 €, mais certains montants tombent à un centime près). On rend
 * donc le total RECALCULÉ, jamais le montant d'entrée : c'est celui qui sera
 * écrit en base, et c'est donc celui qu'il faut montrer avant de confirmer.
 */
export function totauxDepuisTtc(
  ttc: number | string | null | undefined,
  tauxTva: number | string | null | undefined,
): { sousTotal: number; tva: number; total: number } {
  const montant = toNum(ttc);
  const taux = toNum(tauxTva);
  const sousTotal = round2(montant / (1 + taux / 100));
  const tva = ligneTva(sousTotal, taux);
  return { sousTotal, tva, total: round2(sousTotal + tva) };
}

/**
 * UNE SAISIE FAITE EN TTC — une dépense dictée, un ticket de caisse.
 *
 * ⚠️ ELLE EXISTE PARCE QUE LE CHEMIN NAÏF PERD DES CENTIMES, ET QUE ÇA SE VOIT.
 * Remonter le TTC UNITAIRE vers un HT unitaire puis le multiplier fait passer
 * « 10 hausses à 25 € » par : 25 / 1,2 = 20,83 (arrondi), × 10 = 208,30,
 * + TVA = **249,96 €**. Quatre centimes évaporés sur un achat de 250 €, et
 * l'apiculteur voit un nombre qu'il n'a pas dit.
 *
 * L'ordre correct est l'inverse : on TOTALISE d'abord en TTC (quantité × prix
 * TTC), puis on redescend UNE SEULE FOIS vers le HT. 250 / 1,2 = 208,33,
 * + 41,67 = 250,00 €. Exactement ce qui a été dicté.
 *
 * ⚠️ ET C'EST POURQUOI ELLE NE REND QU'UNE LIGNE. Le total de la ligne EST le
 * sous-total de l'en-tête, donc ils ne peuvent pas diverger. À plusieurs
 * lignes il faudrait RÉPARTIR l'arrondi du HT entre elles — un problème
 * d'allocation réel, qu'on ne résout pas ici tant que personne n'en a besoin.
 * Le prix unitaire HT rendu est ARRONDI pour l'affichage : c'est le total de
 * la ligne qui fait foi, pas sa multiplication.
 */
export interface SaisieTtc {
  description: string;
  quantite: number | string | null | undefined;
  /** Prix unitaire TTC, tel qu'il est lu sur le ticket. */
  ttcUnitaire: number | string | null | undefined;
  tauxTva: number | string | null | undefined;
}

export interface LigneCalculee {
  description: string;
  quantite: number;
  /** HT unitaire, arrondi — indicatif. Le `total` fait foi. */
  prixUnitaire: number;
  tauxTva: number;
  /** HT de la ligne, égal au sous-total puisqu'il n'y a qu'une ligne. */
  total: number;
}

export function totauxSaisieTtc(saisie: SaisieTtc): {
  lignes: LigneCalculee[];
  sousTotal: number;
  tva: number;
  total: number;
} {
  const quantite = Math.max(toNum(saisie.quantite), 0);
  const ttcTotal = round2(quantite * toNum(saisie.ttcUnitaire));
  const { sousTotal, tva, total } = totauxDepuisTtc(ttcTotal, saisie.tauxTva);
  return {
    lignes: [
      {
        description: saisie.description,
        quantite,
        prixUnitaire: quantite > 0 ? round2(sousTotal / quantite) : 0,
        tauxTva: toNum(saisie.tauxTva),
        total: sousTotal,
      },
    ],
    sousTotal,
    tva,
    total,
  };
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
