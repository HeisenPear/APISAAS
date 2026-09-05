// ═══════════════════════════════════════════════════════════════════════════
// LE PRIX ANNONCÉ AU CLIENT EST CELUI QUE LE SERVEUR ENREGISTRERA.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Les deux portes d'une commande de campagne — le formulaire PUBLIC que remplit
// le client, et la saisie ADMIN — calculaient toutes deux :
//
//     prixUnitaireHt × (1 + taux / 100) × quantité
//
// C'est aveugle au TARIF AU POIDS. Un seau de 25 kg à 10 €/kg s'affichait
// 10,55 € TTC et se commandait 263,75 € : facteur 25 entre ce que le client
// accepte et ce qui est enregistré. Et le total final n'arrondissait pas par
// ligne, là où `tariferCommandeCampagne` le fait — le dépôt le sait, son
// commentaire raconte déjà la divergence des deux portes sur ce point précis.
//
// ⚠️ LA CAUSE RACINE ÉTAIT DANS LES TYPES. `produits_campagne` porte bien
// `modePrix` et `contenance`, la route publique renvoie la ligne entière, et le
// serveur s'en sert. Mais `ProduitCampagne` (client) et `PublicProduit` ne les
// DÉCLARAIENT PAS : les écrans ne pouvaient pas les lire, même en le voulant.
// Un type incomplet est une donnée invisible.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remettre `prixUnitaireHt * (1 + taux/100)` dans l'une des deux pages ;
//   · retirer `modePrix` ou `contenance` de l'appel à `ligneTotalHt`.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { ligneTotalHt, ligneTva, round2 } from '~~/app/utils/prixLigne';
import { tariferCommandeCampagne } from '~~/server/utils/commandeCampagne';
import { corpsDuComposant } from '../../helpers/corpsDuComposant';

const PUBLIQUE = join('app', 'pages', 'public', 'campagne', '[token].vue');
const ADMIN = join('app', 'pages', 'association', 'campagnes', '[id].vue');

/** Le seau au kilo — l'exemple que `pricing.ts` porte depuis le premier jour. */
const SEAU = {
  id: 'p1',
  nom: 'Seau 25 kg',
  prixUnitaireHt: '10.00',
  tauxTva: '5.5',
  modePrix: 'poids' as const,
  contenance: '25.000',
  uniteContenance: 'kg',
};

/** Ce que l'écran calcule désormais, par la fonction partagée. */
function ecran(quantite: number) {
  const ht = ligneTotalHt({
    quantite,
    prixUnitaire: SEAU.prixUnitaireHt,
    modePrix: SEAU.modePrix,
    contenance: SEAU.contenance,
  });
  return round2(ht + ligneTva(ht, SEAU.tauxTva));
}

/** Ce que l'écran calculait AVANT — gardé pour mesurer l'écart, pas pour l'employer. */
function ancienEcran(quantite: number) {
  return Number(SEAU.prixUnitaireHt) * (1 + Number(SEAU.tauxTva) / 100) * quantite;
}

describe('ce que l’écran annonce et ce que le serveur écrit', () => {
  it('GARDE-FOU : le serveur chiffre bien la commande', () => {
    // Sans ce cas, un tarificateur muet rendrait toutes les égalités vraies
    // sur zéro — vertes, et vides.
    const r = tariferCommandeCampagne([{ produitId: 'p1', quantite: 10 }], new Map([['p1', SEAU]]));
    expect(r.totalHt).toBe(2500);
    expect(r.totalTtc).toBeGreaterThan(2500);
  });

  it('LA RÈGLE : l’écran et le serveur annoncent le MÊME total', () => {
    for (const quantite of [1, 2, 3, 7, 10, 33]) {
      const serveur = tariferCommandeCampagne(
        [{ produitId: 'p1', quantite }],
        new Map([['p1', SEAU]]),
      );
      expect(
        ecran(quantite),
        `${quantite} seau(x) : le client accepte un prix, le serveur en enregistre un autre.`,
      ).toBe(serveur.totalTtc);
    }
  });

  it('LA MESURE : l’ancien calcul se trompait d’un facteur 25', () => {
    // La contenance du seau. Ce n'est pas un centime d'écart, c'est la
    // marchandise entière.
    expect(ancienEcran(10)).toBeCloseTo(105.5, 2);
    expect(ecran(10)).toBeCloseTo(2637.5, 2);
  });

  it('un produit au FORMAT n’est pas affecté — la correction ne déplace rien d’autre', () => {
    const pot = {
      id: 'p2',
      nom: 'Pot 500 g',
      prixUnitaireHt: '9.90',
      tauxTva: '5.5',
      modePrix: 'format' as const,
      contenance: null,
      uniteContenance: null,
    };
    const serveur = tariferCommandeCampagne(
      [{ produitId: 'p2', quantite: 3 }],
      new Map([['p2', pot]]),
    );
    const ht = ligneTotalHt({ quantite: 3, prixUnitaire: pot.prixUnitaireHt, modePrix: 'format' });
    expect(round2(ht + ligneTva(ht, pot.tauxTva))).toBe(serveur.totalTtc);
  });
});

describe('LA RÈGLE : aucune des deux portes ne recalcule son TTC', () => {
  it.each([
    { nom: 'la porte PUBLIQUE', fichier: PUBLIQUE },
    { nom: 'la saisie ADMIN', fichier: ADMIN },
  ])('$nom passe par la formule partagée', ({ fichier }) => {
    /**
     * ⚠️ COMMENTAIRES BLANCHIS. Les deux fichiers RACONTENT le correctif et
     * citent la formule fautive dans la note qui explique sa disparition —
     * sans blanchiment, ce cas s'accuserait lui-même. Le piège est tombé six
     * fois dans ce dépôt.
     */
    const corps = corpsDuComposant(fichier);
    expect(corps.length, 'le fichier est introuvable').toBeGreaterThan(1000);
    expect(
      /prixUnitaireHt\s*\*\s*\(1\s*\+/.test(corps) ||
        /\(1\s*\+\s*[\w.]*tauxTva\s*\/\s*100\)\s*\*/.test(corps),
      'le TTC est de nouveau recalculé à la main : il ignorera le tarif au poids, et le ' +
        'client acceptera un prix que le serveur n’enregistrera pas.',
    ).toBe(false);
    expect(
      /ligneTotalHt\s*\(/.test(corps),
      'la page doit passer par `ligneTotalHt`, la seule formule qui regarde `modePrix`',
    ).toBe(true);
  });
});
