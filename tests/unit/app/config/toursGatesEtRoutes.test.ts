// ═══════════════════════════════════════════════════════════════════════════
// DEUX CHAMPS AJOUTÉS AUX ÉTAPES, ET DEUX FAÇONS DE LES RENDRE INERTES.
//
// Depuis que les visites guidées dérivent des phases rédigées, chaque étape
// porte deux informations nouvelles :
//
//   · `route`    — le module où elle se joue ;
//   · `feature`  — la fonctionnalité qu'elle décrit, s'il en faut une.
//
// Écrites dans la donnée mais non lues, elles ne changeraient RIEN — et rien ne
// le dirait. C'est la forme la plus courante de faux vert dans ce dépôt : un
// champ renseigné, une donnée juste, et pas un seul appelant.
//
// ─── CE QUE CHACUNE ÉVITE ──────────────────────────────────────────────────
// SANS `route` : la visite se pose sur une page et n'en bouge plus. La
// production parle des hausses, puis des bons de livraison, puis du tableau de
// bord — l'apiculteur reste sur la première page pendant que les explications
// parlent d'ailleurs, et chaque étape s'affiche dans le vide.
//
// SANS `feature` : la visite surligne un module verrouillé. Ça ne l'explique
// pas, ça le VEND — au milieu d'une explication que l'apiculteur a demandée. Et
// l'entrée de menu correspondante porte un cadenas : le projecteur se braque
// sur une porte fermée.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · faire rendre `tutorial.steps` à `etapesAccessibles` sans filtrer ;
//   · retirer l'appel à `allerALaPage` de l'overlay ;
//   · retirer le filtre au démarrage dans `useTutorial`.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_TUTORIALS, etapesAccessibles, type Tutorial } from '~~/app/config/tutorials';
import { PLAN_CONFIGS, type PlanFeatures } from '~~/app/config/plans';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

/** Le vrai `can` d'une formule — jamais un double plus permissif que le réel. */
const canDe = (plan: keyof typeof PLAN_CONFIGS) => (f: keyof PlanFeatures) =>
  PLAN_CONFIGS[plan].features[f];

const AVEC_GATE = ALL_TUTORIALS.filter((t) => t.steps.some((s) => s.feature));

describe('etapesAccessibles — une étape gatée se saute', () => {
  it('GARDE-FOU : des tours portent bien des étapes gatées', () => {
    // Sans ce cas, un catalogue sans aucune étape gatée rendrait toutes les
    // règles ci-dessous trivialement vraies — « le balayage vide ».
    expect(AVEC_GATE.length, 'au moins un tour décrit une fonctionnalité payante').toBeGreaterThan(
      0,
    );
  });

  it('GARDE-FOU : en Expert, rien n’est retiré', () => {
    // L'autre sens de la règle : gater dans un seul sens ne prouve rien.
    for (const t of ALL_TUTORIALS) {
      expect(etapesAccessibles(t, canDe('expert')).length, t.id).toBe(t.steps.length);
    }
  });

  it('LA RÈGLE : en Découverte, les étapes payantes disparaissent', () => {
    for (const t of AVEC_GATE) {
      const gardees = etapesAccessibles(t, canDe('decouverte'));
      expect(gardees.length, `${t.id} doit perdre des étapes`).toBeLessThan(t.steps.length);
      expect(
        gardees.every((s) => !s.feature || canDe('decouverte')(s.feature)),
        `${t.id} garde une étape verrouillée`,
      ).toBe(true);
    }
  });

  it('une étape sans `feature` reste ouverte à tous', () => {
    const libre: Tutorial = {
      id: 'x',
      name: 'x',
      steps: [
        { id: 'a', target: '[data-tutorial="a"]', title: 't', content: 'c', position: 'top' },
      ],
    };
    expect(etapesAccessibles(libre, () => false).length).toBe(1);
  });
});

describe('les deux champs sont RÉELLEMENT lus', () => {
  it('le démarrage retire les étapes gatées', () => {
    // Le filtre pourrait exister et n'être appelé nulle part : on vise l'APPEL
    // dans le corps du composable, pas le nom dans un import.
    const src = corpsDuComposant('app/composables/useTutorial.ts');
    expect(src).toMatch(/etapesAccessibles\(\s*tutorial\s*,/);
    expect(src, 'un tour entièrement gaté ne démarre pas').toMatch(/steps\.length === 0/);
  });

  it('l’overlay emmène l’apiculteur sur la page de l’étape', () => {
    /**
     * ⚠️ ON VISE L'APPEL DANS `updateTargetRect`, PAS LE NOM DANS LE FICHIER —
     * et ce banc s'est fait prendre en l'écrivant. Sa première version cherchait
     * `allerALaPage(` dans TOUTE la source : remplacer l'appel par
     * `void allerALaPage;` la laissait verte, puisque la DÉFINITION de la
     * fonction contient elle aussi ces caractères. C'est « le mot au lieu de
     * l'appel » de CLAUDE.md, rencontré en écrivant la mise en garde.
     */
    const src = corpsDuComposant('app/components/ui/TutorialOverlay.vue');
    expect(src, 'la navigation doit exister').toMatch(/router\.push\(/);

    const debut = src.indexOf('async function updateTargetRect');
    expect(debut, 'la fonction doit être trouvée').toBeGreaterThan(-1);
    const corps = src.slice(debut, src.indexOf('\nwatch(currentStep', debut));
    expect(corps.length, 'le corps ne doit pas être vide').toBeGreaterThan(100);

    expect(corps, 'la navigation doit être APPELÉE, pas seulement définie').toMatch(
      /await\s+allerALaPage\(/,
    );
    // Et elle doit précéder la recherche de l'ancre : chercher d'abord ne
    // trouverait rien, la page n'étant pas encore montée.
    expect(corps.indexOf('allerALaPage('), 'avant la recherche de la cible').toBeLessThan(
      corps.indexOf('document.querySelector'),
    );
  });

  it('la navigation ne repart pas si on y est déjà', () => {
    // Un `router.push` inconditionnel rejouerait la page à chaque étape d'un
    // même module — cinq rechargements pour cinq étapes du même écran.
    const src = corpsDuComposant('app/components/ui/TutorialOverlay.vue');
    expect(src).toMatch(/route\.path === /);
  });

  it('le champ `route` est bien déclaré sur l’étape, pas seulement sur le tour', () => {
    const src = readFileSync('app/config/tutorials.ts', 'utf8');
    const iface = src.slice(
      src.indexOf('interface TutorialStep'),
      src.indexOf('interface Tutorial '),
    );
    expect(iface).toMatch(/route\?: string/);
    expect(iface).toMatch(/feature\?: keyof PlanFeatures/);
  });
});
