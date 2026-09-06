import { describe, it, expect } from 'vitest';
import {
  quantiteEffective,
  quantiteReliquat,
  aUnReliquat,
  bonAUnReliquat,
  bonPartiellementLivre,
  livraisonConstatee,
} from '../../../../app/utils/bonLivraisonLigne';
import { lignesBonLivraisonAvecTotaux } from '../../../../server/utils/bonLivraison';
import { empreinteStock, deltaStock } from '../../../../server/utils/bonLivraisonStock';
import type { LigneBL } from '../../../../server/database/schema';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CE QUI A ÉTÉ COMMANDÉ, ET CE QUI A ÉTÉ REMIS.
 *
 * ─── POURQUOI CE BANC EXISTE ───────────────────────────────────────────────
 * Le bon de livraison disait ce qui AURAIT DÛ partir, jamais ce qui a été reçu
 * — alors que c'est la pièce qu'on produit quand un client conteste une
 * quantité. Livrer huit pots sur dix n'avait aucune écriture possible.
 *
 * ⚠️ ET IL ARRIVE APRÈS LE CODE, CE QUI EST UN MANQUEMENT. Le serveur de ce
 * chantier a été commité sans banc ; c'est exactement ce que ce dépôt
 * interdit. Écrit ensuite, il vaut ce que valent ses MUTATIONS — chacune des
 * règles ci-dessous a été vue rouge.
 *
 * ─── LA DISTINCTION QUI PORTE TOUT ─────────────────────────────────────────
 * `undefined` (rien constaté) et `0` (rien livré) ne sont PAS la même chose.
 * Les confondre ferait basculer d'un coup tous les bons déjà en base à « rien
 * livré » : leur valeur, leur facture et leur stock repartiraient à zéro.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const ligne = (over: Partial<LigneBL> = {}): LigneBL => ({
  description: 'Pot de miel 500 g',
  quantite: 10,
  prixUnitaire: 8,
  tauxTva: 5.5,
  ...over,
});

describe('la quantité qui compte', () => {
  it('GARDE-FOU : les deux lectures d’une ligne se distinguent', () => {
    // Sans ce cas, une `quantiteEffective` qui rendrait toujours la même chose
    // ferait passer toutes les règles ci-dessous.
    expect(quantiteEffective(ligne())).toBe(10);
    expect(quantiteEffective(ligne({ quantiteLivree: 8 }))).toBe(8);
  });

  it('tant que rien n’est constaté, la COMMANDE fait foi', () => {
    /**
     * C'est ce qui rend l'ajout invisible pour les bons DÉJÀ EN BASE : aucun ne
     * porte la clé, tous valent exactement ce qu'ils valaient hier.
     */
    expect(livraisonConstatee(ligne())).toBe(false);
    expect(quantiteEffective(ligne())).toBe(10);
    expect(quantiteEffective(ligne({ quantiteLivree: undefined }))).toBe(10);
  });

  it('ZÉRO livré est une valeur, pas une absence', () => {
    /**
     * « le client n'en a finalement pas voulu » doit pouvoir s'écrire — et
     * rendre au stock la TOTALITÉ de la marchandise. Traiter 0 comme « rien
     * constaté » ferait sortir dix pots pour une livraison qui n'a pas eu lieu.
     */
    const l = ligne({ quantiteLivree: 0 });
    expect(livraisonConstatee(l), 'zéro doit compter comme un constat').toBe(true);
    expect(quantiteEffective(l)).toBe(0);
    expect(quantiteReliquat(l), 'tout reste dû').toBe(10);
  });

  it('le reliquat n’est JAMAIS négatif', () => {
    /**
     * Livrer plus que commandé est refusé en amont par le schéma. Mais une
     * donnée déjà en base ne repasse pas par lui — et un reliquat négatif
     * fabriquerait un bon de rattrapage qui RETIRE de la marchandise.
     */
    expect(quantiteReliquat(ligne({ quantiteLivree: 12 }))).toBe(0);
    expect(aUnReliquat(ligne({ quantiteLivree: 12 }))).toBe(false);
    expect(quantiteReliquat(ligne({ quantiteLivree: 8 }))).toBe(2);
  });

  it('un bon sans rien de constaté n’a pas de reliquat', () => {
    // Sinon TOUS les bons existants proposeraient un rattrapage de leur
    // quantité entière — un second envoi de toute la marchandise.
    expect(bonAUnReliquat([ligne(), ligne()])).toBe(false);
    expect(bonPartiellementLivre([ligne(), ligne()])).toBe(false);
    expect(bonAUnReliquat([ligne(), ligne({ quantiteLivree: 8 })])).toBe(true);
  });
});

describe('ce que la quantité livrée fait bouger', () => {
  it('LE TOTAL suit ce qui est parti, pas ce qui a été commandé', () => {
    /**
     * C'est ce qui permet aux deux routes de conversion de reprendre `l.total`
     * TEL QUEL — « une conversion ne RE-TARIFE pas ». Sans cela, une livraison
     * partielle produirait une facture réclamant dix pots pour huit remis.
     */
    const [commande] = lignesBonLivraisonAvecTotaux([
      { description: 'Pot', quantite: 10, prixUnitaire: 8, tauxTva: 5.5 },
    ]);
    expect(commande!.total).toBe(80);

    const [livre] = lignesBonLivraisonAvecTotaux([
      { description: 'Pot', quantite: 10, quantiteLivree: 8, prixUnitaire: 8, tauxTva: 5.5 },
    ]);
    expect(livre!.total, 'la facture réclamerait dix pots pour huit remis').toBe(64);
  });

  it('LE TARIF AU POIDS survit à la livraison partielle', () => {
    /**
     * Le défaut d'origine du dépôt, dans sa version « partielle » : huit seaux
     * de 25 kg à 10 €/kg valent 2 000 €, pas 80.
     */
    const [l] = lignesBonLivraisonAvecTotaux([
      {
        description: 'Seau',
        quantite: 10,
        quantiteLivree: 8,
        prixUnitaire: 10,
        tauxTva: 5.5,
        modePrix: 'poids',
        contenance: 25,
      },
    ]);
    expect(l!.total).toBe(2000);
  });

  it('LE STOCK rend la différence, sans qu’aucune branche ne l’explique', () => {
    /**
     * La mécanique raisonne en « empreinte AVANT → empreinte APRÈS ». Constater
     * « livré 8 sur 10 » sur un bon qui tient déjà du stock produit donc
     * mécaniquement une variation de −2, soit une ENTRÉE de deux pots.
     */
    const avant = [ligne({ stockId: 'art-1' })];
    const apres = [ligne({ stockId: 'art-1', quantiteLivree: 8 })];

    expect(empreinteStock(avant).get('art-1')).toBe(10);
    expect(empreinteStock(apres).get('art-1')).toBe(8);
    expect(deltaStock(avant, apres), 'deux pots doivent revenir en stock').toEqual([
      { stockId: 'art-1', variation: -2 },
    ]);
  });

  it('rien constaté ⇒ le stock ne bouge pas', () => {
    // La garantie de non-régression pour les milliers de bons déjà en base.
    const l = [ligne({ stockId: 'art-1' })];
    expect(deltaStock(l, l)).toEqual([]);
  });
});
