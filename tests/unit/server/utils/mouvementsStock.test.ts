import { describe, it, expect } from 'vitest';
import { soldeMouvements, valeurEntrees } from '~~/server/utils/stocks/mouvements';

describe('soldeMouvements', () => {
  it('additionne les entrées et retranche les sorties', () => {
    expect(
      soldeMouvements([
        { type: 'entree', quantite: 25 },
        { type: 'entree', quantite: 10.5 },
        { type: 'sortie', quantite: 5 },
      ]),
    ).toBe(30.5);
  });

  it('traite un ajustement comme un inventaire qui REDÉFINIT le solde', () => {
    // L'inventaire physique fait autorité : ce qui précède est effacé.
    expect(
      soldeMouvements([
        { type: 'entree', quantite: 100 },
        { type: 'sortie', quantite: 30 },
        { type: 'ajustement', quantite: 42 },
        { type: 'entree', quantite: 8 },
      ]),
    ).toBe(50);
  });

  it('ne descend jamais sous zéro (un stock négatif n’a pas de sens physique)', () => {
    expect(
      soldeMouvements([
        { type: 'entree', quantite: 5 },
        { type: 'sortie', quantite: 20 },
      ]),
    ).toBe(0);
  });

  it('ignore le signe saisi : c’est le type qui porte le sens', () => {
    expect(soldeMouvements([{ type: 'sortie', quantite: -7 }])).toBe(0);
    expect(
      soldeMouvements([
        { type: 'entree', quantite: 10 },
        { type: 'sortie', quantite: -4 },
      ]),
    ).toBe(6);
  });

  it('accepte les quantités en chaîne (colonnes decimal Drizzle)', () => {
    expect(
      soldeMouvements([
        { type: 'entree', quantite: '12.50' },
        { type: 'sortie', quantite: '2.25' },
      ]),
    ).toBe(10.25);
  });

  it('renvoie 0 sur une liste vide', () => {
    expect(soldeMouvements([])).toBe(0);
  });

  it('évite les artefacts de virgule flottante', () => {
    expect(
      soldeMouvements([
        { type: 'entree', quantite: 0.1 },
        { type: 'entree', quantite: 0.2 },
      ]),
    ).toBe(0.3);
  });
});

describe('valeurEntrees', () => {
  it('valorise uniquement les entrées', () => {
    expect(
      valeurEntrees([
        { type: 'entree', quantite: 10, prixUnitaire: 5 },
        { type: 'sortie', quantite: 4, prixUnitaire: 9 },
      ]),
    ).toBe(50);
  });

  it('ignore les mouvements sans prix plutôt que d’inventer une valeur', () => {
    expect(
      valeurEntrees([
        { type: 'entree', quantite: 10, prixUnitaire: 5 },
        { type: 'entree', quantite: 100, prixUnitaire: null },
        { type: 'entree', quantite: 100 },
      ]),
    ).toBe(50);
  });

  it('accepte les valeurs en chaîne et arrondit au centime', () => {
    expect(valeurEntrees([{ type: 'entree', quantite: '3', prixUnitaire: '4.335' }])).toBe(13.01);
  });

  it('renvoie 0 sans aucune entrée', () => {
    expect(valeurEntrees([{ type: 'sortie', quantite: 5, prixUnitaire: 3 }])).toBe(0);
  });
});
