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
// Plan avec toutes les features → le gating par plan n'interfère pas avec les
// tests d'anti-spam (qui portent sur la planification, pas sur le gating).
const PLAN = 'expert' as const;
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
  it('la météo FAVORABLE reste in-app (jamais poussée)', () => {
    expect(estPushable(PREFS, 'meteo_favorable')).toBe(false);
  });
  it('la météo DANGEREUSE est désormais poussée', () => {
    expect(estPushable(PREFS, 'meteo_danger')).toBe(true);
  });
  it('un type vital est poussé si sa catégorie est active', () => {
    expect(estPushable(PREFS, 'varroa_seuil')).toBe(true);
    expect(estPushable({ ...PREFS, sante: false }, 'varroa_seuil')).toBe(false);
  });
});

describe('planifierPush — garde-fous anti-spam', () => {
  it('ignore les types in-app (cloche seulement)', () => {
    expect(
      planifierPush([{ type: 'meteo_favorable', priorite: 'basse' }], PREFS, JOUR, PLAN),
    ).toHaveLength(0);
  });

  it('une critique part toujours, individuellement, même la nuit', () => {
    const out = planifierPush([{ type: 'maladie_loque', priorite: 'critique' }], PREFS, NUIT, PLAN);
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
      PLAN,
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
      PLAN,
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
        PLAN,
      ),
    ).toHaveLength(0);
  });

  it('gating par plan : un Découverte ne reçoit pas un type gaté', () => {
    // stock_bas est gaté à Starter+ → un Découverte ne le reçoit pas.
    expect(
      planifierPush([{ type: 'stock_bas', priorite: 'haute' }], PREFS, JOUR, 'decouverte'),
    ).toHaveLength(0);
    expect(
      planifierPush([{ type: 'stock_bas', priorite: 'haute' }], PREFS, JOUR, 'starter'),
    ).toHaveLength(1);
  });

  it('anti-rafale : diffère les non-urgents après une création récente', () => {
    const out = planifierPush([{ type: 'stock_bas', priorite: 'moyenne' }], PREFS, JOUR, PLAN, {
      recemmentNotifie: true,
    });
    expect(out).toHaveLength(0);
  });
});
