import { describe, it, expect } from 'vitest';
import { directiveParallaxe, progressionTraversee } from '~/utils/directiveParallaxe';

/**
 * La parallaxe repose sur un seul calcul : où en est l'élément dans sa traversée
 * du champ. Tout le reste — écouteur unique, garde-barrière rAF — n'est que de
 * la plomberie autour de ce nombre.
 *
 * Il vaut la peine d'être tenu, parce qu'une erreur de signe ou de bornage ne
 * casse rien : elle donne juste un mouvement qui part du mauvais côté, ou qui
 * continue de dériver après la sortie du champ. Deux défauts qu'on voit sans
 * savoir les nommer.
 */
describe('progressionTraversee', () => {
  const CHAMP = 1000;
  const HAUTEUR = 200;

  it('vaut 0 quand le centre de l’élément est au centre de l’écran', () => {
    // haut = 400 → centre = 500 = moitié du champ
    expect(progressionTraversee(400, HAUTEUR, CHAMP)).toBe(0);
  });

  it('est NÉGATIF quand l’élément arrive par le bas', () => {
    expect(progressionTraversee(900, HAUTEUR, CHAMP)).toBeLessThan(0);
  });

  it('est POSITIF quand l’élément sort par le haut', () => {
    expect(progressionTraversee(-100, HAUTEUR, CHAMP)).toBeGreaterThan(0);
  });

  it('est borné à ±1 — la dérive s’arrête, elle ne file pas à l’infini', () => {
    expect(progressionTraversee(99999, HAUTEUR, CHAMP)).toBe(-1);
    expect(progressionTraversee(-99999, HAUTEUR, CHAMP)).toBe(1);
  });

  it('progresse de façon monotone pendant la traversée', () => {
    const suite = [800, 600, 400, 200, 0].map((h) => progressionTraversee(h, HAUTEUR, CHAMP));
    const croissante = suite.every((v, i) => i === 0 || v > suite[i - 1]!);
    expect(croissante, `progression non monotone : ${suite.join(', ')}`).toBe(true);
  });

  it('ne divise jamais par zéro sur un champ nul', () => {
    // Peut arriver au tout premier rendu, avant que la mise en page ne soit posée.
    expect(progressionTraversee(0, 0, 0)).toBe(0);
  });
});

describe('v-parallaxe — le rendu serveur', () => {
  /**
   * Même leçon que `v-reveal` : une directive absente du serveur fait lire
   * `getSSRProps` sur `undefined`, et la page entière renvoie 500.
   */
  it('expose getSSRProps', () => {
    expect(typeof directiveParallaxe.getSSRProps).toBe('function');
  });

  it('ne rend aucun attribut — le HTML servi reste intact', () => {
    expect(directiveParallaxe.getSSRProps?.({} as never, null as never)).toEqual({});
  });
});
