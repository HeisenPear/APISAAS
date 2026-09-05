// ═══════════════════════════════════════════════════════════════════════════
// LA REMISE IMPRIMÉE DOIT SE RACCROCHER AU TOTAL IMPRIMÉ.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// La facture affichait deux nombres qu'elle recalculait elle-même, SANS
// ARRONDI :
//
//     Remise (pct %)   →  sousTotal × pct / 100
//     HT net           →  sousTotal × (1 − pct / 100)
//
// Le serveur, lui, pose `remiseMontant = round2(ST × pct/100)` puis
// `sousTotalNet = round2(ST − remiseMontant)` — et c'est de CE `sousTotalNet`
// que découle le « Total TTC » imprimé trois lignes plus bas.
//
// Mesuré sur 32 841 couples (sous-total, remise) réalistes : le « HT net »
// affiché diffère du serveur sur **8,35 %** des cas, la remise sur 0,58 %. Une
// facture remisée sur douze imprimait donc une colonne qui ne s'additionnait
// pas à son propre total — sur une pièce comptable remise à un client.
//
// ─── POURQUOI CELLE-CI SE CORRIGE, ET PAS LA VENTILATION DE TVA ────────────
// `ventilationTvaGelee.test.ts` GÈLE délibérément un autre chemin d'arrondi,
// parce qu'aucune des deux variantes n'y était plus juste que l'autre : les
// changer aurait déplacé un centime sans rien améliorer.
//
// Ici la question ne se pose pas : une des deux valeurs est celle dont le
// Total TTC est bâti, l'autre non. Corriger rapproche le document de
// lui-même — c'est une réparation, pas un arbitrage.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer un des deux arrondis de `totauxRemise` ;
//   · arrondir le NET directement au lieu de la remise d'abord ;
//   · remettre le calcul à la main dans le gabarit de la facture.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { totauxRemise } from '~~/app/utils/prixLigne';
import { corpsDuComposant } from '../../helpers/corpsDuComposant';

const FACTURE = join('app', 'pages', 'finances', 'facture', '[id].vue');

/** Ce que l'écran faisait avant : la même formule, sans le moindre arrondi. */
function ancienEcran(st: number, pct: number) {
  return { remiseMontant: (st * pct) / 100, sousTotalNet: st * (1 - pct / 100) };
}

/**
 * ⚠️ LES ESPACES INSÉCABLES SONT NORMALISÉES, ET CE N'EST PAS COSMÉTIQUE.
 * `Intl.NumberFormat('fr-FR')` colle le « € » avec une U+00A0 et sépare les
 * milliers par une U+202F. Une attente écrite avec une espace ORDINAIRE ne peut
 * alors jamais correspondre — c'est exactement ce qui a rendu vacante une
 * assertion de `bonLivraisonFormMonte` plus tôt aujourd'hui, et ESLint refuse
 * ces caractères dans les sources (`no-irregular-whitespace`), à juste titre.
 */
/**
 * ⚠️ LE FORMATEUR EST HISSÉ, ET CE N'EST PAS DE LA COQUETTERIE.
 *
 * Construit DANS la fonction, il l'était 65 682 fois par le cas de mesure —
 * c'est là que passaient ses 3,16 s, contre un plafond de 5 s par défaut.
 * Une marge de 37 % que la suite complète efface dès qu'elle occupe la
 * machine : c'est exactement ce qui vient de faire tomber `argentDansLesPages`
 * en groupe alors qu'il passait seul. Un banc qui rougit selon la charge finit
 * désactivé, et c'est la RÈGLE qui disparaît alors, pas la lenteur.
 *
 * Hisser ne change rien à ce qui est mesuré — `Intl.NumberFormat` est
 * déterministe à options égales — et se rapproche même de l'écran réel, qui
 * n'en fabrique qu'un. Vérifié : le compte de divergences reste 2 742 sur
 * 32 841.
 */
const FORMAT_EUROS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const euros = (n: number) => FORMAT_EUROS.format(n).replace(/[\u00a0\u202f]/g, ' ');

describe('ce que la règle partagée rend', () => {
  it('GARDE-FOU : sans remise, elle ne retire rien', () => {
    expect(totauxRemise(120, 0)).toEqual({
      pourcentage: 0,
      remiseMontant: 0,
      sousTotalNet: 120,
    });
  });

  it('LA RÈGLE : la remise est arrondie AVANT d’être soustraite', () => {
    /**
     * L'ordre est la règle. `1,00 €` remisé de 12,5 % donne une remise de
     * 0,125 € : arrondie à 0,13 €, elle laisse 0,87 € de net. L'ancien écran
     * affichait 0,88 € — et 0,88 + 0,13 ne font pas 1,00.
     */
    const r = totauxRemise(1, 12.5);
    expect(r.remiseMontant).toBe(0.13);
    expect(r.sousTotalNet).toBe(0.87);
    expect(euros(ancienEcran(1, 12.5).sousTotalNet)).toBe('0,88 €');
  });

  it('LA RÈGLE : les trois lignes imprimées s’additionnent, toujours', () => {
    // C'est la propriété que l'ordre des arrondis garantit, et la seule qui
    // compte pour le lecteur : remise + net = total HT, au centime.
    for (let cents = 100; cents <= 500000; cents += 1371) {
      const st = Math.round(cents) / 100;
      for (const pct of [3, 5, 7, 10, 12.5, 15, 20, 33, 50]) {
        const r = totauxRemise(st, pct);
        expect(
          Math.round((r.remiseMontant + r.sousTotalNet) * 100) / 100,
          `${st} € remisé de ${pct} % : la colonne ne s’additionne pas`,
        ).toBe(st);
      }
    }
  });

  it('LA MESURE : l’ancien écran divergeait sur 8,35 % des cas', () => {
    let n = 0;
    let divergents = 0;
    for (let cents = 100; cents <= 500000; cents += 137) {
      const st = Math.round(cents) / 100;
      for (const pct of [3, 5, 7, 10, 12.5, 15, 20, 33, 50]) {
        n++;
        if (
          euros(ancienEcran(st, pct).sousTotalNet) !== euros(totauxRemise(st, pct).sousTotalNet)
        ) {
          divergents++;
        }
      }
    }
    expect(n).toBe(32_841);
    expect(
      divergents,
      'Si ce nombre tombe à zéro, les deux formules sont devenues équivalentes — mais alors ' +
        'il faut le CONSTATER, pas le supposer.',
    ).toBe(2742);
  });

  it('un pourcentage aberrant est borné, pas propagé', () => {
    // `null`, « inconnu » et hors bornes ne doivent jamais valoir « laisse
    // passer » : une remise de 300 % rendrait un net négatif.
    expect(totauxRemise(100, 300).sousTotalNet).toBe(0);
    expect(totauxRemise(100, -5).remiseMontant).toBe(0);
    expect(totauxRemise(null, null).sousTotalNet).toBe(0);
  });
});

describe('LA RÈGLE : la facture n’a plus sa propre arithmétique de remise', () => {
  it('le gabarit ne recalcule ni la remise ni le HT net', () => {
    /**
     * ⚠️ COMMENTAIRES BLANCHIS. Le fichier EXPLIQUE le correctif et cite la
     * formule fautive dans la note qui dit pourquoi elle a disparu — sans
     * blanchiment, ce cas s'accuserait lui-même.
     */
    const corps = corpsDuComposant(FACTURE);
    expect(corps.length, 'le composant est introuvable').toBeGreaterThan(1000);
    expect(
      /Number\(facture\.sousTotal[^)]*\)\s*\*\s*\(1\s*-/.test(corps),
      'le « HT net » est de nouveau recalculé à la main, sans arrondi : il ne se raccrochera ' +
        'plus au Total TTC, qui vient du serveur.',
    ).toBe(false);
    expect(
      /totauxRemise\s*\(/.test(corps),
      'la facture doit passer par la règle partagée `totauxRemise`',
    ).toBe(true);
  });
});
