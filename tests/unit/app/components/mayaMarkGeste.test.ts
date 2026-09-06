import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * `useId` est un auto-import Nuxt, absent de l'environnement de banc — et le
 * composant l'appelle DANS son setup, donc avant tout test. `vi.hoisted`
 * s'exécute avant les imports : c'est le seul endroit d'où le poser à temps.
 * (Le composant s'en sert pour des identifiants SVG stables entre serveur et
 * client ; un compteur suffit ici.)
 */
import * as vue from 'vue';

/**
 * ⚠️ CE DÉPÔT N'AVAIT JAMAIS MONTÉ DE COMPOSANT EN BANC, et c'est pour ça que
 * le défaut a survécu : aucune porte ne pouvait observer un comportement de
 * pointeur.
 *
 * Un composant Nuxt s'appuie sur des AUTO-IMPORTS (`ref`, `computed`,
 * `onMounted`, `useId`…) que le compilateur de Nuxt fournit et que Vitest, lui,
 * ne fournit pas. On les pose donc à la main, puis on charge le composant
 * DYNAMIQUEMENT — un import statique serait évalué avant, et échouerait sur
 * « computed is not defined ».
 */
let compteurId = 0;
Object.assign(globalThis, {
  ...vue,
  useId: () => `banc-${++compteurId}`,
});

type Composant = Awaited<typeof import('~/components/ia/MayaMark.vue')>['default'];
let MayaMark: Composant;

/**
 * LE LOGO RESTAIT FIGÉ APRÈS UN TOUCHER, ET PERSONNE NE POUVAIT LE VOIR EN CI.
 *
 * `pointermove` était le SEUL événement écouté, et l'unique sortie (`auRepos`)
 * vivait à l'intérieur du gestionnaire de mouvement. La mark ne pouvait donc se
 * relâcher que si un AUTRE mouvement de pointeur arrivait, assez loin d'elle.
 *
 * À la souris ça fonctionne : le curseur continue d'exister. Au doigt, non —
 * `pointermove` ne se produit QUE doigt posé. On effleure, on lève le doigt, et
 * l'état « tenu » ne se relâche jamais : la classe qui tue le scintillement
 * reste posée, en `!important`, pendant que la racine respire encore. D'où
 * « l'animation reste figée » sur mobile, et seulement sur mobile.
 *
 * Ce banc MONTE le composant et lui envoie de vrais événements. Un banc qui
 * aurait cherché « pointercancel » dans le texte source serait resté vert le
 * jour où l'écouteur est branché sans effet.
 */

/** La mark se juge sur la classe que porte une alvéole. */
const TENUE = 'maya-cell-tenue';

/**
 * ⚠️ HAPPY-DOM NE CALCULE AUCUNE MISE EN PAGE : toute boîte mesure 0, et le
 * composant abandonne sur `if (!boite.width) return`. On simule donc une boîte
 * de 240×240 — sur le PROTOTYPE, pas sur un nœud choisi à la main : le
 * composant garde sa propre référence et rien ne garantit qu'on vise le même
 * objet (vérifié : un espion posé sur la racine du wrapper ne suffisait pas).
 */
function simulerUneBoite(): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 240,
    height: 240,
    right: 240,
    bottom: 240,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

const evenement = (type: string, init: PointerEventInit = {}) =>
  Object.assign(new Event(type, { bubbles: true }), init) as PointerEvent;

describe('MayaMark — la fin d’un geste tactile relâche la mark', () => {
  beforeEach(async () => {
    // Sans ça, le composant refuse d'écouter (et le banc ne mesurerait rien).
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    MayaMark = (await import('~/components/ia/MayaMark.vue')).default;
  });
  afterEach(() => vi.restoreAllMocks());

  async function marque() {
    simulerUneBoite();
    const wrapper = mount(MayaMark, { props: { interactif: true, size: 240 } });
    await wrapper.vm.$nextTick();
    return wrapper;
  }

  /** Amène la mark en état « tenu » en simulant un doigt posé au centre. */
  async function tenir(wrapper: Awaited<ReturnType<typeof marque>>) {
    window.dispatchEvent(evenement('pointermove', { clientX: 120, clientY: 120 }));
    await wrapper.vm.$nextTick();
  }

  it('un doigt posé sur la mark la met en état tenu', async () => {
    const wrapper = await marque();
    await tenir(wrapper);
    expect(wrapper.html(), 'la mark ne réagit pas au pointeur').toContain(TENUE);
  });

  it('LEVER LE DOIGT la relâche — c’est le défaut corrigé', async () => {
    const wrapper = await marque();
    await tenir(wrapper);
    expect(wrapper.html()).toContain(TENUE);

    window.dispatchEvent(evenement('pointerup', { pointerType: 'touch' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.html(), 'le doigt levé, la mark reste figée').not.toContain(TENUE);
  });

  it('le navigateur qui prend la main pour défiler la relâche aussi', async () => {
    /**
     * `pointercancel` est l'événement que le navigateur émet quand il
     * s'approprie le geste pour faire défiler. C'est LE cas mobile courant, et
     * personne ne l'écoutait.
     */
    const wrapper = await marque();
    await tenir(wrapper);
    expect(wrapper.html()).toContain(TENUE);

    window.dispatchEvent(evenement('pointercancel', { pointerType: 'touch' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.html(), 'défilement commencé, la mark reste figée').not.toContain(TENUE);
  });

  it('à la SOURIS, un clic ne coupe pas le survol', async () => {
    /**
     * L'invariant inverse, tout aussi important : relâcher sur tout `pointerup`
     * ferait retomber le logo à chaque clic de souris, alors que le curseur est
     * toujours là. Le correctif serait devenu une régression de bureau.
     */
    const wrapper = await marque();
    await tenir(wrapper);
    window.dispatchEvent(evenement('pointerup', { pointerType: 'mouse' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.html(), 'un clic de souris ne doit pas relâcher la mark').toContain(TENUE);
  });

  it('les écouteurs partent au démontage', async () => {
    // Un écouteur sur `window` survit au composant : sur une page qu'on
    // parcourt longtemps, ça s'accumule.
    const retire = vi.spyOn(window, 'removeEventListener');
    const wrapper = await marque();
    wrapper.unmount();
    const types = retire.mock.calls.map((c) => c[0]);
    for (const t of ['pointermove', 'pointercancel', 'pointerup']) {
      expect(types, `${t} n’est pas retiré`).toContain(t);
    }
  });
});

describe('deux surcouches fixes ne se disputent pas le même coin', () => {
  /**
   * LE « BUG DE CLIC » QU'AUCUNE PORTE NE POUVAIT VOIR.
   *
   * Le bandeau de consentement est `fixed bottom-4 left-4 right-4 z-[9999]`,
   * monté sur toutes les pages tant qu'on n'a pas répondu. Le bouton Facebook
   * flottant est `fixed bottom-6 right-6 z-40` : il vit entièrement DANS le
   * rectangle du bandeau, et 40 ne pèse rien contre 9999. Il était donc
   * incliquable — à toutes les largeurs, et sur mobile toute la bande basse de
   * l'écran devenait morte, le bandeau y passant en pleine largeur.
   *
   * L'audit de mise en page ne peut structurellement pas l'attraper : il écarte
   * les descendants d'ancêtres `fixed` ou `sticky`, et son propre commentaire
   * nomme ces deux surcouches parmi les exclusions.
   */
  /**
   * ⚠️ ON LIT LE CODE, PAS LES COMMENTAIRES.
   *
   * Ma première version scannait le fichier entier — et trouvait « z-[9999] »
   * dans la note explicative que je venais d'y écrire pour DÉCRIRE le défaut.
   * Le banc accusait donc le correctif de contenir le problème qu'il corrige.
   * C'est le même piège qu'ailleurs dans ce dépôt, d'où l'utilitaire partagé.
   */
  const lireCode = (f: string) => sansCommentaires(readFileSync(f, 'utf-8'));

  it('le bouton flottant s’efface tant que le consentement n’est pas donné', () => {
    const source = lireCode('app/components/LandingFacebookButton.vue');
    expect(source, 'le bouton doit dépendre de l’état du consentement').toMatch(
      /useAnalyticsConsent\(\)/,
    );
    expect(source, 'il doit disparaître, pas seulement changer de couche').toMatch(
      /v-if="!bandeauAffiche"/,
    );
  });

  it('on ne tente PAS de passer au-dessus du bandeau de consentement', () => {
    /**
     * La tentation était de monter le z-index du bouton. Ce serait pire : un
     * consentement doit rester au premier plan, c'est sa raison d'être. On
     * s'efface, on ne bouscule pas.
     */
    const source = lireCode('app/components/LandingFacebookButton.vue');
    const zIndex = [...source.matchAll(/z-\[?(\d+)\]?/g)].map((m) => Number(m[1]));
    for (const z of zIndex) {
      expect(z, `z-index ${z} : le bouton passerait devant le consentement`).toBeLessThan(9999);
    }
  });
});
