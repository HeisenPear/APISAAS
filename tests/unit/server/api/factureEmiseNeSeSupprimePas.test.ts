// ═══════════════════════════════════════════════════════════════════════════
// UNE FACTURE ÉMISE NE SE SUPPRIME PAS.
//
// ⚠️ LA ROUTE `DELETE` L'AUTORISAIT, ET SA JUMELLE `PUT` LE REFUSAIT DÉJÀ.
//
// Le `PUT` dit en toutes lettres : « Cette facture est émise : son contenu ne
// peut plus être modifié. Pour la corriger, créez une facture d'avoir. » Le
// `DELETE`, lui, effaçait n'importe quelle transaction du propriétaire, sans
// regarder ni son statut ni son numéro. Deux conséquences :
//
//   · `genererNumeroFacture` reprend le PLUS GRAND numéro existant. Supprimer
//     la dernière facture émise fait RÉATTRIBUER son numéro — deux documents
//     différents sous le même, ce que l'article 242 nonies A du CGI interdit.
//     Et le client a déjà reçu le PDF Factur-X par courriel.
//   · le compteur `facturesParMois` est un `count(*)` de lignes VIVANTES :
//     émettre, envoyer, supprimer, recommencer libérait le quota à chaque
//     tour. Un Starter émettait quarante factures dans le mois sans jamais
//     voir son plafond.
//
// ⚠️ ET LE BOUTON ÉTAIT RENDU SUR TOUTES LES LIGNES. Proposer puis refuser au
// clic est la pire des séquences.
//
// ⚠️ ET LE GARDE AJOUTÉ ICI S'EST RÉVÉLÉ PLUS LARGE QUE SON MOTIF.
//
// Posé sur toute la table `transactions`, il valait aussi pour les ACHATS —
// or un achat naît avec un numéro (AC-AAAA-NNNN) et le statut « payee ».
// Toutes les dépenses sont devenues indélébiles dès la première, et le refus
// conseillait de « créer une facture d'avoir » : un geste sans aucun sens pour
// ce qu'on a soi-même acheté. Resté quelques heures en production.
//
// ⚠️ ET CE BANC N'A PAS VU LE SECOND DÉFAUT — il l'a même RATIFIÉ. Il
// cherchait la règle dans le TEXTE de la route (`existing.numero || …`) au
// lieu de la faire répondre. Le mot au lieu de l'appel : la chaîne était bien
// là, donc tout allait bien, et un achat indélébile passait sans un bruit. Pire
// encore, ces greps sont devenus ROUGES le jour où la règle a été extraite dans
// une fonction nommée — c'est-à-dire quand le code s'est AMÉLIORÉ.
//
// La règle vit désormais dans `server/utils/suppressionTransaction.ts` et se
// mesure par son comportement (cf. suppressionTransaction.test.ts, produit
// cartésien des vingt combinaisons). Ce banc-ci ne garde plus que ce qui lui
// est propre : que la route DÉLÈGUE au lieu de réimplémenter, et que les
// écrans ne proposent pas ce que la route refuse.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sansCommentaires } from '../../../helpers/sansCommentaires';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';
import { refusDeSuppression } from '~~/server/utils/suppressionTransaction';

const ROUTE = 'server/api/finances/factures/[id].delete.ts';
const PAGE = 'app/pages/finances/ventes.vue';

describe('la route refuse une facture émise', () => {
  it('garde-fou : la route lit bien le statut ET le numéro', () => {
    /**
     * Sans ce cas, une route qui ne les sélectionnerait plus rendrait la garde
     * inopérante en silence — `undefined` n'est ni un numéro ni un statut
     * différent de « brouillon », et tout repasserait.
     */
    const code = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    expect(code, 'le statut doit être lu').toMatch(/statut: transactions\.statut/);
    expect(code, 'le numéro aussi').toMatch(/numero: transactions\.numero/);
  });

  it('elle DÉLÈGUE la règle au lieu de la réimplémenter', () => {
    /**
     * ⚠️ ON N'EXIGE PLUS LA FORME DE LA CONDITION, ON EXIGE L'APPEL. La
     * version précédente cherchait `existing.numero || existing.statut !==
     * 'brouillon'` dans le texte de la route : elle ratifiait donc n'importe
     * quelle règle du moment que la chaîne y figurait — et c'est ainsi que
     * l'interdiction trop large des achats est passée. Elle est en plus
     * devenue rouge le jour où la règle a été extraite, c'est-à-dire quand le
     * code s'est amélioré.
     *
     * Ce qui compte est qu'il n'existe qu'UN endroit où la règle est écrite.
     */
    const code = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    expect(code, 'la route doit appeler la règle partagée').toMatch(/refusDeSuppression\(/);
    expect(
      code,
      'et ne pas en garder une copie : une règle écrite deux fois finit par diverger',
    ).not.toMatch(/statut !== 'brouillon'/);
  });

  it("et le comportement, lui, est bien celui qu'on attend", () => {
    /**
     * La règle FAIT RÉPONDRE la fonction, plutôt que de lire du texte. Son
     * balayage exhaustif vit dans `suppressionTransaction.test.ts` ; on garde
     * ici les deux bornes, pour qu'un lecteur de ce fichier voie la règle.
     */
    expect(
      refusDeSuppression({ type: 'vente', statut: 'envoyee', numero: 'FA-2026-0001' }),
      'une vente émise se refuse, et le refus nomme l’avoir',
    ).toMatch(/avoir/i);
    expect(
      refusDeSuppression({ type: 'achat', statut: 'payee', numero: 'AC-2026-0007' }),
      'une dépense se supprime — c’est le relevé de l’apiculteur, pas une pièce opposable',
    ).toBeNull();
  });
});

describe('l’écran ne propose pas ce que la route refuse', () => {
  it('le bouton « Supprimer » ne s’affiche que sur un BROUILLON sans numéro', () => {
    const gabarit = corpsDuComposant(PAGE);
    const i = gabarit.indexOf('Supprimer');
    expect(i, 'le bouton doit exister — sinon on ne mesure rien').toBeGreaterThan(0);

    // La condition du bloc qui porte le bouton : on remonte au `<UTooltip`.
    const debut = gabarit.lastIndexOf('<UTooltip', i);
    const bloc = gabarit.slice(debut, i);
    expect(
      bloc,
      'proposer puis refuser au clic est la pire des séquences : on ne propose plus',
    ).toMatch(/v-if="row\.statut === 'brouillon' && !row\.numero"/);
  });
});

describe('la règle vaut pour les DEUX chemins de modification', () => {
  it('le PUT refuse de MODIFIER une facture émise, le DELETE de la supprimer', () => {
    /**
     * ⚠️ C'EST L'ASYMÉTRIE QUI A CRÉÉ LE TROU : une route refusait, sa jumelle
     * non, et personne ne les comparait.
     *
     * ⚠️ MAIS LES DEUX RÈGLES NE SONT PAS LA MÊME, et le dire honnêtement vaut
     * mieux que de les confondre. Le `PUT` interdit de MODIFIER LE CONTENU
     * d'une pièce qui n'est plus un brouillon ; le `DELETE` interdit de
     * SUPPRIMER une VENTE émise. Une version précédente de ce cas exigeait la
     * même chaîne dans les deux, ce qui a poussé à écrire la même condition
     * des deux côtés — et donc à interdire aussi la suppression des achats.
     *
     * Le `PUT` garde sa condition en propre : elle ne touche pas les achats,
     * parce qu'aucun écran ne permet d'en modifier un (la page Achats n'offre
     * ni « Modifier » ni « Éditer », et `updateFacture` n'est appelé que
     * depuis les pages de vente). Si un jour l'édition d'un achat existe, ce
     * commentaire est l'endroit où le vérifier.
     */
    const put = sansCommentaires(readFileSync('server/api/finances/factures/[id].put.ts', 'utf-8'));
    expect(
      put,
      'le PUT ne regarde plus si la facture est émise — son contenu redeviendrait modifiable',
    ).toMatch(/statut !== 'brouillon'/);

    const del = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    expect(del, 'le DELETE doit appeler la règle partagée').toMatch(/refusDeSuppression\(/);
  });

  it('aucun écran ne permet de MODIFIER un achat — c’est ce qui rend le PUT inoffensif', () => {
    /**
     * Le garde du `PUT` refuserait un achat exactement comme le `DELETE` le
     * faisait (statut « payee » ≠ « brouillon »). Il ne nuit pas parce que le
     * chemin n'existe pas. Ce cas surveille cette hypothèse : si un bouton
     * d'édition apparaît sur la page Achats, il rougira et rappellera qu'il
     * faut alors étendre la distinction vente/achat au `PUT`.
     */
    const achats = corpsDuComposant('app/pages/finances/achats.vue');
    expect(
      /\bModifier\b|\bÉditer\b|\bEditer\b/.test(achats),
      'un bouton d’édition est apparu sur les achats : le PUT doit maintenant ' +
        'distinguer vente et achat, comme le DELETE',
    ).toBe(false);
  });
});
