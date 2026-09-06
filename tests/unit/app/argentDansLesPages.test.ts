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

/**
 * LE CODE DÉCOUPÉ EN ÉNONCÉS — et non en lignes.
 *
 * ⚠️ LIGNE À LIGNE, CETTE SONDE ÉTAIT AVEUGLE À CE QUE PRETTIER ÉCRIT. Passé
 * cent colonnes, il coupe l'expression sur l'opérateur :
 *
 *     return lignes.reduce(
 *       (somme, l) =>
 *         somme + l.quantite *
 *           (l.prixUnitaire ?? 0),
 *       0,
 *     );
 *
 * Plus aucune ligne ne réunit alors les trois marqueurs, et le défaut passe —
 * vérifié : la version ligne à ligne ne le voit pas, celle-ci oui. Or c'est
 * précisément la forme qu'un `reduce` un peu long prend automatiquement dans ce
 * dépôt, qui reformate à chaque commit.
 */
function enonces(code: string): string[] {
  return code
    .replace(/\r/g, '')
    .split(/[;{}]|\}\}|\{\{/)
    .map((e) => e.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * LES CORPS DE FONCTION — la granularité qu'exige la règle « miroir ».
 *
 * ⚠️ VISER LE NOM NE SUFFIT PAS. La copie de `VenteForm` s'appelait
 * `ligneTotalHt`, mais rien n'obligeait la suivante à reprendre ce nom — et son
 * corps lisait `l.quantite` et `l.prixUnitaire` dans DEUX énoncés distincts
 * avant de multiplier deux variables locales `q * pu`. Ni la règle de nom, ni
 * la règle par énoncé ne l'auraient vue. C'est la FONCTION entière qui la
 * trahit : elle lit une quantité, elle lit un prix unitaire, elle multiplie.
 */
function corpsDeFonctions(code: string): string[] {
  const corps: string[] = [];
  for (const m of code.matchAll(/\b(?:function\s+\w+\s*\([^)]*\)|=>)\s*\{/g)) {
    let profondeur = 0;
    let i = m.index! + m[0].length - 1;
    const debut = i;
    for (; i < code.length; i++) {
      if (code[i] === '{') profondeur++;
      else if (code[i] === '}') {
        profondeur--;
        if (profondeur === 0) break;
      }
    }
    // Au-delà, ce n'est plus une formule mais un composant entier.
    if (i - debut < 900) corps.push(code.slice(debut, i + 1).replace(/\s+/g, ' '));
  }
  return corps;
}

/** Le seul module du côté client autorisé à écrire une formule monétaire. */
const FABRIQUE = join('app', 'utils', 'prixLigne.ts');

/** Tous les sources du côté client, lus sur le disque — jamais une liste recopiée. */
function balayerClient(): string[] {
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
 * ⚠️ LE CORPUS SE LIT UNE SEULE FOIS, ET C'EST LA SURVIE DU BANC QUI EN DÉPEND.
 *
 * Les trois règles rebalayaient chacune les 489 fichiers du côté client :
 * 1 467 lectures disque, autant de blanchiments de commentaires et de
 * découpages de composant, pour EXACTEMENT le même texte. Seul, le banc tenait
 * en 2,6 s ; en suite complète, où il tourne à côté de 224 autres fichiers, il
 * a dépassé le délai de 5 s de Vitest — vu rouge, sur un dépôt sain.
 *
 * Ce n'est pas un détail de confort. Un banc qui tombe selon la charge de la
 * machine devient un banc qu'on relance, puis qu'on ignore, puis qu'on
 * désactive — et c'est alors la RÈGLE qui disparaît, pas la lenteur. Le dépôt a
 * déjà payé la variante silencieuse de ce défaut (l'audit de mise en page
 * rendait « propre » deux fois sur cinq sans avoir regardé).
 *
 * La mémoïsation ne change RIEN à ce qui est mesuré : même liste, même texte
 * blanchi, mêmes découpages. Elle ne fait que refuser de le recalculer trois
 * fois. Les fichiers ne bougent pas pendant une exécution.
 */
let memoSources: string[] | null = null;
const memoCorps = new Map<string, string>();
const memoEnonces = new Map<string, string[]>();
const memoFonctions = new Map<string, string[]>();

function sourcesClient(): string[] {
  if (!memoSources) memoSources = balayerClient();
  return memoSources;
}

function corpsMemo(chemin: string): string {
  let corps = memoCorps.get(chemin);
  if (corps === undefined) {
    corps = corpsDuComposant(chemin);
    memoCorps.set(chemin, corps);
  }
  return corps;
}

function enoncesMemo(chemin: string, source: string): string[] {
  let liste = memoEnonces.get(chemin);
  if (liste === undefined) {
    liste = enonces(source);
    memoEnonces.set(chemin, liste);
  }
  return liste;
}

function fonctionsMemo(chemin: string, source: string): string[] {
  let liste = memoFonctions.get(chemin);
  if (liste === undefined) {
    liste = corpsDeFonctions(source);
    memoFonctions.set(chemin, liste);
  }
  return liste;
}

/**
 * LE TOTAL D'UNE LIGNE RECALCULÉ SUR PLACE — une quantité, un prix unitaire,
 * une multiplication, dans le même morceau de code.
 *
 * ⚠️ L'ANCRE `^` N'EST PAS COSMÉTIQUE : SANS ELLE, CE BANC TOMBAIT.
 * Trois têtes de recherche sans ancre, c'est trois `[\s\S]*` rejoués à CHAQUE
 * position de chaque énoncé — du quadratique sur des morceaux qui font parfois
 * mille caractères. Mesuré sur les 44 293 énoncés réels du côté client :
 * **2 345 ms non ancré contre 11 ms ancré**, pour EXACTEMENT les mêmes deux
 * correspondances (comparées une à une, zéro divergence).
 *
 * Ces 2,3 s tenaient seules quand le banc tournait seul, et dépassaient le
 * délai de 5 s de Vitest quand il tournait à côté des 224 autres fichiers de
 * la suite. Un banc qui rougit selon la charge de la machine est un banc qu'on
 * relance, puis qu'on ignore, puis qu'on désactive — et c'est la RÈGLE qui
 * disparaît alors, pas la lenteur.
 *
 * L'ancre ne restreint rien : le motif est entièrement fait de têtes de
 * recherche, donc de largeur nulle. Ce qu'elles trouvent depuis la position 0
 * est ce qu'elles trouveraient de n'importe où — `[\s\S]*` balaie tout le
 * morceau. Et `[\s\S]` plutôt que `.` pour que le motif garde son sens si on
 * lui présente un jour un corps de fonction non aplati : `.` s'arrête au saut
 * de ligne, et la règle aurait rétréci en silence.
 */
const MOTIF_TOTAL_DE_LIGNE =
  /^(?=[\s\S]*\bquantite\b)(?=[\s\S]*\bprixUnitaire[A-Za-z]*\b)(?=[\s\S]*\*)/;

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
    motif: MOTIF_TOTAL_DE_LIGNE,
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
    /**
     * ⚠️ LE NOM NE SUFFISAIT PAS, et la mutation l'a dit. Cette règle ne visait
     * que huit identifiants : renommer la copie `totalDeLaLigne` la faisait
     * disparaître du radar. On garde le nom — un homonyme reste un piège — mais
     * on vise surtout la FORME, sur le corps de fonction : lire une quantité,
     * lire un prix unitaire, et multiplier, c'est réécrire `ligneTotalHt`,
     * quel que soit le nom qu'on lui donne.
     */
    motif:
      /^\s*(?:export\s+)?(?:function\s+|const\s+|let\s+)(ligneTotalHt|ligneTva|round2|montantLigneHt|montantSaisiHt|sommeMontantsHt|sommeSaisieHt|nombreMonetaire)\b\s*[(=]/m,
    /** Portée : le corps d'une fonction, pas un énoncé isolé. */
    portee: 'fonction' as const,
    motifFonction: MOTIF_TOTAL_DE_LIGNE,
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
    /**
     * Elle ne s'applique QU'aux formulaires : ailleurs, c'est la bonne fonction.
     *
     * ⚠️ PAS SEULEMENT AU NOM DU FICHIER. La première version bornait la règle
     * à `*Form.vue`, soit dix fichiers sur 489 : un formulaire écrit dans une
     * page, ou nommé autrement, y échappait. On reconnaît désormais aussi la
     * FORME d'un formulaire — un composant qui émet `update:modelValue`, donc
     * qui porte une saisie en cours. La règle couvre 31 fichiers.
     */
    seulement: (chemin: string, source: string) =>
      /Form\.vue$/.test(chemin) || /['"]update:modelValue['"]/.test(source),
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

  it('CONTRÔLE POSITIF : la PORTÉE de « formulaire » ne tient pas au nom du fichier', () => {
    /**
     * ⚠️ CE CAS EXISTE PARCE QU'UNE MUTATION NE POUVAIT PAS ROUGIR SANS LUI.
     * Rétrécir la portée d'une règle ne crée aucune faute sur un dépôt sain :
     * le balayage regarde moins de fichiers, et reste vert. La couverture ne se
     * mesure donc pas par le balayage — elle se mesure ICI, sur le prédicat.
     *
     * Bornée au nom, la règle voyait dix fichiers sur 489. Un formulaire écrit
     * dans une page, ou nommé autrement, y échappait — alors que c'est
     * exactement là que le total FIGÉ du dossier ferait afficher 0 € pendant la
     * frappe.
     */
    const regle = REGLES.find((r) => r.cle === 'formulaire')!;
    const portee = (regle as { seulement: (c: string, s: string) => boolean }).seulement;

    expect(portee('app/components/finances/VenteForm.vue', ''), 'le nom suffit').toBe(true);
    expect(
      portee('app/components/interventions/FormControle.vue', "emit('update:modelValue', v)"),
      'un composant qui émet `update:modelValue` PORTE une saisie en cours, quel que soit ' +
        'son nom : la règle doit le couvrir.',
    ).toBe(true);
    expect(
      portee('app/pages/finances/facture/[id].vue', 'const total = facture.total;'),
      'un document AU DOSSIER doit rester hors de la règle — sinon elle interdit la bonne ' +
        'fonction là où elle est justement la bonne.',
    ).toBe(false);
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
    let vus = 0;

    for (const chemin of sourcesClient()) {
      if (chemin === FABRIQUE) continue;
      const source = corpsMemo(chemin);
      if ('seulement' in regle && !regle.seulement(chemin, source)) continue;
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
      const morceaux =
        'portee' in regle && regle.portee === 'fonction'
          ? fonctionsMemo(chemin, source)
          : enoncesMemo(chemin, source);
      vus += morceaux.length;

      for (const morceau of morceaux) {
        const motif =
          'motifFonction' in regle && regle.portee === 'fonction'
            ? regle.motifFonction
            : regle.motif;
        if (motif.test(morceau)) fautes.push(`${chemin} → ${morceau.slice(0, 160)}`);
      }
      // La règle « miroir » garde AUSSI les homonymes de la fabrique.
      if ('portee' in regle && regle.portee === 'fonction' && regle.motif.test(source)) {
        fautes.push(`${chemin} → redéfinit un nom de la fabrique`);
      }
    }

    expect(examines, `la règle « ${regle.cle} » n'a examiné AUCUN fichier`).toBeGreaterThan(0);
    /**
     * ⚠️ COMPTER LES FICHIERS NE PROUVAIT RIEN. Le garde-fou d'origine
     * vérifiait la LISTE, jamais ce que le balayage avait réellement regardé :
     * un découpage cassé aurait rendu zéro morceau par fichier, et la règle
     * serait restée verte sur 489 fichiers vides.
     */
    expect(
      vus,
      `la règle « ${regle.cle} » n'a examiné aucun ÉNONCÉ : le découpage est cassé, et ` +
        'la conformité porte sur du vide.',
    ).toBeGreaterThan(examines);
    expect(fautes, `${regle.pourquoi}\n\n${fautes.join('\n')}`).toEqual([]);
  });
});
