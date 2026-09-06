import { describe, it, expect } from 'vitest';
import { comparerFinances, type FinancesResume } from '~~/server/utils/copilote-data';

function bilan(annee: number, ca: number, prod: number, ventes: number): FinancesResume {
  return {
    annee,
    caVentesEuros: ca,
    nbVentes: ventes,
    facturesEnRetard: 0,
    montantImpayeEuros: 0,
    productionMielKg: prod,
  };
}

describe('comparerFinances — comparaison inter-années', () => {
  it('calcule deltas et pourcentages (ancienne → récente)', () => {
    const c = comparerFinances(bilan(2023, 1000, 100, 10), bilan(2024, 1500, 80, 12));
    expect(c.ancienne.annee).toBe(2023);
    expect(c.recente.annee).toBe(2024);
    expect(c.deltaCA).toBe(500);
    expect(c.pctCA).toBe(50);
    expect(c.deltaProduction).toBe(-20);
    expect(c.pctProduction).toBe(-20);
    expect(c.deltaVentes).toBe(2);
  });

  it('ordonne les années quel que soit l’ordre des arguments', () => {
    const c = comparerFinances(bilan(2024, 1500, 80, 12), bilan(2023, 1000, 100, 10));
    expect(c.ancienne.annee).toBe(2023);
    expect(c.recente.annee).toBe(2024);
    expect(c.deltaCA).toBe(500);
  });

  it('renvoie un pourcentage null quand la base est nulle', () => {
    const c = comparerFinances(bilan(2023, 0, 0, 0), bilan(2024, 500, 50, 5));
    expect(c.pctCA).toBeNull();
    expect(c.pctProduction).toBeNull();
    expect(c.deltaCA).toBe(500);
  });

  it('renvoie 0 % quand les deux années sont nulles', () => {
    const c = comparerFinances(bilan(2023, 0, 0, 0), bilan(2024, 0, 0, 0));
    expect(c.pctCA).toBe(0);
    expect(c.pctProduction).toBe(0);
  });

  it('arrondit les montants décimaux', () => {
    const c = comparerFinances(bilan(2023, 100.005, 10.123, 3), bilan(2024, 200.004, 20.456, 5));
    expect(c.deltaCA).toBeCloseTo(100, 1);
    expect(Number.isInteger(c.deltaVentes)).toBe(true);
  });
});
