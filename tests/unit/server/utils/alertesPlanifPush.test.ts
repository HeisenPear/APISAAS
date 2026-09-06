import { describe, expect, it } from 'vitest';
import {
  planifierPush,
  planifierPushDetaille,
  dansHeuresCalmes,
  estPushable,
  LIBELLE_TYPE_ALERTE,
  TYPES_PUSH,
} from '../../../../server/utils/alertesPush';
import { TYPES_ALERTE_BALANCE } from '../../../../server/utils/balances/alertes';

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
      PLAN,
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
      PLAN,
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
      PLAN,
    );
    expect(plan.payloads).toHaveLength(1);
    expect(plan.tranchees.map((a) => a.id)).toEqual(['a1']);
    expect(plan.differees).toHaveLength(0);
  });

  it('un type in-app n’est JAMAIS reporté : son sort est tranché une fois pour toutes', () => {
    // `meteo_favorable` (le créneau de visite idéal) n'est pas dans TYPES_PUSH.
    // S'il partait en « différé », le balayage du cron le réexaminerait tous
    // les jours pour rien.
    //
    // Ce cas visait `meteo_danger` : il a changé de camp. Gel, orage, canicule
    // et vent fort sont désormais POUSSÉS sur tous les plans — c'est une
    // sécurité pour le cheptel, pas un confort. Le type in-app restant est le
    // créneau favorable.
    const plan = planifierPushDetaille(
      [{ id: 'a1', type: 'meteo_favorable', priorite: 'haute' }],
      PREFS,
      NUIT,
      PLAN,
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
      const plan = planifierPushDetaille(lot, PREFS, quand, PLAN);
      const vus = [...plan.tranchees, ...plan.differees].map((a) => a.id).sort();
      expect(vus).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
    }
  });

  it('planifierPush reste l’extraction des payloads (rétro-compatible)', () => {
    const lot = [{ id: 'a1', type: 'stock_bas', priorite: 'moyenne' as const }];
    expect(planifierPush(lot, PREFS, JOUR, PLAN)).toEqual(
      planifierPushDetaille(lot, PREFS, JOUR, PLAN).payloads,
    );
  });
});

// ─── Garde-fous de couverture ────────────────────────────────────────────────
// Ces deux tests auraient attrapé le défaut d'origine : les six types de
// balance étaient créés en base et n'atteignaient jamais l'apiculteur, faute
// d'être dans la liste blanche.
describe('couverture de la liste blanche push', () => {
  it('les 6 types de balance sont pushables', () => {
    for (const type of TYPES_ALERTE_BALANCE) {
      expect(TYPES_PUSH.has(type), `« ${type} » n'atteindrait jamais l'apiculteur`).toBe(true);
    }
  });

  it('tout type pushable a un libellé pour le push résumé', () => {
    // Sans libellé, un résumé afficherait « 2 balance_essaimage » à l'écran.
    for (const type of TYPES_PUSH) {
      expect(LIBELLE_TYPE_ALERTE[type], `« ${type} » sans libellé de résumé`).toBeTruthy();
    }
  });

  it('une balance qui déclenche plusieurs alertes produit UN résumé lisible', () => {
    const plan = planifierPushDetaille(
      [
        { id: 'a1', type: 'balance_miellee', priorite: 'basse' },
        { id: 'a2', type: 'balance_hausse_pleine', priorite: 'moyenne' },
        { id: 'a3', type: 'balance_batterie', priorite: 'moyenne' },
        { id: 'a4', type: 'balance_muette', priorite: 'moyenne' },
      ],
      PREFS,
      JOUR,
      PLAN,
    );
    expect(plan.payloads).toHaveLength(1);
    expect(plan.payloads[0]!.body).not.toMatch(/balance_/); // pas de type brut
    expect(plan.payloads[0]!.body).toContain('miellée en cours');
  });

  it('un vol de ruche part seul et perce les heures calmes', () => {
    // `balance_vol` est la seule alerte CRITIQUE du domaine : elle ne doit ni
    // être noyée dans un résumé, ni attendre le matin.
    const plan = planifierPushDetaille(
      [
        { id: 'a1', type: 'balance_vol', priorite: 'critique' },
        { id: 'a2', type: 'balance_miellee', priorite: 'basse' },
      ],
      PREFS,
      NUIT,
      PLAN,
    );
    expect(plan.payloads).toHaveLength(1);
    expect(plan.payloads[0]!.tag).toContain('balance_vol');
    expect(plan.differees.map((a) => a.id)).toEqual(['a2']);
  });

  it('couper la catégorie « gestion » fait taire batterie et capteur muet', () => {
    const sansGestion = { ...PREFS, gestion: false };
    const plan = planifierPushDetaille(
      [
        { id: 'a1', type: 'balance_batterie', priorite: 'moyenne' },
        { id: 'a2', type: 'balance_vol', priorite: 'critique' },
      ],
      sansGestion,
      JOUR,
      PLAN,
    );
    // Le vol (catégorie santé) passe, la batterie (gestion) est tranchée.
    expect(plan.payloads).toHaveLength(1);
    expect(plan.payloads[0]!.tag).toContain('balance_vol');
    expect(plan.tranchees.map((a) => a.id).sort()).toEqual(['a1', 'a2']);
  });
});
