import { describe, it, expect } from 'vitest';
import {
  anneeParis,
  dateParis,
  decalageParisMinutes,
  heureMinuteParis,
  heureParis,
  jourDuMoisParis,
  memeJourParis,
  moisParis,
  partiesParis,
  partiesParisOuNull,
} from '~~/server/utils/horloge';

// Toutes les dates sont écrites en UTC explicite (suffixe Z) : c'est le seul
// moyen de tester le fuseau Paris sans dépendre du TZ de la machine qui exécute
// les tests (CI en UTC, poste de dev en Europe/Paris).

describe('partiesParis', () => {
  it('lit les composantes dans le fuseau de Paris, pas celui du serveur', () => {
    // 23 h 30 UTC le 15 janvier = 00 h 30 le 16 janvier à Paris (CET, UTC+1).
    const p = partiesParis(new Date('2026-01-15T23:30:00Z'));
    expect(p).toEqual({ annee: 2026, mois: 1, jour: 16, heure: 0, minute: 30 });
  });

  it('lève sur une date invalide', () => {
    expect(() => partiesParis(new Date('n’importe quoi'))).toThrow();
  });
});

describe('partiesParisOuNull', () => {
  it('renvoie null sur une date invalide au lieu de lever', () => {
    expect(partiesParisOuNull(new Date('n’importe quoi'))).toBeNull();
  });

  it('renvoie les composantes sur une date valide', () => {
    expect(partiesParisOuNull(new Date('2026-06-15T10:00:00Z'))?.heure).toBe(12);
  });
});

describe('accesseurs', () => {
  it('anneeParis bascule à minuit heure de Paris, pas à minuit UTC', () => {
    // 31 décembre 23 h 30 UTC = 1er janvier 00 h 30 à Paris : l'année a changé
    // à Paris alors que getFullYear() sur un serveur en UTC dirait encore 2025.
    const reveillon = new Date('2025-12-31T23:30:00Z');
    expect(anneeParis(reveillon)).toBe(2026);
    expect(moisParis(reveillon)).toBe(1);
    expect(jourDuMoisParis(reveillon)).toBe(1);
  });

  it('heureParis rend une heure 0-23', () => {
    expect(heureParis(new Date('2026-06-15T22:00:00Z'))).toBe(0); // minuit, pas 24
    expect(heureParis(new Date('2026-06-15T10:00:00Z'))).toBe(12);
  });

  it('dateParis rend le jour civil parisien au format AAAA-MM-JJ', () => {
    expect(dateParis(new Date('2026-08-18T22:30:00Z'))).toBe('2026-08-19');
    expect(dateParis(new Date('2026-01-05T09:00:00Z'))).toBe('2026-01-05');
  });

  it('heureMinuteParis rend HH:MM sur 24 h', () => {
    expect(heureMinuteParis(new Date('2026-08-18T06:05:00Z'))).toBe('08:05');
    expect(heureMinuteParis(new Date('2026-01-15T23:30:00Z'))).toBe('00:30');
  });
});

describe('memeJourParis', () => {
  it('compare le jour civil de PARIS', () => {
    // Les deux instants tombent le 15 janvier pour un serveur en UTC, mais le
    // premier est déjà le 16 à Paris. C'est exactement le bug que produisait
    // `a.toDateString() === b.toDateString()` sur l'annonce des rendez-vous.
    const soir = new Date('2026-01-15T23:30:00Z'); // 16 janvier 00 h 30 à Paris
    const midi = new Date('2026-01-15T12:00:00Z'); // 15 janvier 13 h 00 à Paris
    expect(memeJourParis(soir, midi)).toBe(false);
    expect(memeJourParis(midi, new Date('2026-01-15T07:00:00Z'))).toBe(true);
  });
});

describe('decalageParisMinutes', () => {
  it('suit la bascule vers l’heure d’été (29 mars 2026, 02 h → 03 h)', () => {
    expect(decalageParisMinutes(new Date('2026-03-29T00:30:00Z'))).toBe(60); // CET
    expect(decalageParisMinutes(new Date('2026-03-29T01:30:00Z'))).toBe(120); // CEST
    expect(heureParis(new Date('2026-03-29T00:30:00Z'))).toBe(1);
    expect(heureParis(new Date('2026-03-29T01:30:00Z'))).toBe(3); // 02 h n'existe pas
  });

  it('suit le retour à l’heure d’hiver (25 octobre 2026, 03 h → 02 h)', () => {
    expect(decalageParisMinutes(new Date('2026-10-25T00:30:00Z'))).toBe(120); // CEST
    expect(decalageParisMinutes(new Date('2026-10-25T01:30:00Z'))).toBe(60); // CET
  });
});
