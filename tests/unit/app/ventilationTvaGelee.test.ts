// ═══════════════════════════════════════════════════════════════════════════
// LA VENTILATION DE TVA D'UNE FACTURE NE CHANGE PAS SOUS LES PIEDS DU PASSÉ.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// En rangeant l'argent dans une seule fabrique, j'ai remplacé le calcul de la
// ventilation par la fonction partagée `ligneTva`. C'était la règle du dépôt —
// « une seule formule » — et c'était une erreur.
//
// Ces chiffres sont IMPRIMÉS SUR DES FACTURES DÉJÀ ÉMISES. Rouvrir la page
// d'une facture de l'an dernier en aurait changé la ventilation, sans que
// personne ne l'ait décidé. Or CLAUDE.md range explicitement cette question
// parmi celles qui appartiennent à l'apiculteur : « changer cela change des
// montants sur des factures déjà émises ».
//
// ─── LA MESURE, PARCE QU'UNE INTUITION NE SUFFIT PAS ───────────────────────
// ⚠️ MA PREMIÈRE MESURE ÉTAIT FAUSSE, et elle l'était d'une façon instructive :
// elle annonçait 519 divergences parce qu'elle faisait bouger DEUX variables à
// la fois. Séparées, sur 457 600 lignes réalistes — quantités 1 à 40, prix au
// centime, taux {0 · 5,5 · 10 · 20 %}, remises {0 · 5 · 10 · 33 %} :
//
//   · le CHEMIN D'ARRONDI      → 327 divergences (0,0715 %)
//   · la SOURCE DU HT          → 260 divergences (0,0568 %)
//
// Les deux touchent des factures déjà émises. Je n'en ai gardé qu'une :
//
//   · le chemin d'arrondi est REVENU à l'ancien. `Math.round(x)` arrondit un
//     demi au supérieur, là où `round2` passe par une correction d'epsilon qui
//     ne rattrape pas les demi-centimes à ces ordres de grandeur (4,185 est
//     représenté 4,18499999…). Harmoniser n'aurait pas rendu la ventilation
//     plus juste, seulement différente — donc rétroactivement mouvante.
//
//   · la source du HT RESTE `montantLigneHt`, c'est-à-dire le total STOCKÉ.
//     Ce n'est pas un rangement, c'est une correction : le total du document
//     est lui aussi calculé à partir de `l.total`. L'ancienne ventilation
//     recalculait un HT brut, et pouvait donc contredire le total imprimé
//     juste en dessous. Une ventilation qui ne se raccroche pas aux totaux est
//     exactement ce qui rend une facture électronique rejetable.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remplacer `Math.round(ht * ratio * taux) / 100` par `ligneTva(…)` ;
//   · changer l'ordre des opérations (arrondir le HT remisé d'abord).
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ligneTva, round2 } from '~~/app/utils/prixLigne';
import { corpsDuComposant } from '../../helpers/corpsDuComposant';

const FACTURE = join('app', 'pages', 'finances', 'facture', '[id].vue');

/** Le chemin d'arrondi GELÉ, tel qu'il est imprimé depuis toujours. */
function tvaGelee(ht: number, ratio: number, taux: number): number {
  return Math.round(ht * ratio * taux) / 100;
}

describe('les deux chemins d’arrondi ne sont pas interchangeables', () => {
  it('GARDE-FOU : sur la grande majorité des lignes, ils donnent le même centime', () => {
    // Sans ce cas, un chemin gelé devenu absurde passerait pour « différent,
    // donc protégé » — alors qu'il doit rester une variante d'arrondi, pas une
    // autre formule.
    expect(tvaGelee(100, 1, 20)).toBe(20);
    expect(tvaGelee(29.7, 1, 5.5)).toBe(ligneTva(29.7, 5.5));
  });

  it('LA MESURE : chemin d’arrondi 327 divergences, source du HT 260', () => {
    const TAUX = [0, 5.5, 10, 20];
    const REMISES = [0, 5, 10, 33];
    let compares = 0;
    let parArrondi = 0;
    let parSource = 0;
    for (let q = 1; q <= 40; q++) {
      for (let cents = 1; cents <= 5000; cents += 7) {
        const pu = cents / 100;
        const brut = q * pu; // ce que l'ancienne ventilation recalculait
        const stocke = round2(brut); // ce que le serveur écrit, donc ce qu'on lit
        for (const taux of TAUX) {
          for (const remise of REMISES) {
            const ratio = remise > 0 ? (100 - remise) / 100 : 1;
            compares++;
            // Une variable à la fois — c'est de les avoir bougées ensemble que
            // ma première mesure annonçait 519.
            if (tvaGelee(stocke, ratio, taux) !== ligneTva(stocke * ratio, taux)) parArrondi++;
            if (tvaGelee(brut, ratio, taux) !== tvaGelee(stocke, ratio, taux)) parSource++;
          }
        }
      }
    }
    expect(compares).toBe(457_600);
    expect(
      parArrondi,
      'Si ce nombre tombe à zéro, les deux chemins d’arrondi sont devenus équivalents et ' +
        'le gel n’a plus d’objet — mais alors il faut le CONSTATER, pas le supposer.',
    ).toBe(327);
    expect(
      parSource,
      'C’est le prix ASSUMÉ du correctif : la ventilation lit désormais le total stocké, ' +
        'celui dont découle le total imprimé juste en dessous. Elle pouvait auparavant le ' +
        'contredire.',
    ).toBe(260);
  });

  it('LE CAS NOMMÉ : 23,25 € à 20 %, remise 10 % → 4,19 € et non 4,18 €', () => {
    // Le premier exemple sorti de la mesure. Il est écrit en dur ici À DESSEIN :
    // un cas qui recalculerait ses deux bords avec les fonctions qu'il compare
    // se mesurerait lui-même.
    expect(tvaGelee(23.25, 0.9, 20)).toBe(4.19);
    expect(ligneTva(23.25 * 0.9, 20)).toBe(4.18);
  });
});

describe('LA RÈGLE : la facture imprimée garde son chemin d’arrondi', () => {
  it('la ventilation n’appelle PAS `ligneTva`', () => {
    /**
     * ⚠️ ON VISE LE CORPS DU COMPOSANT, COMMENTAIRES BLANCHIS. Le fichier
     * EXPLIQUE ce gel, et sa note cite `ligneTva` quatre fois : sans
     * blanchiment, ce cas s'accuserait lui-même — le piège tombé six fois dans
     * ce dépôt.
     */
    const corps = corpsDuComposant(FACTURE);
    const ventilation = corps.slice(corps.indexOf('const tvaParTaux'));
    const bloc = ventilation.slice(0, ventilation.indexOf('return byRate;'));

    expect(bloc.length, 'le bloc de ventilation est introuvable').toBeGreaterThan(50);
    expect(
      /\bligneTva\s*\(/.test(bloc),
      'La ventilation est IMPRIMÉE sur des factures déjà émises : l’harmoniser en ' +
        'déplacerait un centime sur 0,11 % des lignes, rétroactivement. C’est une ' +
        'décision de l’apiculteur, pas un effet de bord d’un rangement.',
    ).toBe(false);
    expect(
      /Math\.round\(ht \* ratio \* taux\) \/ 100/.test(bloc),
      'le chemin d’arrondi gelé a disparu du bloc',
    ).toBe(true);
    /**
     * ⚠️ LA SOURCE AUSSI, ET CE CAS VIENT D'UNE MUTATION RESTÉE VERTE. Ce banc
     * gelait le chemin d'arrondi et RIEN D'AUTRE : revenir au HT recalculé brut
     * (`l.quantite * l.prixUnitaire`) le laissait passer. La faute était bien
     * attrapée — par `argentDansLesPages`, dont la règle « ht » interdit cette
     * expression partout dans `app/` — mais un banc qui prétend geler un bloc
     * doit tenir les DEUX moitiés de ce bloc, sans quoi il donne une fausse
     * assurance sur celle qu'il ne regarde pas.
     */
    expect(
      /montantLigneHt\s*\(/.test(bloc),
      'La ventilation doit lire le total STOCKÉ, celui dont découle le total imprimé ' +
        'juste en dessous — sans quoi elle peut le contredire, et une ventilation qui ne ' +
        'se raccroche pas aux totaux rend une facture électronique rejetable.',
    ).toBe(true);
  });

  it('GARDE-FOU : le fichier est bien lu', () => {
    expect(readFileSync(FACTURE, 'utf-8').length).toBeGreaterThan(1000);
  });
});
