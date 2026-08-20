import { describe, it, expect } from 'vitest';
import { progressionScene, etapeActive, progressionEtape } from '~/utils/sceneDefilement';

/**
 * Une scène épinglée casse SANS BRUIT. Elle ne lève rien, elle ne blanchit
 * rien : elle se contente de figer le récit sur une étape pendant un écran de
 * défilement, ou de faire clignoter une étape vide au dernier pixel. On le
 * ressent comme « c'est bizarre », jamais comme « c'est cassé ».
 *
 * D'où des bancs sur les BORNES plutôt que sur le milieu : c'est là que ça se
 * joue.
 */
describe('progressionScene', () => {
  const CHAMP = 800;
  const HAUTEUR = 3200; // 4 écrans → 2400 px de course utile

  it('vaut 0 quand le conteneur entre tout juste dans le champ', () => {
    expect(progressionScene(0, HAUTEUR, CHAMP)).toBe(0);
  });

  it('vaut 1 quand le bas du conteneur rejoint le bas de l’écran', () => {
    // La course utile s'arrête là : l'enfant collant se décolle.
    expect(progressionScene(-(HAUTEUR - CHAMP), HAUTEUR, CHAMP)).toBe(1);
  });

  it('vaut 0,5 à mi-course', () => {
    expect(progressionScene(-(HAUTEUR - CHAMP) / 2, HAUTEUR, CHAMP)).toBeCloseTo(0.5, 5);
  });

  it('reste borné avant l’entrée et après la sortie', () => {
    expect(progressionScene(5000, HAUTEUR, CHAMP)).toBe(0);
    expect(progressionScene(-99999, HAUTEUR, CHAMP)).toBe(1);
  });

  it('ne divise pas par zéro quand la scène est plus courte que l’écran', () => {
    // Arrive en mobile paysage, ou si la hauteur du conteneur n'est pas encore posée.
    expect(progressionScene(-100, 400, 800)).toBe(0);
    expect(progressionScene(-100, 800, 800)).toBe(0);
  });
});

describe('etapeActive', () => {
  it('donne la première étape au départ', () => {
    expect(etapeActive(0, 4)).toBe(0);
  });

  it('NE DÉBORDE PAS à la toute fin — le défaut qui affiche du vide', () => {
    // Math.floor(1 × 4) = 4, soit une cinquième étape sur quatre.
    expect(etapeActive(1, 4)).toBe(3);
  });

  it('découpe la course en parts égales', () => {
    expect(etapeActive(0.24, 4)).toBe(0);
    expect(etapeActive(0.26, 4)).toBe(1);
    expect(etapeActive(0.51, 4)).toBe(2);
    expect(etapeActive(0.76, 4)).toBe(3);
  });

  it('avance sans jamais reculer', () => {
    let precedent = -1;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const rang = etapeActive(p, 5);
      expect(rang, `recul à p=${p.toFixed(2)}`).toBeGreaterThanOrEqual(precedent);
      precedent = rang;
    }
  });

  it('supporte un nombre d’étapes absurde sans planter', () => {
    expect(etapeActive(0.5, 0)).toBe(0);
    expect(etapeActive(0.5, 1)).toBe(0);
  });
});

describe('progressionEtape', () => {
  it('repart de 0 à chaque changement d’étape', () => {
    expect(progressionEtape(0, 4)).toBeCloseTo(0, 5);
    expect(progressionEtape(0.25, 4)).toBeCloseTo(0, 5);
    expect(progressionEtape(0.5, 4)).toBeCloseTo(0, 5);
  });

  it('atteint presque 1 juste avant la bascule', () => {
    expect(progressionEtape(0.249, 4)).toBeCloseTo(0.996, 2);
  });

  it('vaut 1 au tout dernier pixel, sans repartir à zéro', () => {
    // Conséquence directe du bornage d'etapeActive : la dernière étape va au bout.
    expect(progressionEtape(1, 4)).toBe(1);
  });
});
