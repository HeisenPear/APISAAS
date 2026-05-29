import { describe, it, expect } from 'vitest';
import { ligneTotalHt, ligneTva, round2 } from '~/server/utils/pricing';

describe('server/utils/pricing', () => {
  describe('ligneTotalHt — mode format', () => {
    it('multiplie quantité × prix unitaire', () => {
      expect(ligneTotalHt({ quantite: 10, prixUnitaire: 250, modePrix: 'format' })).toBe(2500);
    });

    it('mode par défaut (non précisé) = format', () => {
      expect(ligneTotalHt({ quantite: 3, prixUnitaire: 12 })).toBe(36);
    });

    it('arrondit à 2 décimales', () => {
      expect(ligneTotalHt({ quantite: 3, prixUnitaire: 9.99, modePrix: 'format' })).toBe(29.97);
    });
  });

  describe('ligneTotalHt — mode poids (le bug du seau de 25 kg)', () => {
    it('10 seaux de 25 kg à 10 €/kg = 2500 € (et non 100 €)', () => {
      expect(
        ligneTotalHt({ quantite: 10, prixUnitaire: 10, modePrix: 'poids', contenance: 25 }),
      ).toBe(2500);
    });

    it('1 pot de 500 g à 0,02 €/g = 10 €', () => {
      expect(
        ligneTotalHt({ quantite: 1, prixUnitaire: 0.02, modePrix: 'poids', contenance: 500 }),
      ).toBe(10);
    });

    it('fallback en format si contenance manquante en mode poids', () => {
      expect(ligneTotalHt({ quantite: 4, prixUnitaire: 5, modePrix: 'poids' })).toBe(20);
    });

    it('fallback en format si contenance = 0', () => {
      expect(ligneTotalHt({ quantite: 4, prixUnitaire: 5, modePrix: 'poids', contenance: 0 })).toBe(
        20,
      );
    });
  });

  describe('ligneTotalHt — entrées robustes', () => {
    it('accepte des strings (valeurs Drizzle decimal)', () => {
      expect(
        ligneTotalHt({ quantite: '10', prixUnitaire: '10', modePrix: 'poids', contenance: '25' }),
      ).toBe(2500);
    });

    it('renvoie 0 pour des entrées nulles', () => {
      expect(ligneTotalHt({ quantite: null, prixUnitaire: null })).toBe(0);
    });

    it('ignore les valeurs non numériques', () => {
      expect(ligneTotalHt({ quantite: 'abc', prixUnitaire: 10 })).toBe(0);
    });
  });

  describe('ligneTva', () => {
    it('calcule la TVA à 5,5 %', () => {
      expect(ligneTva(2500, 5.5)).toBe(137.5);
    });

    it('calcule la TVA à 20 %', () => {
      expect(ligneTva(100, 20)).toBe(20);
    });

    it('TVA nulle si taux absent', () => {
      expect(ligneTva(100, null)).toBe(0);
    });
  });

  describe('round2', () => {
    it('arrondit correctement les flottants', () => {
      expect(round2(0.1 + 0.2)).toBe(0.3);
      expect(round2(2.675)).toBe(2.68);
    });
  });
});
