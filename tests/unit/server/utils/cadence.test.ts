import { describe, it, expect } from 'vitest';
import {
  saisonApicole,
  cadenceVisite,
  intervalleVisiteJours,
  chargeHebdomadaire,
} from '~~/server/utils/cadence';

// Dates en milieu de mois pour éviter les effets de bord de fuseau.
const AVRIL = new Date('2026-04-15T12:00:00Z'); // printemps
const JUILLET = new Date('2026-07-15T12:00:00Z'); // été
const OCTOBRE = new Date('2026-10-15T12:00:00Z'); // automne
const JANVIER = new Date('2026-01-15T12:00:00Z'); // hiver

describe('saisonApicole', () => {
  it('classe correctement les 4 saisons', () => {
    expect(saisonApicole(AVRIL)).toBe('printemps');
    expect(saisonApicole(JUILLET)).toBe('ete');
    expect(saisonApicole(OCTOBRE)).toBe('automne');
    expect(saisonApicole(JANVIER)).toBe('hiver');
  });

  it('range décembre avec l’hiver', () => {
    expect(saisonApicole(new Date('2026-12-10T12:00:00Z'))).toBe('hiver');
  });
});

describe('cadenceVisite / intervalleVisiteJours', () => {
  it('rapproche les visites au printemps et les espace en automne', () => {
    expect(intervalleVisiteJours(AVRIL)).toBe(10);
    expect(intervalleVisiteJours(JUILLET)).toBe(14);
    expect(intervalleVisiteJours(OCTOBRE)).toBe(21);
  });

  it('marque l’hiver en repos', () => {
    const c = cadenceVisite(JANVIER);
    expect(c.repos).toBe(true);
    expect(c.intervalleJours).toBeGreaterThanOrEqual(60);
  });
});

describe('chargeHebdomadaire', () => {
  it('augmente avec le cheptel et la fréquence de la saison', () => {
    // 20 ruches, printemps (10 j) → ceil(20*7/10) = 14 visites/semaine
    expect(chargeHebdomadaire(20, AVRIL)).toBe(14);
    // 20 ruches, automne (21 j) → ceil(20*7/21) = 7
    expect(chargeHebdomadaire(20, OCTOBRE)).toBe(7);
  });

  it('renvoie 0 en repos hivernal ou sans ruche', () => {
    expect(chargeHebdomadaire(50, JANVIER)).toBe(0);
    expect(chargeHebdomadaire(0, AVRIL)).toBe(0);
  });
});
