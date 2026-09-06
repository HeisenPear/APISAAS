import { describe, expect, it } from 'vitest';
import {
  PLANS,
  PLAN_CONFIGS,
  hasFeature,
  getLimit,
  minimumPlanFor,
  minimumPlanForLimit,
  isPlanAtLeast,
  type Plan,
  type PlanFeatures,
  type PlanLimits,
} from '../../../../app/config/plans';
import { ROUTE_GATES } from '../../../../app/config/route-gates';

// ═══════════════════════════════════════════════════════════════════════════
// COHÉRENCE DES PACKS — verrou anti-régression sur CHAQUE plan.
//
// Le bug « cliente Expert bloquée à 1 rucher » venait d'une divergence de
// résolution de plan, pas de la config. Mais pour être CERTAIN qu'aucun pack ne
// mange un bug du même genre, on verrouille ici les invariants structurels :
// un plan plus cher n'offre JAMAIS moins qu'un plan moins cher (limites ET
// fonctionnalités), et les helpers de gating disent la vérité.
// ═══════════════════════════════════════════════════════════════════════════

const ORDRE: Plan[] = ['decouverte', 'starter', 'pro', 'expert'];
const LIMIT_KEYS = Object.keys(PLAN_CONFIGS.expert.limites) as (keyof PlanLimits)[];
const FEATURE_KEYS = Object.keys(PLAN_CONFIGS.expert.features) as (keyof PlanFeatures)[];

describe('packs — l’ordre des plans est bien celui attendu', () => {
  it('PLANS = decouverte < starter < pro < expert', () => {
    expect([...PLANS]).toEqual(ORDRE);
  });
});

describe('packs — MONOTONIE DES LIMITES (un plan plus cher n’offre jamais moins)', () => {
  for (const key of LIMIT_KEYS) {
    it(`« ${key} » ne décroît jamais du plan le moins cher au plus cher`, () => {
      for (let i = 1; i < ORDRE.length; i++) {
        const bas = getLimit(ORDRE[i - 1]!, key);
        const haut = getLimit(ORDRE[i]!, key);
        // Infinity ≥ tout : un plan illimité domine toujours.
        expect(haut >= bas, `${ORDRE[i]} (${haut}) < ${ORDRE[i - 1]} (${bas}) sur ${key}`).toBe(
          true,
        );
      }
    });
  }
});

describe('packs — MONOTONIE DES FONCTIONNALITÉS (aucun pack ne perd une feature d’un pack inférieur)', () => {
  for (const key of FEATURE_KEYS) {
    it(`« ${key} » reste activée une fois débloquée`, () => {
      let vueActive = false;
      for (const plan of ORDRE) {
        const actif = hasFeature(plan, key);
        if (vueActive) {
          expect(actif, `${plan} perd « ${key} » alors qu'un plan inférieur l'a`).toBe(true);
        }
        if (actif) vueActive = true;
      }
    });
  }
});

describe('packs — bornes attendues', () => {
  it('Découverte est le plancher gratuit (1 rucher, 1 ruche, pas de facturation)', () => {
    expect(PLAN_CONFIGS.decouverte.prix).toBeNull();
    expect(getLimit('decouverte', 'ruchers')).toBe(1);
    expect(getLimit('decouverte', 'ruches')).toBe(1);
    expect(hasFeature('decouverte', 'facturationPdf')).toBe(false);
  });

  it('Expert est le plafond : ruchers/ruches/clients illimités, toutes les features', () => {
    expect(getLimit('expert', 'ruchers')).toBe(Infinity);
    expect(getLimit('expert', 'ruches')).toBe(Infinity);
    expect(getLimit('expert', 'clients')).toBe(Infinity);
    for (const key of FEATURE_KEYS) {
      expect(hasFeature('expert', key), `Expert devrait avoir « ${key} »`).toBe(true);
    }
  });
});

describe('packs — helpers de gating', () => {
  it('minimumPlanFor renvoie le plan le PLUS BAS qui a la feature', () => {
    for (const key of FEATURE_KEYS) {
      const min = minimumPlanFor(key);
      expect(hasFeature(min, key), `${key}: ${min} devrait l'avoir`).toBe(true);
      const idx = ORDRE.indexOf(min);
      if (idx > 0) {
        expect(
          hasFeature(ORDRE[idx - 1]!, key),
          `${key}: le plan sous ${min} ne doit pas l'avoir`,
        ).toBe(false);
      }
    }
  });

  it('minimumPlanForLimit trouve le plan qui couvre le besoin', () => {
    // Personne d'autre que Découverte ne devrait plafonner à 1 rucher.
    expect(minimumPlanForLimit('ruchers', 2)).not.toBe('decouverte');
    // Un besoin couvert par Découverte reste Découverte.
    expect(isPlanAtLeast(minimumPlanForLimit('ruchers', 1), 'decouverte')).toBe(true);
  });

  it('isPlanAtLeast respecte l’ordre', () => {
    expect(isPlanAtLeast('expert', 'pro')).toBe(true);
    expect(isPlanAtLeast('starter', 'pro')).toBe(false);
    expect(isPlanAtLeast('pro', 'pro')).toBe(true);
  });
});

describe('packs — intégrité des route-gates (pas de clé fantôme)', () => {
  it('chaque gate référence une feature et une limite VALIDES', () => {
    for (const [route, gate] of Object.entries(ROUTE_GATES)) {
      if (gate.feature) {
        expect(
          FEATURE_KEYS.includes(gate.feature),
          `${route}: feature inconnue ${gate.feature}`,
        ).toBe(true);
      }
      if (gate.limit) {
        expect(LIMIT_KEYS.includes(gate.limit), `${route}: limite inconnue ${gate.limit}`).toBe(
          true,
        );
      }
    }
  });
});
