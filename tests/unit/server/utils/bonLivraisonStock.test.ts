// ═══════════════════════════════════════════════════════════════════════════
// LE STOCK D'UN BON DE LIVRAISON — UNE SEULE MÉCANIQUE, QUATRE PORTES.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Quatre routes bougeaient le stock d'un bon, et elles ne se ressemblaient pas :
//
//   · création      : `quantite - ligne.quantite`, AUCUNE trace ;
//   · annulation    : `+ ligne.quantite`, une trace SANS referenceType ni
//                     referenceId, motif « Annulation BL » ;
//   · suppression   : `+ ligne.quantite`, AUCUNE trace ;
//   · édition       : RIEN DU TOUT.
//
// TROIS DÉFAUTS, dont deux qui font disparaître du stock pour de bon :
//
// 1. ÉDITER LES LIGNES PERDAIT DU STOCK. Créer un bon de dix pots retire dix.
//    Corriger la ligne à deux ne rend rien. Annuler ensuite réintègre DEUX —
//    la quantité alors stockée. Huit pots évaporés, sans mouvement pour
//    l'expliquer.
//
// 2. RÉ-OUVRIR UN BON ANNULÉ ne redéduisait jamais. Le schéma d'édition accepte
//    `statut: 'brouillon'` sur un bon annulé : le stock rendu à l'annulation
//    restait rendu, et la marchandise partait deux fois.
//
// 3. L'HISTORIQUE ÉTAIT INCOHÉRENT. `mouvements_stock` ne portait que l'entrée
//    « Annulation BL » — un mouvement annulant quelque chose qui n'avait jamais
//    été écrit. Impossible de rapprocher le stock de son historique, alors que
//    c'est ce que la table promet.
//
// ─── CE QUE CE BANC TIENT ──────────────────────────────────────────────────
// Les fonctions PURES (`empreinteStock`, `deltaStock`, `empreinteDuBon`) se
// mesurent sans base — c'est là que vit la règle. La partie qui écrit est
// vérifiée par `bonLivraisonRoutesStock.test.ts`, sur un double de base.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remettre `'annule'` dans STATUTS_QUI_TIENNENT_LE_STOCK ;
//   · faire renvoyer `lignes` à `empreinteDuBon` quel que soit le statut ;
//   · retirer l'agrégation par article dans `empreinteStock` ;
//   · émettre les variations nulles.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import type { LigneBL } from '~~/server/database/schema';
import {
  STATUTS_QUI_TIENNENT_LE_STOCK,
  deltaStock,
  empreinteDuBon,
  empreinteStock,
  tientLeStock,
} from '~~/server/utils/bonLivraisonStock';

const POTS = '11111111-1111-4111-8111-111111111111';
const SEAUX = '22222222-2222-4222-8222-222222222222';

function ligne(stockId: string | undefined, quantite: number): LigneBL {
  return { description: 'x', quantite, ...(stockId ? { stockId } : {}) };
}

describe('l’empreinte d’un bon sur le stock', () => {
  it('GARDE-FOU : elle compte bien les lignes liées à un article', () => {
    // Sans ce cas, une empreinte toujours vide rendrait tous les deltas nuls,
    // et le banc serait « conforme » sur zéro mouvement.
    expect(empreinteStock([ligne(POTS, 10)])).toEqual(new Map([[POTS, 10]]));
  });

  it('une ligne LIBRE ne touche pas au stock', () => {
    // Un bon peut porter une ligne saisie à la main, sans article : elle ne
    // correspond à rien d'inventorié, il n'y a rien à décrémenter.
    expect(empreinteStock([ligne(undefined, 10)]).size).toBe(0);
  });

  it('deux lignes du MÊME article s’additionnent', () => {
    /**
     * ⚠️ CE CAS N'EST PAS THÉORIQUE. Le formulaire ajoute une ligne par clic
     * sur un article : cliquer deux fois sur les mêmes pots donne deux lignes.
     * Un delta calculé ligne par ligne, sans agrégation, aurait écrit deux
     * mouvements dont le second aurait ÉCRASÉ le premier dans le raisonnement
     * — et l'édition n'aurait rendu que la moitié.
     */
    expect(empreinteStock([ligne(POTS, 6), ligne(POTS, 4)])).toEqual(new Map([[POTS, 10]]));
  });
});

describe('les états dans lesquels un bon tient du stock', () => {
  it('un bon ANNULÉ n’en tient aucun', () => {
    expect(tientLeStock('annule')).toBe(false);
    expect(empreinteDuBon('annule', [ligne(POTS, 10)])).toEqual([]);
  });

  it('brouillon, livré et facturé en tiennent — c’est la règle d’AUJOURD’HUI', () => {
    /**
     * ⚠️ CE CAS FIGE LA POLITIQUE ACTUELLE, DÉLIBÉRÉMENT.
     *
     * Le stock est retiré dès la CRÉATION : un brouillon tient déjà la
     * marchandise. L'apiculteur a demandé que ce soit à la LIVRAISON — un
     * changement qui touche des bons DÉJÀ EN BASE, donc une décision qui lui
     * appartient et qui n'est pas prise ici.
     *
     * Le jour où elle le sera, ce cas ROUGIRA. C'est voulu : c'est le seul
     * endroit à modifier, et il oblige à le faire sciemment plutôt que par
     * effet de bord.
     */
    expect([...STATUTS_QUI_TIENNENT_LE_STOCK]).toEqual(['brouillon', 'livre', 'facture']);
    for (const statut of ['brouillon', 'livre', 'facture']) {
      expect(empreinteDuBon(statut, [ligne(POTS, 3)])).toHaveLength(1);
    }
  });

  it('un statut inconnu ne tient RIEN — on ne devine pas', () => {
    // « null, default et inconnu ne doivent jamais valoir laisse passer » :
    // devant un état qu'on ne sait pas lire, on ne retire pas de marchandise.
    expect(tientLeStock('fantaisie')).toBe(false);
    expect(tientLeStock(null)).toBe(false);
    expect(tientLeStock(undefined)).toBe(false);
  });
});

describe('LA RÈGLE : le mouvement est le delta entre deux empreintes', () => {
  it('CRÉATION — de rien vers dix pots : une sortie de dix', () => {
    expect(deltaStock([], empreinteDuBon('brouillon', [ligne(POTS, 10)]))).toEqual([
      { stockId: POTS, variation: 10 },
    ]);
  });

  it('ÉDITION — dix pots corrigés à deux : une ENTRÉE de huit', () => {
    /**
     * LE DÉFAUT PRINCIPAL. L'édition ne bougeait rien : les huit pots
     * restaient déduits, et l'annulation n'en rendait que deux.
     */
    const avant = empreinteDuBon('brouillon', [ligne(POTS, 10)]);
    const apres = empreinteDuBon('brouillon', [ligne(POTS, 2)]);
    expect(deltaStock(avant, apres)).toEqual([{ stockId: POTS, variation: -8 }]);
  });

  it('ANNULATION — l’empreinte devient vide : on rend tout', () => {
    const avant = empreinteDuBon('livre', [ligne(POTS, 10), ligne(SEAUX, 3)]);
    const apres = empreinteDuBon('annule', [ligne(POTS, 10), ligne(SEAUX, 3)]);
    expect(deltaStock(avant, apres)).toEqual([
      { stockId: POTS, variation: -10 },
      { stockId: SEAUX, variation: -3 },
    ]);
  });

  it('RÉ-OUVERTURE — d’annulé à brouillon : le stock repart', () => {
    /**
     * Le cas que personne n'avait vu. Le schéma d'édition accepte
     * `statut: 'brouillon'` sur un bon annulé ; le stock rendu restait rendu,
     * et la marchandise pouvait partir deux fois.
     */
    const avant = empreinteDuBon('annule', [ligne(POTS, 10)]);
    const apres = empreinteDuBon('brouillon', [ligne(POTS, 10)]);
    expect(deltaStock(avant, apres)).toEqual([{ stockId: POTS, variation: 10 }]);
  });

  it('un article qui ne BOUGE PAS n’écrit aucun mouvement', () => {
    // Un mouvement de zéro polluerait l'historique sans rien dire — et
    // l'historique est justement ce que ce chantier répare.
    const lignes = [ligne(POTS, 10), ligne(SEAUX, 3)];
    const apres = [ligne(POTS, 10), ligne(SEAUX, 5)];
    expect(deltaStock(lignes, apres)).toEqual([{ stockId: SEAUX, variation: 2 }]);
  });

  it('CRÉATION PUIS ANNULATION rend EXACTEMENT ce qui a été pris', () => {
    /**
     * ⚠️ C'EST POURQUOI LA SORTIE N'EST PAS BORNÉE À ZÉRO.
     *
     * Rien n'empêche de livrer plus que ce qu'on a en stock, et c'est un choix
     * qui appartient à l'apiculteur. Mais si la sortie était bornée et pas la
     * réintégration, sortir 10 d'un stock de 3 donnerait 0, et l'annulation
     * rendrait 10 : sept pots créés de rien. Un stock négatif se voit et se
     * corrige ; du stock fantôme se propage dans la valorisation.
     */
    const lignes = [ligne(POTS, 10)];
    const sortie = deltaStock([], empreinteDuBon('brouillon', lignes));
    const retour = deltaStock(
      empreinteDuBon('brouillon', lignes),
      empreinteDuBon('annule', lignes),
    );
    expect(sortie[0]!.variation + retour[0]!.variation).toBe(0);
  });

  it('les décimales ne dérivent pas — 0,1 + 0,2 ne fait pas 0,30000000000000004', () => {
    // Les articles au poids se comptent en kilos décimaux.
    const avant = [ligne(POTS, 0.1), ligne(POTS, 0.2)];
    expect(deltaStock([], avant)).toEqual([{ stockId: POTS, variation: 0.3 }]);
  });
});
