import { describe, it, expect } from 'vitest';
import { wmo, scoreVisite, optimalVisite, dayAlerts } from '~~/server/utils/meteo';

describe('wmo', () => {
  it('retourne le libellé et l’icône pour un code connu', () => {
    expect(wmo(0)).toEqual({ label: 'Ciel dégagé', icon: '☀️' });
    expect(wmo(95).label).toBe('Orage');
  });

  it('retombe sur un défaut pour un code inconnu', () => {
    expect(wmo(1234)).toEqual({ label: 'Inconnu', icon: '🌡️' });
  });
});

describe('scoreVisite', () => {
  it('journée idéale = 100 (chaud, sec, calme, dégagé)', () => {
    expect(scoreVisite(22, 0, 5, 0)).toBe(100);
  });

  it('journée pourrie = 0 (froid, pluie, vent, couvert pluvieux)', () => {
    expect(scoreVisite(8, 10, 40, 65)).toBe(0);
  });

  it('plafonne à 100', () => {
    expect(scoreVisite(40, 0, 0, 0)).toBeLessThanOrEqual(100);
  });

  it('pondère chaque facteur indépendamment', () => {
    // 15°C (30) + 0mm (30) + vent 10 (20) + ciel code 1 (10) = 90
    expect(scoreVisite(15, 0, 10, 1)).toBe(90);
    // 12°C (15) + 2mm (15) + vent 20 (10) + ciel couvert 3 (5) = 45
    expect(scoreVisite(12, 2, 20, 3)).toBe(45);
  });

  it('température sous 12°C n’apporte aucun point température', () => {
    // 10°C (0) + 0mm (30) + vent 5 (20) + ciel 0 (10) = 60
    expect(scoreVisite(10, 0, 5, 0)).toBe(60);
  });
});

describe('optimalVisite', () => {
  it('vrai quand chaud, sec, peu venté et ciel clément', () => {
    expect(optimalVisite(18, 0, 10, 1)).toBe(true);
  });

  it('faux dès qu’un critère manque', () => {
    expect(optimalVisite(14, 0, 10, 1)).toBe(false); // trop froid
    expect(optimalVisite(18, 1, 10, 1)).toBe(false); // pluie
    expect(optimalVisite(18, 0, 25, 1)).toBe(false); // trop venté
    expect(optimalVisite(18, 0, 10, 61)).toBe(false); // pluie (code >= 51)
  });
});

describe('dayAlerts', () => {
  it('gel quand la nuit descend à 3°C ou moins', () => {
    expect(dayAlerts(3, 12, 0, 10).alerteGel).toBe(true);
    expect(dayAlerts(4, 12, 0, 10).alerteGel).toBe(false);
  });

  it('orage quand code WMO >= 95', () => {
    expect(dayAlerts(10, 20, 95, 10).alerteOrage).toBe(true);
    expect(dayAlerts(10, 20, 82, 10).alerteOrage).toBe(false);
  });

  it('vent quand rafales >= 40 km/h', () => {
    expect(dayAlerts(10, 20, 0, 40).alerteVent).toBe(true);
    expect(dayAlerts(10, 20, 0, 39).alerteVent).toBe(false);
  });

  it('canicule quand le max atteint 35°C', () => {
    expect(dayAlerts(18, 35, 0, 10).alerteCanicule).toBe(true);
    expect(dayAlerts(18, 34, 0, 10).alerteCanicule).toBe(false);
  });

  it('peut cumuler plusieurs alertes', () => {
    const a = dayAlerts(2, 36, 96, 50);
    expect(a).toEqual({
      alerteGel: true,
      alerteOrage: true,
      alerteVent: true,
      alerteCanicule: true,
    });
  });
});
