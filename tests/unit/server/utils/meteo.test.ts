import { describe, it, expect } from 'vitest';
import {
  wmo,
  noteTemperature,
  noteVent,
  notePluie,
  noteCiel,
  noteHumidite,
  facteursJour,
  evaluerJour,
  scoreVisite,
  scoreHoraire,
  meilleurCreneau,
  conseilsMeteo,
  optimalVisite,
  dayAlerts,
  type EntreeMeteo,
} from '~~/server/utils/meteo';

const ideal: EntreeMeteo = {
  tempMax: 24,
  pluieMm: 0,
  probPluie: 0,
  ventMax: 5,
  rafaleMax: 8,
  humidite: 55,
  code: 0,
};
const horrible: EntreeMeteo = {
  tempMax: 8,
  pluieMm: 10,
  probPluie: 90,
  ventMax: 40,
  rafaleMax: 60,
  humidite: 95,
  code: 65,
};

describe('wmo', () => {
  it('mappe les codes connus et inconnus', () => {
    expect(wmo(0).label).toBe('Ciel dégagé');
    expect(wmo(95).icon).toBe('⛈️');
    expect(wmo(123)).toEqual({ label: 'Inconnu', icon: '🌡️' });
  });
});

describe('notes par facteur', () => {
  it('température : optimum 20-30, nul en dessous de 8', () => {
    expect(noteTemperature(24)).toBe(100);
    expect(noteTemperature(8)).toBe(0);
    expect(noteTemperature(5)).toBe(0);
    expect(noteTemperature(35)).toBeGreaterThan(0);
    expect(noteTemperature(35)).toBeLessThan(100);
  });
  it('vent : pénalise vent moyen ET rafales', () => {
    expect(noteVent(5, 8)).toBe(100);
    expect(noteVent(50, 70)).toBe(0);
    expect(noteVent(16, 20)).toBeGreaterThan(0);
    expect(noteVent(16, 20)).toBeLessThan(100);
  });
  it('pluie : sec idéal, proba élevée pénalisée même sans cumul', () => {
    expect(notePluie(0, 0)).toBe(100);
    expect(notePluie(0, 90)).toBeLessThan(100);
    expect(notePluie(5, 0)).toBeLessThanOrEqual(12);
    expect(notePluie(10, 0)).toBe(0);
  });
  it('ciel : dégagé > couvert > orage', () => {
    expect(noteCiel(0)).toBe(100);
    expect(noteCiel(3)).toBe(60);
    expect(noteCiel(95)).toBe(0);
  });
  it('humidité : optimum 45-70 %', () => {
    expect(noteHumidite(55)).toBe(100);
    expect(noteHumidite(95)).toBeLessThan(100);
    expect(noteHumidite(0)).toBe(80);
  });
});

describe('facteursJour / evaluerJour / scoreVisite', () => {
  it('renvoie les 5 axes du radar', () => {
    const f = facteursJour(ideal);
    expect(f.map((x) => x.cle)).toEqual(['temperature', 'pluie', 'vent', 'ciel', 'humidite']);
    expect(f.every((x) => x.valeur >= 0 && x.valeur <= 100)).toBe(true);
  });
  it('journée idéale → score élevé, journée pourrie → score bas', () => {
    expect(scoreVisite(ideal)).toBeGreaterThanOrEqual(90);
    expect(scoreVisite(horrible)).toBeLessThanOrEqual(20);
  });
  it('evaluerJour expose le palier', () => {
    expect(evaluerJour(ideal).palier.cle).toBe('excellent');
    expect(evaluerJour(horrible).palier.cle).toBe('defavorable');
  });
});

describe('scoreHoraire', () => {
  it('score une heure favorable haut, une heure défavorable bas', () => {
    const bonne = {
      heure: '2026-06-23T11:00',
      temp: 23,
      pluie: 0,
      probPluie: 0,
      vent: 6,
      rafale: 10,
      humidite: 55,
      code: 0,
    };
    const mauvaise = {
      heure: '2026-06-23T18:00',
      temp: 9,
      pluie: 5,
      probPluie: 80,
      vent: 35,
      rafale: 55,
      humidite: 95,
      code: 63,
    };
    expect(scoreHoraire(bonne)).toBeGreaterThan(80);
    expect(scoreHoraire(mauvaise)).toBeLessThan(30);
  });
});

describe('meilleurCreneau', () => {
  it('trouve la plus longue plage diurne au-dessus de 55', () => {
    const c = meilleurCreneau([
      { heure: '2026-06-23T08:00', score: 40 },
      { heure: '2026-06-23T09:00', score: 60 },
      { heure: '2026-06-23T10:00', score: 70 },
      { heure: '2026-06-23T11:00', score: 80 },
      { heure: '2026-06-23T12:00', score: 75 },
      { heure: '2026-06-23T13:00', score: 30 },
    ]);
    expect(c).toEqual({ debut: '9h', fin: '13h', scoreMoyen: 71 });
  });
  it('retourne null si aucune fenêtre correcte', () => {
    expect(
      meilleurCreneau([
        { heure: '2026-06-23T10:00', score: 30 },
        { heure: '2026-06-23T11:00', score: 20 },
      ]),
    ).toBeNull();
  });
});

describe('conseilsMeteo', () => {
  const base = {
    ...ideal,
    tempMin: 12,
    alerteGel: false,
    alerteOrage: false,
    alerteVent: false,
    alerteCanicule: false,
  };
  it('génère des conseils ciblés selon les alertes', () => {
    expect(conseilsMeteo({ ...base, alerteGel: true, tempMin: 1 }).join(' ')).toContain('Gel');
    expect(conseilsMeteo({ ...base, alerteCanicule: true, tempMax: 36 }).join(' ')).toContain(
      '12 h et 17 h',
    );
    expect(conseilsMeteo({ ...base, alerteVent: true, rafaleMax: 50 }).join(' ')).toContain(
      'arrimez',
    );
  });
  it('aucun conseil par beau temps sans alerte', () => {
    expect(conseilsMeteo(base)).toHaveLength(0);
  });
});

describe('optimalVisite / dayAlerts (inchangés)', () => {
  it('optimalVisite vrai seulement si toutes conditions réunies', () => {
    expect(optimalVisite(18, 0, 10, 1)).toBe(true);
    expect(optimalVisite(18, 1, 10, 1)).toBe(false);
    expect(optimalVisite(14, 0, 10, 1)).toBe(false);
  });
  it('dayAlerts détecte gel / orage / vent / canicule', () => {
    expect(dayAlerts(2, 18, 1, 10).alerteGel).toBe(true);
    expect(dayAlerts(10, 20, 95, 10).alerteOrage).toBe(true);
    expect(dayAlerts(10, 20, 1, 45).alerteVent).toBe(true);
    expect(dayAlerts(10, 36, 1, 10).alerteCanicule).toBe(true);
  });
});
