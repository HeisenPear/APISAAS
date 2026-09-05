/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CE QUI A ÉTÉ COMMANDÉ, ET CE QUI A ÉTÉ REMIS — DEUX QUANTITÉS, PAS UNE.
 *
 * Jusqu'ici une ligne de bon de livraison n'en portait qu'une. Le document
 * disait donc ce qui AURAIT DÛ partir, jamais ce qui a été reçu — alors que
 * c'est précisément la pièce qu'on produit quand un client conteste une
 * quantité. Livrer huit pots sur dix commandés n'avait aucune écriture
 * possible : il fallait soit mentir sur le bon, soit corriger la commande
 * après coup, ce qui efface la trace de ce qui s'est réellement passé.
 *
 * ⚠️ POURQUOI CE MODULE EXISTE AU LIEU D'UNE EXPRESSION RECOPIÉE.
 *
 * « La quantité qui compte » est lue à SIX endroits qui ne se parlent pas :
 * le calcul du total stocké, l'empreinte de stock, les deux routes de
 * conversion en facture, le document imprimé et le formulaire. Écrite six
 * fois, elle aurait divergé — c'est exactement ainsi que `modePrix` et
 * `contenance` ont disparu d'une recopie de `LigneBL`, et qu'un seau de 25 kg
 * à 10 €/kg s'est retrouvé livré, puis facturé, 100 €.
 *
 * ⚠️ ET POURQUOI PAS DANS `prixLigne.ts`.
 *
 * Ce module-là est LE module de l'argent : `argentUneSeuleRegle` et
 * `argentDansLesPages` le traitent comme la seule source autorisée d'une
 * formule monétaire. Une quantité livrée n'est pas une règle de prix, c'est un
 * fait de logistique. Les mélanger rendrait la frontière de ces deux bancs
 * floue, et une frontière floue finit par ne plus rien garder.
 *
 * Il vit dans `app/utils/` parce qu'il doit être atteignable des DEUX côtés :
 * le serveur en a besoin pour le total et le stock, les pages pour ce qu'elles
 * impriment. C'est le domicile à deux faces de ce dépôt — quinze fichiers de
 * `server/` y importent déjà. L'inverse tirerait un module serveur dans le
 * paquet du navigateur.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Le strict minimum qu'une ligne doit porter pour qu'on sache ce qui est parti.
 *
 * Volontairement plus étroit que `LigneBL` : ce module n'a aucune raison de
 * connaître un taux de TVA ou un numéro de lot, et un type large inviterait à
 * y ajouter des règles qui n'y ont pas leur place.
 */
export interface LigneLivrable {
  /** Ce que le client a commandé. Ne bouge pas quand on livre. */
  quantite: number | string | null | undefined;
  /**
   * Ce qui a été effectivement remis. `undefined` — et non zéro — tant que
   * personne ne l'a constaté : un bon en brouillon n'a rien livré, mais il
   * n'a pas non plus livré « zéro ». La distinction porte tout ce module.
   */
  quantiteLivree?: number | string | null;
}

function nombre(v: number | string | null | undefined): number {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Une quantité livrée a-t-elle été CONSTATÉE ? Zéro livré en est une. */
export function livraisonConstatee(ligne: LigneLivrable | null | undefined): boolean {
  const brute = ligne?.quantiteLivree;
  if (brute === null || brute === undefined || brute === '') return false;
  return Number.isFinite(typeof brute === 'string' ? Number(brute) : brute);
}

/**
 * LA QUANTITÉ QUI COMPTE — celle dont découlent le prix, le stock et la facture.
 *
 * ⚠️ TANT QUE RIEN N'EST CONSTATÉ, C'EST LA COMMANDE QUI FAIT FOI, et ce n'est
 * pas un détail d'implémentation : c'est ce qui rend le changement invisible
 * pour les milliers de bons DÉJÀ EN BASE. Aucun d'eux ne porte
 * `quantiteLivree` ; tous continuent donc de valoir, de coûter et de sortir du
 * stock exactement ce qu'ils valaient hier. Un correctif qui aurait fait
 * repartir la valeur de bons existants à zéro aurait été bien pire que le
 * défaut qu'il corrige.
 *
 * Une fois la livraison constatée, c'est elle qui gagne — y compris à zéro,
 * qui est le cas « le client n'a rien voulu prendre » et doit rendre au stock
 * la totalité de la marchandise.
 */
export function quantiteEffective(ligne: LigneLivrable | null | undefined): number {
  if (!ligne) return 0;
  return livraisonConstatee(ligne) ? nombre(ligne.quantiteLivree) : nombre(ligne.quantite);
}

/**
 * CE QUI RESTE À LIVRER sur une ligne. Jamais négatif.
 *
 * Livrer PLUS que commandé n'est pas un reliquat négatif, c'est une commande
 * qui a changé : le schéma de saisie le refuse en amont. On borne quand même
 * ici, parce qu'une donnée déjà en base ne repasse pas par le schéma — et
 * qu'un reliquat négatif fabriquerait un bon de rattrapage qui RETIRE de la
 * marchandise.
 */
export function quantiteReliquat(ligne: LigneLivrable | null | undefined): number {
  if (!ligne || !livraisonConstatee(ligne)) return 0;
  const reste = nombre(ligne.quantite) - nombre(ligne.quantiteLivree);
  return reste > 0 ? Math.round(reste * 100) / 100 : 0;
}

/** Une ligne dont il reste quelque chose à livrer. */
export function aUnReliquat(ligne: LigneLivrable | null | undefined): boolean {
  return quantiteReliquat(ligne) > 0;
}

/**
 * Le bon dans son ensemble a-t-il un reliquat ? C'est la condition d'affichage
 * du bouton « bon du reliquat », et la garde de la route qui le crée — la même
 * fonction des deux côtés, pour que l'écran ne propose jamais un geste que le
 * serveur refusera.
 */
export function bonAUnReliquat(lignes: ReadonlyArray<LigneLivrable> | null | undefined): boolean {
  return (lignes ?? []).some(aUnReliquat);
}

/**
 * Une livraison a-t-elle été constatée sur AU MOINS une ligne ? C'est ce qui
 * distingue « ce bon annonce ce qui doit partir » de « ce bon atteste ce qui
 * est parti » — et donc ce qui décide si le document imprime une colonne
 * « livré » ou reste un simple bordereau.
 */
export function bonPartiellementLivre(
  lignes: ReadonlyArray<LigneLivrable> | null | undefined,
): boolean {
  return (lignes ?? []).some(livraisonConstatee);
}
