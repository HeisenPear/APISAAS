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
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sansCommentaires } from '../../../helpers/sansCommentaires';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

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

  it('elle refuse sur le numéro OU sur le statut — pas l’un des deux', () => {
    /**
     * ⚠️ LES DEUX, ET C'EST DÉLIBÉRÉ. Ils ne coïncident pas toujours : une
     * ligne peut porter un numéro sans être passée « envoyée », et l'inverse
     * se produit sur un import. Aucun des deux seul ne suffit.
     */
    const code = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    expect(code).toMatch(/existing\.numero\s*\|\|\s*existing\.statut !== 'brouillon'/);
  });

  it('et le refus NOMME la sortie — un refus qui s’arrête au « non » est un mur', () => {
    const code = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    expect(code, 'l’avoir est le geste comptable prévu pour ça').toMatch(/avoir/i);
    expect(code, 'et jamais un code technique').not.toMatch(/badRequest\('[A-Z_]{4,}'\)/);
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
  it('le PUT et le DELETE refusent tous deux une facture émise', () => {
    /**
     * ⚠️ C'EST L'ASYMÉTRIE QUI A CRÉÉ LE TROU. Une route refusait, sa jumelle
     * non — et personne ne les comparait. On exige que les deux portent la
     * garde, pour qu'un troisième chemin ne naisse pas sans elle.
     */
    const put = sansCommentaires(readFileSync('server/api/finances/factures/[id].put.ts', 'utf-8'));
    const del = sansCommentaires(readFileSync(ROUTE, 'utf-8'));
    for (const [nom, code] of [
      ['PUT', put],
      ['DELETE', del],
    ] as const) {
      expect(
        code,
        `${nom} ne regarde pas si la facture est émise — le numéro est une séquence légale`,
      ).toMatch(/statut !== 'brouillon'/);
    }
  });
});
