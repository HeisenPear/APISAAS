import { describe, it, expect } from 'vitest';
import { valeurStockMiel, poidsTotalMielKg, poidsUnitaireGrammes } from '~/utils/stockMiel';

describe('app/utils/stockMiel', () => {
  describe('formule Valeur = (n · m · p) / 1000', () => {
    it('100 pots de 250 g à 8 €/kg = 200 € (et non 800 €)', () => {
      // n=100, m=250, p=8 → 100·250·8/1000 = 200
      expect(valeurStockMiel({ quantite: 100, prixUnitaire: 8, conditionnement: 'pot250' })).toBe(
        200,
      );
    });

    it('fonctionne pour un seau de 25 kg', () => {
      // n=4, m=25000, p=10 → 4·25000·10/1000 = 1000
      expect(valeurStockMiel({ quantite: 4, prixUnitaire: 10, conditionnement: 'seau25kg' })).toBe(
        1000,
      );
    });

    it('pots de 500 g', () => {
      // n=20, m=500, p=12 → 20·500·12/1000 = 120
      expect(valeurStockMiel({ quantite: 20, prixUnitaire: 12, conditionnement: 'pot500' })).toBe(
        120,
      );
    });
  });

  describe('vrac (quantité déjà en kg)', () => {
    it('50 kg de vrac à 9 €/kg = 450 €', () => {
      expect(valeurStockMiel({ quantite: 50, prixUnitaire: 9, conditionnement: 'vrac' })).toBe(450);
    });

    it('sans conditionnement → traité comme du kg', () => {
      expect(valeurStockMiel({ quantite: 50, prixUnitaire: 9 })).toBe(450);
    });
  });

  describe('fallback via contenance + uniteContenance', () => {
    it('contenance en grammes', () => {
      // n=10, m=250 g, p=8 → 20
      expect(
        valeurStockMiel({ quantite: 10, prixUnitaire: 8, contenance: 250, uniteContenance: 'g' }),
      ).toBe(20);
    });

    it('contenance en kg', () => {
      // n=2, m=25 kg, p=10 → 500
      expect(
        valeurStockMiel({ quantite: 2, prixUnitaire: 10, contenance: 25, uniteContenance: 'kg' }),
      ).toBe(500);
    });
  });

  describe('poids unitaire et total', () => {
    it('poidsUnitaireGrammes pour pot250 = 250 g', () => {
      expect(poidsUnitaireGrammes({ conditionnement: 'pot250' })).toBe(250);
    });

    it('poidsTotalMielKg : 100 pots de 250 g = 25 kg', () => {
      expect(poidsTotalMielKg({ quantite: 100, conditionnement: 'pot250' })).toBe(25);
    });
  });

  describe('robustesse', () => {
    it('quantité ou prix manquant → 0', () => {
      expect(valeurStockMiel({ quantite: 0, prixUnitaire: 8, conditionnement: 'pot250' })).toBe(0);
      expect(
        valeurStockMiel({ quantite: 100, prixUnitaire: null, conditionnement: 'pot250' }),
      ).toBe(0);
    });

    it('accepte des valeurs numériques sous forme de chaîne', () => {
      expect(
        valeurStockMiel({ quantite: '100', prixUnitaire: '8', conditionnement: 'pot250' }),
      ).toBe(200);
    });
  });
});
