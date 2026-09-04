// ═══════════════════════════════════════════════════════════════════════════
// L'ARGENT SE CALCULE À UN SEUL ENDROIT — Y COMPRIS DANS LES PAGES.
//
// ─── POURQUOI CE FICHIER EXISTE ────────────────────────────────────────────
// `tests/unit/server/argentUneSeuleRegle.test.ts` tient cette règle depuis
// qu'une facture électronique a déclaré 100 € de base à côté de 2 500 € de
// totaux. Il balaie `sourcesServeur()` — et RIEN D'AUTRE.
//
// Or ce que l'apiculteur IMPRIME et ce qu'il LIT en saisissant ne sont pas
// calculés par le serveur : ce sont des expressions écrites dans les pages,
// qu'aucun serveur ne voit passer. Elles disaient toutes
// `quantité × prixUnitaire`. Douze fois. Dont cinq pour les seuls bons de
// livraison, et deux DANS LE FORMULAIRE DE CRÉATION, sous les yeux de celui
// qui saisit.
//
// C'est exactement « la couverture qui s'arrête juste avant » de CLAUDE.md,
// dans le banc écrit précisément pour empêcher ce défaut-là. Le banc serveur
// était vert, sincèrement vert, et le bon de livraison qui partait avec la
// marchandise annonçait 100 € pour 2 500 € de miel.
//
// ─── CE QUE CE BANC AJOUTE, ET CE QU'IL N'AJOUTE PAS ───────────────────────
// Il ne rejuge pas les formules : `argentUneSeuleRegle` vérifie déjà ce que
// rendent les fonctions partagées, et `bonLivraisonFormMonte` vérifie ce que
// fait le formulaire une fois monté. Celui-ci ne tient que les trois règles
// STATIQUES que le côté client réclame en propre.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · réécrire `quantité × prixUnitaire` dans n'importe quelle page ;
//   · redéfinir localement une des fonctions de la fabrique ;
//   · faire lire à un formulaire le total FIGÉ du dossier ;
//   · rendre une sonde permissive → son contrôle positif tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { corpsDuComposant } from '../../helpers/corpsDuComposant';

/** Le seul module du côté client autorisé à écrire une formule monétaire. */
const FABRIQUE = join('app', 'utils', 'prixLigne.ts');

/** Tous les sources du côté client, lus sur le disque — jamais une liste recopiée. */
function sourcesClient(): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(ts|mts|vue)$/.test(entree)) trouves.push(complet);
    }
  };
  descendre('app');
  return trouves.sort();
}

/**
 * ⚠️ LES TROIS RÈGLES SONT DES FONCTIONS APPELABLES, pas des motifs enfermés
 * dans leur `it`. CLAUDE.md est catégorique : sur un dépôt PROPRE, neutraliser
 * une sonde donne exactement le même vert que la respecter — aucune mutation
 * ne la tue. Chacune reçoit donc, plus bas, une source FAUTIVE et une source
 * SAINE, fabriquées, et doit les distinguer.
 */
const REGLES = [
  {
    cle: 'ht',
    titre: 'aucun total de ligne calculé à la main',
    /**
     * La ligne réunit une QUANTITÉ, un PRIX UNITAIRE et une MULTIPLICATION.
     *
     * Volontairement plus étroit que la règle serveur, qui se contente d'un
     * prix unitaire et d'une étoile : le côté client multiplie légitimement un
     * prix unitaire par autre chose — un taux pour obtenir un TTC
     * (`prixUnitaireHt * (1 + tauxTva / 100)`), une contenance pour annoncer
     * « soit tant le kilo ». Ce qu'on refuse ici, c'est le TOTAL D'UNE LIGNE
     * recalculé sur place, et c'est exactement ce que la co-occurrence des
     * trois marque.
     */
    motif: /(?=.*\bquantite\b)(?=.*\bprixUnitaire[A-Za-z]*\b)(?=.*\*)/,
    fautive: 'return lignes.reduce((s, l) => s + l.quantite * (l.prixUnitaire ?? 0), 0);',
    saine: 'return sommeMontantsHt(lignes);',
    pourquoi:
      'Multiplier la quantité par le prix unitaire IGNORE le tarif au poids : dix seaux ' +
      "de 25 kg à 10 €/kg valent 2 500 € et non 100 €. C'est ce que le bon de livraison " +
      "imprimait, à côté d'une base qui stockait 2 500 € et d'une facture qui les " +
      'réclamait. Passez par « montantLigneHt » (au dossier) ou « montantSaisiHt » ' +
      '(en cours de saisie), tous deux dans app/utils/prixLigne.ts.',
  },
  {
    cle: 'miroir',
    titre: 'aucune fonction de la fabrique redéfinie sur place',
    /**
     * ⚠️ CETTE RÈGLE VIENT D'UN CAS RÉEL, ET IL S'ANNONÇAIT LUI-MÊME.
     * `VenteForm.vue` portait une fonction `ligneTotalHt` locale, commentée
     * « miroir client de server/utils/pricing.ligneTotalHt » — et le miroir
     * n'était pas fidèle : il n'arrondissait pas par ligne. Le formulaire
     * annonçait donc un sous-total pouvant s'écarter d'un centime de celui que
     * le serveur allait écrire.
     */
    motif:
      /^\s*(?:export\s+)?(?:function\s+|const\s+|let\s+)(ligneTotalHt|ligneTva|round2|montantLigneHt|montantSaisiHt|sommeMontantsHt|sommeSaisieHt|nombreMonetaire)\b\s*[(=]/m,
    fautive: 'function ligneTotalHt(l) {\n  return l.quantite * l.prixUnitaire;\n}',
    saine: 'const total = ligneTotalHt(ligne);',
    pourquoi:
      "Une seconde définition d'une formule partagée est une divergence en attente. " +
      "Celle qui vivait dans VenteForm n'arrondissait pas par ligne, et personne ne " +
      "pouvait le voir : elle s'annonçait « miroir » du serveur. Importez, ne recopiez pas.",
  },
  {
    cle: 'formulaire',
    titre: 'aucun formulaire ne lit le total FIGÉ du dossier',
    /**
     * ⚠️ CETTE RÈGLE GARDE UN DÉFAUT QUE J'AI FAILLI INTRODUIRE MOI-MÊME.
     *
     * `montantLigneHt` fait gagner le total STOCKÉ — juste pour un document au
     * dossier, dont la facture reprendra ce total tel quel. Mais dans un
     * FORMULAIRE, `total` est un champ mort : posé à 0 à la création de la
     * ligne, jamais remis à jour pendant la frappe. Le lire, c'est afficher
     * 0 € pendant que l'apiculteur tape ses montants.
     *
     * Deux lectures d'une même donnée, et elles ne se confondent pas — la
     * leçon est déjà dans CLAUDE.md, sur un autre couple.
     */
    motif: /\b(montantLigneHt|sommeMontantsHt)\s*\(/,
    fautive: 'const sousTotal = computed(() => sommeMontantsHt(props.modelValue.lignes));',
    saine: 'const sousTotal = computed(() => sommeSaisieHt(props.modelValue.lignes));',
    /** Elle ne s'applique QU'aux formulaires : ailleurs, c'est la bonne fonction. */
    seulement: (chemin: string) => /Form\.vue$/.test(chemin),
    pourquoi:
      "Un formulaire recalcule TOUJOURS : le champ « total » d'une ligne en cours de " +
      'saisie vaut 0 et ne bouge pas pendant la frappe. Employez « montantSaisiHt » / ' +
      '« sommeSaisieHt ».',
  },
] as const;

describe('les sondes voient ce qu’elles doivent voir, et rien d’autre', () => {
  it('GARDE-FOU : le balayage voit bien le côté client', () => {
    // Un chemin erroné rend la liste vide, donc la conformité « vérifiée ».
    const sources = sourcesClient();
    expect(sources.length).toBeGreaterThan(200);
    expect(sources).toContain(FABRIQUE);
    expect(sources).toContain(join('app', 'components', 'finances', 'BonLivraisonForm.vue'));
    expect(sources).toContain(join('app', 'pages', 'finances', 'bons-livraison', '[id].vue'));
  });

  it.each(REGLES)('CONTRÔLE POSITIF : « $titre » distingue le fautif du sain', (regle) => {
    expect(
      regle.motif.test(regle.fautive),
      `la sonde « ${regle.cle} » ne reconnaît plus le défaut réel pour lequel elle existe`,
    ).toBe(true);
    expect(
      regle.motif.test(regle.saine),
      `la sonde « ${regle.cle} » signale du code correct : elle finirait par être désactivée`,
    ).toBe(false);
  });
});

describe("l'argent se calcule à un seul endroit, y compris dans les pages", () => {
  it.each(REGLES)('$titre', (regle) => {
    const fautes: string[] = [];
    let examines = 0;

    for (const chemin of sourcesClient()) {
      if (chemin === FABRIQUE) continue;
      if ('seulement' in regle && !regle.seulement(chemin)) continue;
      examines++;

      /**
       * ⚠️ LE BLANCHIMENT EST INDISPENSABLE ICI, et pas seulement par principe.
       * Les fichiers corrigés RACONTENT le défaut : leurs commentaires citent
       * « quantité × prixUnitaire » pour expliquer pourquoi il a disparu. Sans
       * `corpsDuComposant`, ce banc s'accuserait lui-même — le piège tombé six
       * fois dans ce dépôt. Le découpage par section compte aussi : le texte
       * français d'un gabarit est plein d'apostrophes droites qu'un analyseur
       * de chaînes JS prend pour des ouvertures.
       */
      for (const texte of corpsDuComposant(chemin).split('\n')) {
        if (regle.motif.test(texte)) fautes.push(`${chemin} → ${texte.trim()}`);
      }
    }

    expect(examines, `la règle « ${regle.cle} » n'a examiné AUCUN fichier`).toBeGreaterThan(0);
    expect(fautes, `${regle.pourquoi}\n\n${fautes.join('\n')}`).toEqual([]);
  });
});
