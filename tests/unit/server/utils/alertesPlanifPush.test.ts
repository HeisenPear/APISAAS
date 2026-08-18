import { describe, expect, it } from 'vitest';
import {
  planifierPush,
  planifierPushDetaille,
  dansHeuresCalmes,
  estPushable,
} from '../../../../server/utils/alertesPush';

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

// ─── Sort push : tranché ou reporté ? ────────────────────────────────────────
// La distinction est ce qui empêche la perte silencieuse. Une alerte non
// poussable PAR NATURE (type hors liste blanche, catégorie coupée) a un sort
// définitif : on l'horodate, sinon le balayage du cron la réexaminerait chaque
// jour à perpétuité. Une alerte simplement REPORTÉE reste en attente.
describe('planifierPushDetaille — tranchées vs différées', () => {
  it('en heures calmes, une priorité moyenne est REPORTÉE, pas perdue', () => {
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'stock_bas', priorite: 'moyenne' }],
      PREFS,
      NUIT,
    );
    expect(plan.payloads).toHaveLength(0);
    expect(plan.differees.map((a) => a.id)).toEqual(['a1']);
    expect(plan.tranchees).toHaveLength(0);
  });

  it('en journée, la même alerte part et son sort est tranché', () => {
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'stock_bas', priorite: 'moyenne' }],
      PREFS,
      JOUR,
    );
    expect(plan.payloads).toHaveLength(1);
    expect(plan.differees).toHaveLength(0);
    expect(plan.tranchees.map((a) => a.id)).toEqual(['a1']);
  });

  it('une CRITIQUE part la nuit, et son sort est tranché', () => {
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'sante_critique', priorite: 'critique' }],
      PREFS,
      NUIT,
    );
    expect(plan.payloads).toHaveLength(1);
    expect(plan.tranchees.map((a) => a.id)).toEqual(['a1']);
    expect(plan.differees).toHaveLength(0);
  });

  it('un type in-app n’est JAMAIS reporté : son sort est tranché une fois pour toutes', () => {
    // `meteo_danger` n'est pas dans TYPES_PUSH. S'il partait en « différé », le
    // balayage du cron le réexaminerait tous les jours pour rien.
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'meteo_danger', priorite: 'haute' }],
      PREFS,
      NUIT,
    );
    expect(plan.payloads).toHaveLength(0);
    expect(plan.differees).toHaveLength(0);
    expect(plan.tranchees.map((a) => a.id)).toEqual(['a1']);
  });

  it('une catégorie coupée par l’utilisateur tranche aussi définitivement', () => {
    const sansSante = { ...PREFS, sante: false };
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'varroa_seuil', priorite: 'haute' }],
      sansSante,
      JOUR,
    );
    expect(plan.payloads).toHaveLength(0);
    expect(plan.tranchees.map((a) => a.id)).toEqual(['a1']);
    expect(plan.differees).toHaveLength(0);
  });

  it('toute alerte est soit tranchée, soit différée — jamais ni l’un ni l’autre', () => {
    // Invariant de partition : c'est lui qui garantit qu'aucune alerte ne
    // disparaît entre les mailles du filet.
    const lot = [
      { id: 'a1', type: 'sante_critique', priorite: 'critique' as const },
      { id: 'a2', type: 'visite_requise', priorite: 'haute' as const },
      { id: 'a3', type: 'stock_bas', priorite: 'moyenne' as const },
      { id: 'a4', type: 'rappel_saison', priorite: 'basse' as const },
      { id: 'a5', type: 'meteo_favorable', priorite: 'basse' as const },
    ];
    for (const quand of [JOUR, NUIT]) {
      const plan = planifierPushDetaille(lot, PREFS, quand);
      const vus = [...plan.tranchees, ...plan.differees].map((a) => a.id).sort();
      expect(vus).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
    }
  });

  it('planifierPush reste l’extraction des payloads (rétro-compatible)', () => {
    const lot = [{ id: 'a1', type: 'stock_bas', priorite: 'moyenne' as const }];
    expect(planifierPush(lot, PREFS, JOUR)).toEqual(
      planifierPushDetaille(lot, PREFS, JOUR).payloads,
    );
  });
});
