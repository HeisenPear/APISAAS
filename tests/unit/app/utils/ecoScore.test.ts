import { describe, expect, it } from 'vitest';
import { calculerEcoScore, type EntreesEcoScore } from '../../../../app/utils/ecoScore';

// ═══════════════════════════════════════════════════════════════════════════
// Éco-Score — on verrouille le MODÈLE : bornes, cohérence des lettres, et
// monotonie (améliorer un critère ne fait jamais BAISSER le score). Le calcul
// est déterministe, donc entièrement testable hors ligne.
// ═══════════════════════════════════════════════════════════════════════════

const PARFAIT: EntreesEcoScore = {
  distanceTranshumanceKm: 0,
  partTraitementsDoux: 1,
  diversiteFlorale: 5,
  partNourrissementSucre: 0,
  circuitCourt: true,
  environnementPreserve: true,
};

const PIRE: EntreesEcoScore = {
  distanceTranshumanceKm: 300,
  partTraitementsDoux: 0,
  diversiteFlorale: 0,
  partNourrissementSucre: 1,
  circuitCourt: false,
  environnementPreserve: false,
};

describe('calculerEcoScore — bornes et lettres', () => {
  it('un lot parfait vaut 100 et la note A', () => {
    const r = calculerEcoScore(PARFAIT);
    expect(r.score).toBe(100);
    expect(r.note).toBe('A');
  });

  it('un lot au pire vaut 0 et la note E', () => {
    const r = calculerEcoScore(PIRE);
    expect(r.score).toBe(0);
    expect(r.note).toBe('E');
  });

  it('le score reste borné 0..100 même avec des entrées aberrantes', () => {
    const r = calculerEcoScore({
      ...PIRE,
      distanceTranshumanceKm: 99999,
      diversiteFlorale: 999,
      partNourrissementSucre: 5,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('la somme des max fait 100', () => {
    const total = calculerEcoScore(PARFAIT).details.reduce((s, d) => s + d.max, 0);
    expect(total).toBe(100);
  });
});

describe('calculerEcoScore — monotonie (améliorer ne peut pas nuire)', () => {
  it('rapprocher la transhumance augmente (ou maintient) le score', () => {
    const loin = calculerEcoScore({ ...PARFAIT, distanceTranshumanceKm: 120 });
    const pres = calculerEcoScore({ ...PARFAIT, distanceTranshumanceKm: 10 });
    expect(pres.score).toBeGreaterThanOrEqual(loin.score);
  });

  it('moins de nourrissement au sucre augmente (ou maintient) le score', () => {
    const sucre = calculerEcoScore({ ...PIRE, partNourrissementSucre: 1 });
    const sansSucre = calculerEcoScore({ ...PIRE, partNourrissementSucre: 0 });
    expect(sansSucre.score).toBeGreaterThanOrEqual(sucre.score);
  });

  it('la vente en circuit court ne fait jamais baisser le score', () => {
    const grossiste = calculerEcoScore({ ...PIRE, circuitCourt: false });
    const direct = calculerEcoScore({ ...PIRE, circuitCourt: true });
    expect(direct.score).toBeGreaterThanOrEqual(grossiste.score);
  });
});
