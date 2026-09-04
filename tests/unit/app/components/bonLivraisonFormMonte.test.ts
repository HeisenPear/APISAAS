// ═══════════════════════════════════════════════════════════════════════════
// LE FORMULAIRE DE BON DE LIVRAISON, MONTÉ POUR DE VRAI.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// `BonLivraisonForm.vue` portait une RECOPIE du type `LigneBL`, et cette
// recopie avait perdu trois champs : `modePrix`, `contenance` et
// `uniteContenance`.
//
// Le formulaire ne pouvait donc pas les transmettre — quand bien même le
// schéma Zod du serveur les accepte (`ligneBonLivraisonSchema`), et quand bien
// même le formulaire de VENTE, lui, les transporte depuis toujours. Deux
// portes vers le même geste, une seule fidèle.
//
// Un seau de 25 kg tarifé 10 €/kg partait donc sans ce qui justifie ses 250 € :
//
//   1. le formulaire affichait 10,00 € au lieu de 250,00 € pendant la saisie ;
//   2. le serveur, ne voyant pas `modePrix`, calculait 1 × 10 = 10 € et
//      l'ÉCRIVAIT en base ;
//   3. `convertir` reprenait ce montant tel quel sur une facture NUMÉROTÉE.
//
// Ce n'était donc pas un défaut d'affichage : la marchandise partait
// sous-facturée d'un facteur égal à la contenance. Vingt-cinq, pour un seau.
//
// ─── POURQUOI UN MONTAGE, ET PAS UNE SONDE DE SOURCE ───────────────────────
// La décision vit dans un `<script setup>` : quels champs `addStockLine`
// recopie depuis l'article. Chercher la chaîne « modePrix » dans le fichier
// serait « le mot au lieu de l'appel » — elle survivrait dans un commentaire,
// dans le type, dans un `v-if` du gabarit. On monte donc le vrai composant, on
// lui donne un vrai article au kilo, on clique, et on lit CE QUI SORT.
//
// CLAUDE.md le dit déjà : « un composant se monte, et personne ne le faisait ».
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer `modePrix:` / `contenance:` de `addStockLine` ;
//   · remettre `sommeSaisieHt` → `sommeMontantsHt` (le total figé du dossier) ;
//   · remettre `montantSaisiHt` → une expression `quantité × prixUnitaire`.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { montantSaisiHt, sommeSaisieHt } from '~~/app/utils/prixLigne';
import type { BLFormData } from '~~/app/components/finances/BonLivraisonForm.vue';

let wrapper: VueWrapper | null = null;

/**
 * Un article de stock tarifé AU POIDS : dix seaux de 25 kg à 10 €/kg.
 * C'est l'exemple que `pricing.ts` porte en tête depuis le premier jour.
 */
const SEAU_AU_KILO = {
  id: 's1',
  nom: 'Seau 25 kg — toutes fleurs',
  quantite: '40',
  prixUnitaire: '10',
  tauxTva: '5.5',
  modePrix: 'poids',
  contenance: '25',
  uniteContenance: 'kg',
  typeMiel: 'toutes_fleurs',
  categorieVente: null,
  presentation: null,
  numLot: 'L-2026-04',
  origineGeo: 'France',
  anneeRecolte: 2026,
};

beforeEach(() => {
  // Sous Vitest, les auto-imports de Nuxt sont des identifiants libres. On leur
  // donne les VRAIES fonctions : doubler `montantSaisiHt` reviendrait à mesurer
  // sa propre recopie de la règle.
  for (const [nom, valeur] of Object.entries({
    ref,
    computed,
    montantSaisiHt,
    sommeSaisieHt,
  })) {
    vi.stubGlobal(nom, valeur);
  }
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
});

function formulaireVide(): BLFormData {
  return { dateCreation: '2026-09-04', lignes: [] };
}

async function monter(modelValue: BLFormData, stocks: unknown[] = [SEAU_AU_KILO]) {
  const Form = (await import('~~/app/components/finances/BonLivraisonForm.vue')).default;
  wrapper = mount(Form, {
    shallow: true,
    props: { modelValue, clients: [], stocks, stocksCharges: true },
  });
  return wrapper;
}

/** La dernière valeur émise par `update:modelValue`. */
function derniereEmission(): BLFormData {
  const emissions = wrapper!.emitted('update:modelValue') as Array<[BLFormData]> | undefined;
  if (!emissions?.length) throw new Error('le formulaire n’a rien émis');
  return emissions[emissions.length - 1]![0];
}

/**
 * Le texte rendu, espaces insécables ramenées à l'espace simple.
 *
 * `Intl.NumberFormat('fr-FR')` sépare les milliers par une espace INSÉCABLE
 * FINE (U+202F) et colle le « € » avec une insécable ordinaire (U+00A0).
 * Écrire ces caractères dans une attente les rend invisibles à la relecture —
 * et ESLint les refuse (`no-irregular-whitespace`), à juste titre.
 */
function normaliser(texte: string): string {
  return texte.replace(/[\u00a0\u202f]/g, ' ');
}

describe('le formulaire de bon de livraison, monté', () => {
  it('GARDE-FOU : il se monte et propose l’article du stock', async () => {
    // Sans ce cas, un composant qui refuserait de se monter rendrait tous les
    // autres verts par vacuité — « le balayage vide » de CLAUDE.md, déplacé
    // dans le harnais.
    const w = await monter(formulaireVide());
    // Le bouton d'un miel porte sa VARIÉTÉ et son lot, pas le nom de l'article.
    expect(w.text()).toContain('L-2026-04');
  });

  it('LA RÈGLE : choisir un article au kilo transporte ce qui justifie son prix', async () => {
    const w = await monter(formulaireVide());

    const boutons = w.findAll('button');
    const bouton = boutons.find((b) => b.text().includes('L-2026-04'));
    expect(bouton, 'le bouton d’ajout depuis le stock est introuvable').toBeTruthy();
    await bouton!.trigger('click');

    const ligne = derniereEmission().lignes[0]!;
    expect(
      [ligne.modePrix, ligne.contenance, ligne.uniteContenance],
      'Le formulaire ne transmettait pas ces trois champs — le type recopié ici ne les ' +
        'déclarait même pas. Le serveur calculait donc 1 × 10 = 10 € et l’écrivait en base ' +
        'pour un seau qui en vaut 250, puis « convertir » reprenait ces 10 € sur une facture ' +
        'numérotée. Le formulaire de VENTE, lui, les transporte depuis toujours.',
    ).toEqual(['poids', 25, 'kg']);
  });

  it('LA RÈGLE : dix seaux de 25 kg à 10 €/kg s’affichent 2 500 €, pas 100 €', async () => {
    const modele = formulaireVide();
    modele.lignes = [
      {
        description: 'Seau 25 kg',
        quantite: 10,
        prixUnitaire: 10,
        tauxTva: 5.5,
        modePrix: 'poids',
        contenance: 25,
        uniteContenance: 'kg',
      },
    ];
    const w = await monter(modele);
    const texte = normaliser(w.text());

    expect(
      texte,
      'C’est « le bug d’origine » de pricing.ts, sous les yeux de celui qui saisit : ' +
        'l’expression affichée était « quantité × prixUnitaire », donc aveugle au tarif ' +
        'au poids. L’apiculteur voyait 100 € pour 2 500 € de marchandise — et pouvait ' +
        'corriger son prix pour « retomber juste », doublant l’erreur sur la facture.',
    ).toContain('2 500,00 €');
    expect(texte).not.toContain('100,00 €');
  });

  it('LA RÈGLE : le total suit la frappe, il ne relit pas un total périmé', async () => {
    /**
     * ⚠️ CE CAS EXISTE PARCE QUE J’AI FAILLI INTRODUIRE LE DÉFAUT INVERSE.
     *
     * `montantLigneHt` fait gagner le total STOCKÉ — c’est juste pour un
     * document au dossier, dont la facture reprendra ce total. Mais dans un
     * FORMULAIRE, `total` est un champ mort : il est posé à 0 à la création de
     * la ligne et n’est jamais remis à jour pendant la frappe. Le lire, c’est
     * afficher 0 € pendant que l’apiculteur tape ses montants.
     *
     * D’où deux fonctions, `montantSaisiHt` et `montantLigneHt`, et ce cas qui
     * refuse la confusion.
     */
    /**
     * ⚠️ DEUX LIGNES, ET C'EST LE COEUR DU CAS. Écrit avec UNE seule ligne, il
     * restait VERT sous la mutation : le montant attendu s'affiche AUSSI en
     * face de la ligne, si bien que `w.text()` le contenait alors même que le
     * sous-total, lui, était tombé à zéro. « La couverture qui s'arrête juste
     * avant », dans le cas écrit pour la mesurer.
     *
     * Avec deux lignes, la somme 39,70 € n'est produite QUE par le sous-total :
     * aucune ligne ne l'affiche. Et la première porte un `total` périmé de 0,
     * l'exacte valeur qu'un formulaire pose à la création d'une ligne.
     */
    const modele = formulaireVide();
    modele.lignes = [
      { description: 'Pots 500 g', quantite: 3, prixUnitaire: 9.9, tauxTva: 5.5, total: 0 },
      { description: 'Bougies', quantite: 2, prixUnitaire: 5, tauxTva: 20, total: 0 },
    ];
    const w = await monter(modele);
    const texte = normaliser(w.text());

    expect(
      texte,
      'un total périmé de 0 € ne doit pas éteindre le sous-total pendant la frappe',
    ).toContain('39,70 €');
  });

  it('un prix pas encore convenu s’affiche « — », jamais « 0,00 € »', async () => {
    // Un bon de livraison peut légitimement n’annoncer que des quantités, le
    // prix venant à la facturation. Annoncer 0,00 €, c’est annoncer la gratuité.
    const modele = formulaireVide();
    modele.lignes = [{ description: 'Palette consignée', quantite: 2, tauxTva: 5.5 }];
    const w = await monter(modele);
    expect(w.text()).not.toContain('0,00 €');
    expect(w.text()).toContain('—');
  });
});
