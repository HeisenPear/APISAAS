import { describe, it, expect } from 'vitest';
import {
  moisEnFleur,
  floraisonCompatible,
  suggererFloraisons,
  indicePaysage,
  type Floraison,
} from '../../../../app/utils/floraisons';

const acacia: Floraison = {
  id: '1',
  nom: 'Acacia',
  nomLatin: 'Robinia pseudoacacia',
  typeMiel: 'acacia',
  regionPrincipale: 'France',
  moisDebut: 5,
  jourDebutTypique: 5,
  dureeJoursTypique: 15,
  altitudeMin: 0,
  altitudeMax: 800,
  latitudeMin: '43.0',
  latitudeMax: '50.0',
  potentielProductionKgRuche: '25.0',
  emoji: '🌳',
};
const lavande: Floraison = {
  id: '2',
  nom: 'Lavande',
  nomLatin: 'Lavandula',
  typeMiel: 'lavande',
  regionPrincipale: 'PACA',
  moisDebut: 6,
  jourDebutTypique: 20,
  dureeJoursTypique: 40,
  altitudeMin: 400,
  altitudeMax: 1600,
  latitudeMin: '43.0',
  latitudeMax: '45.5',
  potentielProductionKgRuche: '22.0',
  emoji: '💜',
};
const bruyereBlanche: Floraison = {
  id: '3',
  nom: 'Bruyère blanche',
  nomLatin: 'Erica arborea',
  typeMiel: 'bruyère blanche',
  regionPrincipale: 'Corse',
  moisDebut: 11,
  jourDebutTypique: 1,
  dureeJoursTypique: 90,
  altitudeMin: null,
  altitudeMax: null,
  latitudeMin: null,
  latitudeMax: null,
  potentielProductionKgRuche: '8.0',
  emoji: '🌸',
};

describe('moisEnFleur', () => {
  it('acacia fleurit en mai', () => {
    expect(moisEnFleur(acacia)).toContain(5);
    expect(moisEnFleur(acacia)).not.toContain(7);
  });

  it('gère le débordement décembre → janvier', () => {
    const m = moisEnFleur(bruyereBlanche); // nov + 90j
    expect(m).toContain(11);
    expect(m).toContain(12);
    expect(m).toContain(1);
    expect(m).not.toContain(6);
  });
});

describe('floraisonCompatible', () => {
  it('refuse hors période', () => {
    expect(floraisonCompatible(acacia, { mois: 8 })).toBe(false);
    expect(floraisonCompatible(acacia, { mois: 5 })).toBe(true);
  });

  it('refuse hors bande de latitude', () => {
    expect(floraisonCompatible(acacia, { latitude: 51 })).toBe(false); // trop au nord
    expect(floraisonCompatible(acacia, { latitude: 45 })).toBe(true);
  });

  it("refuse hors plage d'altitude", () => {
    expect(floraisonCompatible(lavande, { altitude: 100 })).toBe(false); // trop bas
    expect(floraisonCompatible(lavande, { altitude: 800 })).toBe(true);
  });

  it('filtre par type de miel', () => {
    expect(floraisonCompatible(acacia, { typeMiel: 'lavande' })).toBe(false);
    expect(floraisonCompatible(acacia, { typeMiel: 'acacia' })).toBe(true);
  });

  it('latitude/altitude null = pas de contrainte', () => {
    expect(floraisonCompatible(bruyereBlanche, { latitude: 60, altitude: 3000 })).toBe(true);
  });
});

describe('suggererFloraisons', () => {
  it('filtre et trie par potentiel décroissant', () => {
    const res = suggererFloraisons([lavande, acacia, bruyereBlanche], { mois: 5, latitude: 45 });
    // En mai à lat 45 : acacia ok (25kg), lavande non (juin), bruyère non (nov)
    expect(res.map((f) => f.nom)).toEqual(['Acacia']);
  });

  it('trie correctement quand plusieurs compatibles', () => {
    const res = suggererFloraisons([lavande, acacia], {}); // tout, trié par kg
    expect(res[0]!.nom).toBe('Acacia'); // 25 > 22
  });
});

describe('indicePaysage', () => {
  it('oriente vers le bon type de paysage', () => {
    expect(indicePaysage(acacia)).toMatch(/bois/i);
    expect(indicePaysage(lavande)).toMatch(/culture/i);
    expect(indicePaysage(bruyereBlanche)).toMatch(/lande/i);
  });
});
