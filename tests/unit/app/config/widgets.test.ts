import { describe, expect, it } from 'vitest';
import {
  WIDGET_CATALOG,
  widgetsDisponibles,
  widgetDisponible,
  planMinimumWidget,
} from '../../../../app/config/widgets';
import { hasFeature, type Plan } from '../../../../app/config/plans';

// ═══════════════════════════════════════════════════════════════════════════
// Widgets par plan — on verrouille l'invariant « chaque plan récupère de
// nouveaux widgets, jamais moins » et la cohérence du gating avec plans.ts.
// ═══════════════════════════════════════════════════════════════════════════

const ORDRE: Plan[] = ['decouverte', 'starter', 'pro', 'expert'];

describe('widgets — disponibilité par plan', () => {
  it('la disponibilité suit exactement le gating de plans.ts', () => {
    for (const plan of ORDRE) {
      for (const w of WIDGET_CATALOG) {
        const attendu = !w.feature || hasFeature(plan, w.feature);
        expect(widgetDisponible(w, plan)).toBe(attendu);
      }
    }
  });

  it('MONOTONIE : un plan plus élevé n’a jamais MOINS de widgets', () => {
    for (let i = 1; i < ORDRE.length; i++) {
      const bas = widgetsDisponibles(ORDRE[i - 1]!).length;
      const haut = widgetsDisponibles(ORDRE[i]!).length;
      expect(haut, `${ORDRE[i]} (${haut}) < ${ORDRE[i - 1]} (${bas})`).toBeGreaterThanOrEqual(bas);
    }
  });

  it('MONOTONIE : tout widget d’un plan inférieur reste dispo au-dessus', () => {
    for (let i = 1; i < ORDRE.length; i++) {
      const basIds = new Set(widgetsDisponibles(ORDRE[i - 1]!).map((w) => w.id));
      const hautIds = new Set(widgetsDisponibles(ORDRE[i]!).map((w) => w.id));
      for (const id of basIds) {
        expect(hautIds.has(id), `${ORDRE[i]} perd le widget ${id}`).toBe(true);
      }
    }
  });
});

describe('widgets — bornes', () => {
  it('Découverte a au moins les widgets de base (sans feature)', () => {
    const base = WIDGET_CATALOG.filter((w) => !w.feature).map((w) => w.id);
    const dispoDecouverte = widgetsDisponibles('decouverte').map((w) => w.id);
    expect(dispoDecouverte).toEqual(expect.arrayContaining(base));
    expect(base.length).toBeGreaterThan(0);
  });

  it('Expert a TOUS les widgets du catalogue', () => {
    expect(widgetsDisponibles('expert')).toHaveLength(WIDGET_CATALOG.length);
  });

  it('Expert débloque strictement plus que Découverte (progression réelle)', () => {
    expect(widgetsDisponibles('expert').length).toBeGreaterThan(
      widgetsDisponibles('decouverte').length,
    );
  });
});

describe('widgets — méta', () => {
  it('les ids sont uniques', () => {
    const ids = WIDGET_CATALOG.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('planMinimumWidget = Découverte pour un widget de base, sinon le plan de la feature', () => {
    for (const w of WIDGET_CATALOG) {
      const min = planMinimumWidget(w);
      // Le plan minimum doit effectivement rendre le widget disponible.
      expect(widgetDisponible(w, min)).toBe(true);
      if (!w.feature) expect(min).toBe('decouverte');
    }
  });
});
