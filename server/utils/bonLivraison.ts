import { z } from 'zod';
import { ligneTotalHt } from '~~/server/utils/pricing';
import { quantiteEffective } from '~~/app/utils/bonLivraisonLigne';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LES LIGNES D'UN BON DE LIVRAISON — UN SEUL SCHÉMA, UN SEUL CALCUL.
 *
 * ⚠️ IL Y EN AVAIT DEUX, ET ELLES AVAIENT DÉJÀ DIVERGÉ.
 *
 * La création (`bons-livraison/index.post.ts`) acceptait `modePrix`,
 * `contenance` et `uniteContenance`, et recalculait le total avec
 * `ligneTotalHt`. L'édition (`bons-livraison/[id].put.ts`) ne connaissait
 * aucun de ces trois champs et écrivait `lignes: body.lignes` — donc le total
 * ENVOYÉ PAR LE CLIENT, tel quel.
 *
 * Deux conséquences, toutes deux sur un document qui devient une facture
 * NUMÉROTÉE (les routes `convertir` et `facturer-groupe` reprennent ces
 * montants) :
 *
 * 1. Le serveur signait un total qu'il n'avait pas calculé. `pricing.ts` le
 *    dit pourtant en capitales depuis le premier jour : « NE JAMAIS faire
 *    confiance au total envoyé par le client : le serveur recalcule toujours ».
 *    La règle était écrite ; une des deux routes ne la suivait pas.
 *
 * 2. Zod retire les clés qu'il ne connaît pas. Éditer un bon — même pour
 *    corriger une simple description — effaçait donc `modePrix`, `contenance`
 *    et `uniteContenance` de chaque ligne. Un bon en tarif au poids, dix seaux
 *    de 25 kg à 10 €/kg, perdait ce qui justifie ses 2 500 € ; réédité ensuite
 *    dans la facture, il retombait à 10 × 10 = 100 €. C'est « le bug d'origine »
 *    nommé dans `pricing.ts`, ressuscité par le schéma de l'autre porte.
 *
 * Aujourd'hui l'interface n'appelle cette route qu'avec `{ statut }`, jamais
 * avec des lignes : le défaut est ARMÉ, pas vivant. Il se déclenche au premier
 * écran « modifier les lignes du bon », et la route est de toute façon un
 * point d'entrée authentifié comme un autre.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Les champs qu'un client a le droit de saisir sur une ligne de bon.
 *
 * `total` n'en fait PAS partie, volontairement : Zod retire les clés inconnues,
 * donc un total envoyé par le client est jeté sans bruit et recalculé.
 */
export const ligneBonLivraisonSchema = z
  .object({
    description: z.string().trim().min(1),
    quantite: z.coerce.number().min(0.01),
    /**
     * CE QUI A ÉTÉ REMIS, quand ça diffère de ce qui a été commandé.
     *
     * ⚠️ ZÉRO EST UNE VALEUR VALIDE, ET C'EST TOUT L'INTÉRÊT : « le client
     * n'en a finalement pas voulu » doit pouvoir s'écrire, et rendre au stock
     * la totalité de la marchandise. C'est pourquoi le minimum est 0 ici alors
     * qu'il est de 0,01 sur la quantité commandée — commander zéro pot n'a
     * aucun sens, en livrer zéro en a un.
     *
     * `.optional()` sans `.default()` : une ligne qui ne porte pas la clé
     * n'a rien constaté, et la quantité commandée fait foi. Un défaut à zéro
     * ferait basculer d'un coup tous les bons déjà en base à « rien livré ».
     */
    quantiteLivree: z.coerce.number().min(0).optional(),
    prixUnitaire: z.coerce.number().min(0).optional(),
    tauxTva: z.coerce.number().min(0).max(100).default(5.5),
    modePrix: z.enum(['format', 'poids']).optional(),
    contenance: z.coerce.number().min(0).optional(),
    uniteContenance: z.string().max(20).optional(),
    stockId: z.string().uuid().optional(),
    typeMiel: z.string().max(100).optional(),
    presentation: z.string().max(50).optional(),
    numLot: z.string().max(100).optional(),
    origineGeo: z.string().max(200).optional(),
    anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
  })
  /**
   * ⚠️ ON NE LIVRE PAS PLUS QUE CE QU'ON A COMMANDÉ.
   *
   * Livrer douze pots sur dix commandés n'est pas une livraison excédentaire :
   * c'est une commande qui a changé, et elle se corrige sur la quantité
   * commandée. Accepter l'écart ici fabriquerait un reliquat NÉGATIF, donc un
   * « bon du reliquat » qui RETIRE de la marchandise au lieu d'en ajouter —
   * et un mouvement de stock que plus rien n'explique.
   *
   * Le message nomme les deux chiffres : un refus est une phrase, jamais un
   * code (cf. CLAUDE.md).
   */
  .refine((l) => l.quantiteLivree === undefined || l.quantiteLivree <= l.quantite, {
    path: ['quantiteLivree'],
    message:
      'La quantité livrée ne peut pas dépasser la quantité commandée. Pour livrer davantage, ' +
      'corrigez d’abord la quantité commandée de la ligne.',
  });

export type LigneBonLivraisonSaisie = z.infer<typeof ligneBonLivraisonSchema>;

/**
 * Les lignes prêtes à être stockées : total calculé PAR LE SERVEUR.
 *
 * Une ligne sans prix unitaire reste sans total — un bon de livraison peut
 * légitimement n'annoncer que des quantités, le prix venant à la facturation.
 * On ne lui invente pas un total de 0 €.
 */
export function lignesBonLivraisonAvecTotaux(
  lignes: ReadonlyArray<LigneBonLivraisonSaisie>,
): Array<LigneBonLivraisonSaisie & { total: number | undefined }> {
  return lignes.map((l) => ({
    ...l,
    total:
      l.prixUnitaire != null
        ? ligneTotalHt({
            /**
             * ⚠️ LE TOTAL SUIT CE QUI EST PARTI, PAS CE QUI A ÉTÉ COMMANDÉ.
             *
             * C'est ce qui permet aux deux routes de conversion de continuer à
             * reprendre `l.total` TEL QUEL — leur commentaire le dit en toutes
             * lettres : « une conversion ne RE-TARIFE pas ». Si le total
             * restait celui de la commande, une livraison partielle produirait
             * une facture réclamant dix pots pour huit remis : exactement la
             * contradiction papier/facture que ce chantier ferme.
             */
            quantite: quantiteEffective(l),
            prixUnitaire: l.prixUnitaire,
            modePrix: l.modePrix,
            contenance: l.contenance,
          })
        : undefined,
  }));
}
