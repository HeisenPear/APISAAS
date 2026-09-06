/**
 * QUAND UNE TRANSACTION PEUT-ELLE ENCORE ÊTRE SUPPRIMÉE ?
 *
 * La règle vit ici, en UNE fonction, parce qu'elle a déjà divergé deux fois
 * entre routes sœurs : le `DELETE` de facture n'avait pas le garde du `PUT`,
 * puis le garde ajouté au `DELETE` s'est révélé PLUS LARGE que son motif.
 *
 * ⚠️ CE QUE LE SECOND DÉFAUT A COÛTÉ. La règle « une facture émise ne se
 * supprime pas » a été posée sur TOUTE la table `transactions` — or elle
 * porte aussi les ACHATS, et un achat naît avec un numéro (AC-AAAA-NNNN) et
 * le statut « payee ». Toutes les dépenses sont donc devenues indélébiles,
 * dès la première, et le refus conseillait de « créer une facture d'avoir » —
 * un geste sans aucun sens pour ce qu'on a soi-même acheté. La page Achats
 * proposait pourtant « Supprimer » à deux endroits.
 *
 * LA DISTINCTION EST JURIDIQUE, PAS TECHNIQUE :
 *
 *   · une VENTE émise porte un numéro opposable. `genererNumeroFacture`
 *     reprend le plus grand numéro existant : supprimer la dernière émise
 *     ferait réattribuer le sien, et deux documents circuleraient sous le même
 *     — ce que l'article 242 nonies A du CGI interdit. Le client a de plus
 *     déjà reçu le PDF. La sortie est l'AVOIR, et elle existe.
 *
 *   · un ACHAT est le relevé que l'apiculteur tient de ses propres dépenses.
 *     Son numéro est un repère interne : rien n'a été envoyé à personne,
 *     aucune séquence opposable n'en dépend, et l'avoir n'a pas de sens. Se
 *     tromper de montant en saisissant un sac de sucre doit se corriger en
 *     supprimant la ligne.
 */

/** Ce que la règle a besoin de savoir d'une transaction — rien de plus. */
export interface TransactionASupprimer {
  type: 'vente' | 'achat';
  statut: string;
  numero: string | null;
}

/**
 * La phrase de refus, ou `null` si la suppression est permise.
 *
 * ⚠️ ELLE REND UNE PHRASE, PAS UN BOOLÉEN, et c'est délibéré : « le refus est
 * une PHRASE, jamais un code », et la phrase doit nommer la sortie. Rendre un
 * booléen laisserait chaque appelant réinventer le message — c'est ainsi que
 * les règles divergent.
 */
export function refusDeSuppression(t: TransactionASupprimer): string | null {
  // Un achat se supprime toujours : c'est le relevé de l'apiculteur, pas une
  // pièce opposable à un tiers.
  if (t.type !== 'vente') return null;

  // Une vente qui n'a jamais été émise — ni numéro, ni statut au-delà du
  // brouillon — n'a rien troué. On exige les DEUX conditions parce qu'elles ne
  // coïncident pas toujours et qu'aucune seule ne suffit.
  if (!t.numero && t.statut === 'brouillon') return null;

  return (
    'Cette facture est émise : elle ne peut plus être supprimée. Son numéro appartient à ' +
    'une séquence légale continue. Pour l’annuler, créez une facture d’avoir depuis sa fiche.'
  );
}
