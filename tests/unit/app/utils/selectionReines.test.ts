import { describe, it, expect } from 'vitest';
import {
  computeSelectionIndex,
  normalizeTraitValue,
  indexTier,
  getTraitDefinition,
  TRAIT_DEFINITIONS,
} from '~/utils/selectionReines';

describe('TRAIT_DEFINITIONS', () => {
  it('a des poids par défaut dont la somme vaut 1', () => {
    const sum = TRAIT_DEFINITIONS.reduce((s, d) => s + d.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});

describe('normalizeTraitValue', () => {
  const douceur = getTraitDefinition('douceur');
  const varroa = getTraitDefinition('resistanceVarroaPctInfestation');
  const essaimage = getTraitDefinition('tendanceEssaimage');
  const prod = getTraitDefinition('productiviteMielKg');

  it('normalise une échelle bornée « plus haut = mieux »', () => {
    expect(normalizeTraitValue(douceur, 10)).toBe(100);
    expect(normalizeTraitValue(douceur, 1)).toBe(0);
    expect(normalizeTraitValue(douceur, 5.5)).toBeCloseTo(50, 1);
  });

  it('inverse les traits « plus bas = mieux »', () => {
    expect(normalizeTraitValue(varroa, 0)).toBe(100);
    expect(normalizeTraitValue(varroa, 100)).toBe(0);
    expect(normalizeTraitValue(varroa, 25)).toBe(75);
    expect(normalizeTraitValue(essaimage, 1)).toBe(100);
    expect(normalizeTraitValue(essaimage, 10)).toBe(0);
  });

  it('normalise un trait ouvert (production) contre une référence', () => {
    expect(normalizeTraitValue(prod, 40)).toBe(100);
    expect(normalizeTraitValue(prod, 20)).toBe(50);
    expect(normalizeTraitValue(prod, 80)).toBe(100); // plafonné
    expect(normalizeTraitValue(prod, 0)).toBe(0);
    expect(normalizeTraitValue(prod, 10, { productiviteReferenceKg: 10 })).toBe(100);
  });

  it('borne les valeurs hors échelle', () => {
    expect(normalizeTraitValue(douceur, 15)).toBe(100);
    expect(normalizeTraitValue(douceur, -3)).toBe(0);
  });

  it('retourne null pour les valeurs absentes ou non finies', () => {
    expect(normalizeTraitValue(douceur, null)).toBeNull();
    expect(normalizeTraitValue(douceur, undefined)).toBeNull();
    expect(normalizeTraitValue(douceur, NaN)).toBeNull();
  });

  it('applique la standardisation z-score quand une population est fournie (seam BLUP)', () => {
    // mean 5, sd 2 ; valeur 7 → z=1 → 50 + 20 = 70 (≠ échelle fixe 66.67)
    const r = normalizeTraitValue(douceur, 7, { population: { douceur: { mean: 5, sd: 2 } } });
    expect(r).toBe(70);
  });
});

describe('computeSelectionIndex', () => {
  it('renvoie un index null sans aucun trait', () => {
    const r = computeSelectionIndex({});
    expect(r.index).toBeNull();
    expect(r.completeness).toBe(0);
    expect(r.contributions).toHaveLength(0);
    expect(r.traitsMissing).toHaveLength(TRAIT_DEFINITIONS.length);
  });

  it('renormalise les poids sur les traits présents (les manquants ne pénalisent pas)', () => {
    // un seul trait à 100 → index 100, même si c'est un trait à petit poids
    const r = computeSelectionIndex({ ponteQualite: 10 });
    expect(r.index).toBe(100);
    expect(r.contributions).toHaveLength(1);
    expect(r.contributions[0]!.weightShare).toBe(1);
  });

  it('calcule une moyenne pondérée correcte', () => {
    // production 40kg (norm 100, poids .25) + douceur 1 (norm 0, poids .12)
    // index = 100 * .25/.37 = 67.57
    const r = computeSelectionIndex({ productiviteMielKg: 40, douceur: 1 });
    expect(r.index).toBeCloseTo(67.57, 1);
    // la somme des points reconstitue l'index
    const sumPoints = r.contributions.reduce((s, c) => s + c.points, 0);
    expect(sumPoints).toBeCloseTo(r.index!, 1);
  });

  it('reflète la couverture du modèle dans completeness', () => {
    const full = computeSelectionIndex({
      productiviteMielKg: 30,
      resistanceVarroaPctInfestation: 10,
      hygienismePinTestPct: 80,
      douceur: 8,
      tenueCadre: 7,
      tendanceEssaimage: 3,
      hivernage: 8,
      vigueurPrintemps: 7,
      ponteQualite: 9,
    });
    expect(full.completeness).toBe(1);
    expect(full.traitsMissing).toHaveLength(0);

    const partial = computeSelectionIndex({ douceur: 8 }); // poids .12
    expect(partial.completeness).toBe(0.12);
  });

  it('respecte une surcharge de poids', () => {
    // deux traits à poids égaux forcés → moyenne simple des normalisés
    const r = computeSelectionIndex(
      { douceur: 10, ponteQualite: 1 },
      { weights: { douceur: 0.5, ponteQualite: 0.5 } },
    );
    expect(r.index).toBe(50); // (100 + 0) / 2
  });
});

describe('indexTier', () => {
  it('classe les paliers', () => {
    expect(indexTier(85)!.key).toBe('elite');
    expect(indexTier(70)!.key).toBe('tres-bonne');
    expect(indexTier(55)!.key).toBe('bonne');
    expect(indexTier(40)!.key).toBe('moyenne');
    expect(indexTier(20)!.key).toBe('reforme');
    expect(indexTier(null)).toBeNull();
  });
});
