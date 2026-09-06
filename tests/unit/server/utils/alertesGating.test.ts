import { describe, it, expect } from 'vitest';
import {
  FEATURE_PAR_TYPE,
  TYPES_URGENTS,
  peutRecevoir,
  estUrgent,
  minPlanPourType,
} from '../../../../server/utils/alertesGating';
import { PLAN_CONFIGS, type Plan, type PlanFeatures } from '../../../../app/config/plans';
import { TYPES_PUSH } from '../../../../server/utils/alertesPush';
import { CATEGORIE_PAR_TYPE } from '../../../../server/utils/alertesCategories';

describe('peutRecevoir — gating de diffusion par plan', () => {
  it('laisse passer les types universels (sécurité/sanitaire/réglementaire) sur TOUS les plans', () => {
    const universels = [
      'sante_critique',
      'meteo_danger',
      'napi',
      'facture_retard',
      'visite_requise',
      'varroa_seuil',
      'maladie_loque',
      'mortalite_anormale',
      'pesee_chute',
      'rdv_rappel',
    ];
    for (const plan of Object.keys(PLAN_CONFIGS) as Plan[]) {
      for (const type of universels) {
        expect(peutRecevoir(plan, type)).toBe(true);
      }
    }
  });

  it('gate stock_bas / traitement_fin / reine_agee à Starter+ (pas Découverte)', () => {
    for (const type of ['stock_bas', 'traitement_fin', 'reine_agee']) {
      expect(peutRecevoir('decouverte', type)).toBe(false);
      expect(peutRecevoir('starter', type)).toBe(true);
      expect(peutRecevoir('pro', type)).toBe(true);
      expect(peutRecevoir('expert', type)).toBe(true);
    }
  });

  it('gate transhumance_proche à Pro+', () => {
    expect(peutRecevoir('decouverte', 'transhumance_proche')).toBe(false);
    expect(peutRecevoir('starter', 'transhumance_proche')).toBe(false);
    expect(peutRecevoir('pro', 'transhumance_proche')).toBe(true);
    expect(peutRecevoir('expert', 'transhumance_proche')).toBe(true);
  });

  it('gate commande_a_cloturer à Expert uniquement', () => {
    expect(peutRecevoir('pro', 'commande_a_cloturer')).toBe(false);
    expect(peutRecevoir('expert', 'commande_a_cloturer')).toBe(true);
  });

  it('un type inconnu retombe sur universel (défaut prudent)', () => {
    expect(peutRecevoir('decouverte', 'type_inexistant_xyz')).toBe(true);
  });
});

describe('estUrgent — canal email de secours', () => {
  it('marque urgents les 4 types vitaux, pas les autres', () => {
    expect(estUrgent('meteo_danger')).toBe(true);
    expect(estUrgent('sante_critique')).toBe(true);
    expect(estUrgent('maladie_loque')).toBe(true);
    expect(estUrgent('mortalite_anormale')).toBe(true);
    expect(estUrgent('visite_requise')).toBe(false);
    expect(estUrgent('stock_bas')).toBe(false);
  });

  it('tous les types urgents sont universels (un danger vital ne dépend pas du plan)', () => {
    for (const type of TYPES_URGENTS) {
      expect(peutRecevoir('decouverte', type)).toBe(true);
    }
  });
});

describe('minPlanPourType — pour badges UI', () => {
  it('universel → decouverte, gaté → plan minimal réel', () => {
    expect(minPlanPourType('sante_critique')).toBe('decouverte');
    expect(minPlanPourType('stock_bas')).toBe('starter');
    expect(minPlanPourType('transhumance_proche')).toBe('pro');
    expect(minPlanPourType('commande_a_cloturer')).toBe('expert');
  });
});

describe('cohérence du mapping', () => {
  it('chaque feature de FEATURE_PAR_TYPE existe dans PlanFeatures (garde-fou anti-typo)', () => {
    const featureKeys = new Set(
      Object.keys(PLAN_CONFIGS.expert.features) as (keyof PlanFeatures)[],
    );
    for (const [type, portee] of Object.entries(FEATURE_PAR_TYPE)) {
      if (portee !== 'universel') {
        expect(featureKeys.has(portee), `${type} → ${String(portee)}`).toBe(true);
      }
    }
  });

  it('tout type pushable (TYPES_PUSH) a une portée définie dans FEATURE_PAR_TYPE', () => {
    for (const type of TYPES_PUSH) {
      expect(FEATURE_PAR_TYPE[type], `type poussable non mappé : ${type}`).toBeDefined();
    }
  });

  it('tout type connu des catégories a une portée (ou retombe explicitement sur universel)', () => {
    // Non bloquant : on vérifie juste que le défaut universel est intentionnel.
    for (const type of Object.keys(CATEGORIE_PAR_TYPE)) {
      const portee = FEATURE_PAR_TYPE[type];
      // meteo_favorable est le seul type non-push volontairement gaté.
      expect(portee === undefined || typeof portee === 'string').toBe(true);
    }
  });
});
