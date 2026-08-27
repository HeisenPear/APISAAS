import { ligneTotalHt, ligneTva, round2 } from '~~/server/utils/pricing';
import type { ModePrix } from '~~/server/utils/pricing';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LE TARIF D'UNE COMMANDE DE CAMPAGNE — UNE SEULE FOIS, POUR LES DEUX PORTES.
 *
 * Une campagne groupée a deux entrées : le formulaire PUBLIC, où le client
 * commande lui-même, et la SAISIE ADMIN, où l'apiculteur tape la commande
 * qu'on vient de lui passer au téléphone. Les deux écrivent dans la même
 * table, et les deux chiffraient la commande avec leur propre arithmétique.
 *
 * ⚠️ DEUX ÉCARTS, TROUVÉS DANS CET ORDRE DE GRAVITÉ CROISSANTE.
 *
 * 1. VIVANT — la porte admin n'arrondissait rien. Elle stockait
 *    `totalLigneTva: 0.5445` là où la porte publique stocke `0,54`, et son
 *    total d'en-tête pouvait différer d'un centime sur une commande à
 *    plusieurs lignes : trois lignes à 9,90 € HT en TVA 5,5 % donnent 1,62 €
 *    par la porte publique (arrondi par ligne) et 1,63 € par la porte admin
 *    (arrondi une seule fois). La même commande, deux montants.
 *
 *    L'arrondi PAR LIGNE est le bon pour ce document : le bon de commande
 *    affiche un TTC par ligne, et ce qui est affiché doit s'additionner à ce
 *    qui est affiché. C'est la règle de la porte publique qui l'emporte donc.
 *
 * 2. ARMÉ — la porte admin calculait `prixUnitaireHt × quantite`, sans jamais
 *    regarder `modePrix` ni `contenance`. C'est exactement « le bug d'origine »
 *    que `pricing.ts` a été écrit pour supprimer : dix seaux de 25 kg à 10 €/kg
 *    valent 2 500 € et non 100 €. Aujourd'hui aucune route ne sait poser
 *    `modePrix: 'poids'` sur un produit de campagne, donc la colonne reste à
 *    `'format'` et l'écart ne se produit pas — mais le schéma, le formulaire
 *    public et la porte publique le gèrent déjà tous les trois. Le jour où le
 *    formulaire produit expose le mode poids, la porte admin facturerait 25
 *    fois moins, en silence, et la ligne stockée aurait perdu `modePrix` et
 *    `contenance`, donc plus rien en aval ne pourrait rattraper l'erreur.
 *
 * Une règle appelée deux fois ne peut plus diverger ; deux règles recopiées le
 * font toujours. C'est la classe de défaut la plus fréquente de ce dépôt.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Ce dont on a besoin d'un produit de campagne pour le chiffrer. */
export interface ProduitTarifable {
  id: string;
  nom: string;
  prixUnitaireHt: string | number;
  tauxTva: string | number;
  modePrix?: ModePrix | null;
  contenance?: string | number | null;
  uniteContenance?: string | null;
}

/** Ce que demande le client : un produit, une quantité. */
export interface LigneDemandee {
  produitId: string;
  quantite: number;
}

/** Une ligne chiffrée, telle qu'elle est stockée dans `commandes_groupees.lignes`. */
export interface LigneTarifee {
  produitId: string;
  nom: string;
  quantite: number;
  prixUnitaireHt: number;
  modePrix: ModePrix | null;
  contenance: number | null;
  uniteContenance: string | null;
  tauxTva: number;
  totalLigneHt: number;
  totalLigneTva: number;
  totalLigneTtc: number;
}

export interface CommandeTarifee {
  lignes: LigneTarifee[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
}

/**
 * Chiffre une commande de campagne. Les prix viennent TOUJOURS des produits
 * relus en base — jamais du corps de la requête.
 *
 * @param demandees les lignes demandées ; chaque `produitId` doit exister dans
 *                  `produits`, l'appelant l'ayant vérifié avant (c'est lui qui
 *                  sait quel message d'erreur rendre au client).
 */
export function tariferCommandeCampagne(
  demandees: ReadonlyArray<LigneDemandee>,
  produits: ReadonlyMap<string, ProduitTarifable>,
): CommandeTarifee {
  let totalHt = 0;
  let totalTva = 0;

  const lignes = demandees.map((demandee): LigneTarifee => {
    const produit = produits.get(demandee.produitId);
    if (!produit) {
      // L'appelant vérifie l'appartenance AVANT d'appeler : arriver ici veut
      // dire que la vérification a été oubliée. On refuse plutôt que de
      // chiffrer une ligne à zéro — un « produit inconnu » facturé 0 € est
      // exactement le genre de silence qui coûte de l'argent.
      throw new Error(
        `tariferCommandeCampagne : produit ${demandee.produitId} absent de la campagne`,
      );
    }

    const totalLigneHt = ligneTotalHt({
      quantite: demandee.quantite,
      prixUnitaire: produit.prixUnitaireHt,
      modePrix: produit.modePrix,
      contenance: produit.contenance,
    });
    const totalLigneTva = ligneTva(totalLigneHt, produit.tauxTva);

    totalHt = round2(totalHt + totalLigneHt);
    totalTva = round2(totalTva + totalLigneTva);

    return {
      produitId: demandee.produitId,
      nom: produit.nom,
      quantite: demandee.quantite,
      prixUnitaireHt: Number(produit.prixUnitaireHt),
      modePrix: produit.modePrix ?? null,
      contenance: produit.contenance != null ? Number(produit.contenance) : null,
      uniteContenance: produit.uniteContenance ?? null,
      tauxTva: Number(produit.tauxTva),
      totalLigneHt,
      totalLigneTva,
      totalLigneTtc: round2(totalLigneHt + totalLigneTva),
    };
  });

  return { lignes, totalHt, totalTva, totalTtc: round2(totalHt + totalTva) };
}
