import { describe, expect, it } from 'vitest';
import { planifierPush, dansHeuresCalmes, estPushable } from '../../../../server/utils/alertesPush';

const PREFS = {
  sante: true,
  production: true,
  stock: true,
  saison: true,
  gestion: true,
  reglementaire: true,
};
// Janvier = CET (UTC+1), offset stable, pas de DST.
const JOUR = new Date('2026-01-15T12:00:00Z'); // 13 h Paris
const NUIT = new Date('2026-01-15T23:30:00Z'); // 00 h 30 Paris

describe('dansHeuresCalmes', () => {
  it('nuit calme, journée non', () => {
    expect(dansHeuresCalmes(NUIT)).toBe(true);
    expect(dansHeuresCalmes(JOUR)).toBe(false);
    expect(dansHeuresCalmes(new Date('2026-01-15T06:30:00Z'))).toBe(true); // 7 h 30
    expect(dansHeuresCalmes(new Date('2026-01-15T08:30:00Z'))).toBe(false); // 9 h 30
  });
});

describe('estPushable', () => {
  it('les types in-app ne sont jamais poussés', () => {
    expect(estPushable(PREFS, 'meteo_favorable')).toBe(false);
    expect(estPushable(PREFS, 'meteo_danger')).toBe(false);
  });
  it('un type vital est poussé si sa catégorie est active', () => {
    expect(estPushable(PREFS, 'varroa_seuil')).toBe(true);
    expect(estPushable({ ...PREFS, sante: false }, 'varroa_seuil')).toBe(false);
  });
});

describe('planifierPush — garde-fous anti-spam', () => {
  it('ignore les types in-app (cloche seulement)', () => {
    expect(planifierPush([{ type: 'meteo_danger', priorite: 'haute' }], PREFS, JOUR)).toHaveLength(
      0,
    );
  });

  it('une critique part toujours, individuellement, même la nuit', () => {
    const out = planifierPush([{ type: 'maladie_loque', priorite: 'critique' }], PREFS, NUIT);
    expect(out).toHaveLength(1);
    expect(out[0]!.priorite).toBe('critique');
  });

  it('heures calmes : diffère basse/moyenne, garde haute', () => {
    const out = planifierPush(
      [
        { type: 'stock_bas', priorite: 'moyenne' },
        { type: 'varroa_seuil', priorite: 'haute' },
      ],
      PREFS,
      NUIT,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.priorite).toBe('haute');
  });

  it('résumé adaptatif au-delà du seuil (en journée)', () => {
    const out = planifierPush(
      [
        { type: 'stock_bas', priorite: 'moyenne' },
        { type: 'facture_retard', priorite: 'haute' },
        { type: 'visite_requise', priorite: 'moyenne' },
      ],
      PREFS,
      JOUR,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.tag).toBe('alertes-groupe');
  });

  it('catégorie coupée → aucun push de cette famille', () => {
    expect(
      planifierPush(
        [{ type: 'varroa_seuil', priorite: 'haute' }],
        { ...PREFS, sante: false },
        JOUR,
      ),
    ).toHaveLength(0);
  });

  it('anti-rafale : diffère les non-urgents après une création récente', () => {
    const out = planifierPush([{ type: 'stock_bas', priorite: 'moyenne' }], PREFS, JOUR, {
      recemmentNotifie: true,
    });
    expect(out).toHaveLength(0);
  });
});
