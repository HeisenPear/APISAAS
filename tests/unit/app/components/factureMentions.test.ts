// ═══════════════════════════════════════════════════════════════════════════
// DEUX MENTIONS DE TVA QUI SE CONTREDISENT, SUR LA MÊME PIÈCE COMPTABLE.
//
// ─── LE DÉFAUT ─────────────────────────────────────────────────────────────
// Le gabarit enchaînait :
//
//     <p v-if="isFranchise">          TVA non applicable, art. 293 B …
//     <!-- MENTION 4 -->
//     <p v-if="optionTvaDebits">      Option pour le paiement … d'après les débits
//     <p v-else>                      TVA : Taux applicable … Art. 278 et suivants
//
// À l'œil, le `v-else` semble répondre à la franchise. Il répond aux DÉBITS :
// un commentaire HTML n'interrompt pas la chaîne v-if/v-else, seul un ÉLÉMENT
// l'interrompt. Vérifié en passant le motif exact au vrai `@vue/compiler-dom` —
// la relecture, elle, ne tranchait pas.
//
// Conséquence pour un apiculteur en franchise en base SANS option débits, le
// cas le plus courant du produit : sa facture imprimait
//
//     « TVA : TVA non applicable, article 293 B du CGI (franchise en base). »
//     « TVA : Taux applicable : … — Art. 278 et suivants du CGI. »
//
// la seconde invoquant l'article qui FIXE les taux, sur un document qui vient
// de déclarer la TVA non applicable.
//
// Second défaut du même `v-else` : il rendait débits et taux EXCLUSIFS. Ce sont
// deux mentions indépendantes — l'une dit QUAND la taxe devient exigible,
// l'autre à QUEL taux — et un vendeur ayant opté pour les débits doit porter
// les deux.
//
// ─── POURQUOI CE BANC RENDAIT IMPOSSIBLE AVANT ─────────────────────────────
// Ces cent lignes vivaient au milieu d'une page de mille six cents, avec ses
// `useFetch` : les exercer aurait demandé de monter la page entière. Extraites
// en composant, quatre props suffisent — et on MESURE ce qui s'imprime au lieu
// de relire le gabarit.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · rendre le bloc « taux » frère du bloc franchise au lieu de son `v-else` ;
//   · remettre les débits et les taux en `v-if` / `v-else`.
// ═══════════════════════════════════════════════════════════════════════════

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FactureMentions from '~~/app/components/finances/FactureMentions.vue';

const BASE = {
  echeanceFormatee: null,
  modePaiementLabel: 'Virement bancaire',
  afficheRib: false,
  facturation: {},
  isFranchise: false,
  optionTvaDebits: false,
  tauxTvaList: [5.5],
};

const rendu = (p: Partial<typeof BASE>) =>
  mount(FactureMentions, { props: { ...BASE, ...p } }).text();

/** Les deux mentions qui ne doivent JAMAIS coexister. */
const FRANCHISE = /293 B/;
const TAUX = /Art\. 278/;
const DEBITS = /d’après les débits|d'après les débits/;

describe('les mentions de TVA ne se contredisent jamais', () => {
  it('GARDE-FOU : le composant rend bien quelque chose', () => {
    // « Le balayage vide » : un composant qui ne rendrait RIEN passerait toutes
    // les règles d'exclusion ci-dessous sans rien garantir.
    const t = rendu({});
    expect(t).toContain('Conditions de règlement');
    expect(t).toMatch(/Pénalités de retard/);
    expect(t).toMatch(/Indemnité de recouvrement/);
  });

  it('LE DÉFAUT EXACT : franchise sans option débits → 293 B SEUL', () => {
    const t = rendu({ isFranchise: true, optionTvaDebits: false });
    expect(t).toMatch(FRANCHISE);
    expect(t, 'l’article qui FIXE les taux n’a rien à faire là').not.toMatch(TAUX);
  });

  it('franchise AVEC option débits → 293 B seul aussi', () => {
    // La mention des débits dit quand la TVA devient exigible : elle n'a aucun
    // sens quand aucune TVA n'est facturée.
    const t = rendu({ isFranchise: true, optionTvaDebits: true });
    expect(t).toMatch(FRANCHISE);
    expect(t).not.toMatch(TAUX);
    expect(t).not.toMatch(DEBITS);
  });

  it('hors franchise → les taux, sans la mention de franchise', () => {
    const t = rendu({ isFranchise: false, optionTvaDebits: false });
    expect(t).toMatch(TAUX);
    expect(t).not.toMatch(FRANCHISE);
    expect(t).not.toMatch(DEBITS);
  });

  it('hors franchise AVEC option débits → LES DEUX, pas l’une ou l’autre', () => {
    // C'est le second défaut du `v-else` mal rattaché : il les rendait
    // exclusives. Ce sont deux mentions obligatoires indépendantes.
    const t = rendu({ isFranchise: false, optionTvaDebits: true });
    expect(t).toMatch(TAUX);
    expect(t).toMatch(DEBITS);
    expect(t).not.toMatch(FRANCHISE);
  });

  it('les quatre combinaisons sont couvertes, et aucune n’imprime les deux', () => {
    // Le balayage EXHAUSTIF plutôt que quatre cas recopiés : si une cinquième
    // dimension apparaît, ce cas-ci ne suffira plus et il faudra le dire.
    for (const isFranchise of [true, false]) {
      for (const optionTvaDebits of [true, false]) {
        const t = rendu({ isFranchise, optionTvaDebits });
        const contradiction = FRANCHISE.test(t) && TAUX.test(t);
        expect(
          contradiction,
          `franchise=${isFranchise} débits=${optionTvaDebits} : la facture porte ` +
            '« TVA non applicable » ET « Art. 278 et suivants » — deux mentions ' +
            'qui se contredisent sur la même pièce comptable.',
        ).toBe(false);
        expect(FRANCHISE.test(t) || TAUX.test(t), 'une mention de TVA est obligatoire').toBe(true);
      }
    }
  });
});

describe('le reste des mentions obligatoires', () => {
  it('le RIB ne s’affiche que si l’apiculteur l’a demandé', () => {
    expect(rendu({ afficheRib: false, facturation: { iban: 'FR76…' } })).not.toContain('IBAN');
    expect(rendu({ afficheRib: true, facturation: { iban: 'FR76…' } })).toContain('IBAN');
  });

  it('sans échéance, le paiement est comptant', () => {
    expect(rendu({ echeanceFormatee: null })).toContain('Paiement comptant');
    expect(rendu({ echeanceFormatee: '30/09/2026' })).toContain('échéance le 30/09/2026');
  });

  it('les taux multiples se listent avec leur qualificatif', () => {
    const t = rendu({ tauxTvaList: [5.5, 20] });
    expect(t).toContain('(réduit)');
    expect(t).toContain('(normal)');
    expect(t).toContain('Taux applicables');
  });
});
