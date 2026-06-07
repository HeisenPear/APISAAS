import { describe, it, expect } from 'vitest';
import { allowsDecimalQuantity, normalizeStockQuantity } from '~/utils/stockQuantity';

describe('allowsDecimalQuantity', () => {
  it('autorise les décimales pour les unités de poids/volume', () => {
    for (const u of ['kg', 'Kg', ' g ', 'L', 'l', 'ml', 'cl', 'litre', 'litres', 'tonne']) {
      expect(allowsDecimalQuantity(u), `unité ${u}`).toBe(true);
    }
  });

  it('refuse les décimales pour les unités dénombrables', () => {
    for (const u of ['pots', 'pièces', 'cadres', 'hausses', 'unités', '', undefined, null]) {
      expect(allowsDecimalQuantity(u), `unité ${u}`).toBe(false);
    }
  });

  it('autorise les décimales pour nourrissement et traitement quelle que soit l’unité', () => {
    expect(allowsDecimalQuantity('pièces', 'nourrissement')).toBe(true);
    expect(allowsDecimalQuantity('seau', 'traitement')).toBe(true);
  });

  it('refuse pour les catégories dénombrables', () => {
    expect(allowsDecimalQuantity('pièces', 'cadres')).toBe(false);
    expect(allowsDecimalQuantity(undefined, 'hausses')).toBe(false);
  });
});

describe('normalizeStockQuantity', () => {
  it('arrondit à l’entier quand les décimales ne sont pas autorisées', () => {
    expect(normalizeStockQuantity(3.7, 'pièces', 'cadres')).toBe(4);
    expect(normalizeStockQuantity(3.2, 'pots')).toBe(3);
  });

  it('conserve 2 décimales quand autorisées', () => {
    expect(normalizeStockQuantity(3.456, 'kg')).toBe(3.46);
    expect(normalizeStockQuantity(12.5, 'L', 'autre')).toBe(12.5);
  });
});
