import { describe, it, expect } from 'vitest';
import {
  WIDGET_CATALOG,
  PREFIXE_RACCOURCI,
  estRaccourci,
  widgetsDisponibles,
  widgetsParDefaut,
  widgetParId,
} from '~/config/widgets';
import { NAV_SECTIONS } from '~/config/navigation';
import { PLANS, hasFeature, type Plan } from '~/config/plans';

/**
 * Les raccourcis du tableau de bord sont DÉRIVÉS de `navigation.ts`, la source
 * unique de la navigation. Ce banc verrouille les deux propriétés qui, si elles
 * cassaient, casseraient en silence : la parité avec la barre latérale (donc le
 * gating par formule) et l'exclusion de la disposition par défaut.
 */
const raccourcis = WIDGET_CATALOG.filter(estRaccourci);
const itemsNav = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.to !== '/dashboard');

describe('raccourcis du tableau de bord', () => {
  it('en propose un par entrée de navigation, sauf le tableau de bord lui-même', () => {
    // Un raccourci vers la page où l'on se trouve déjà n'aurait aucun sens.
    expect(raccourcis).toHaveLength(itemsNav.length);
    for (const item of itemsNav) {
      expect(widgetParId(`${PREFIXE_RACCOURCI}${item.to}`)).toBeDefined();
    }
    expect(widgetParId(`${PREFIXE_RACCOURCI}/dashboard`)).toBeUndefined();
  });

  it('reprend EXACTEMENT le verrou de formule de l’entrée de navigation', () => {
    // Le point le plus sensible : un raccourci qui perdrait sa `feature`
    // offrirait à un compte Découverte une porte d'entrée vers une page que la
    // barre latérale lui montre cadenassée.
    for (const item of itemsNav) {
      const w = widgetParId(`${PREFIXE_RACCOURCI}${item.to}`)!;
      expect(w.feature).toBe(item.feature);
      expect(w.raccourciVers).toBe(item.to);
      expect(w.icon).toBe(item.icon);
      expect(w.label).toBe(item.label);
    }
  });

  it('n’offre à chaque formule que des destinations qu’elle peut ouvrir', () => {
    for (const plan of PLANS as readonly Plan[]) {
      for (const w of widgetsDisponibles(plan).filter(estRaccourci)) {
        if (w.feature) expect(hasFeature(plan, w.feature)).toBe(true);
      }
    }
  });

  it('ne s’invite JAMAIS dans la disposition par défaut', () => {
    // Une quarantaine de tuiles de navigation posées d'office noieraient le
    // tableau de bord d'un nouvel inscrit sous des blocs qu'il n'a pas demandés.
    for (const plan of PLANS as readonly Plan[]) {
      const defaut = widgetsParDefaut(plan);
      expect(defaut.filter(estRaccourci)).toEqual([]);
      expect(defaut.length).toBeGreaterThan(0);
    }
  });

  it('porte des identifiants uniques, sans collision avec les blocs', () => {
    const ids = WIDGET_CATALOG.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of WIDGET_CATALOG.filter((x) => !estRaccourci(x))) {
      expect(w.id.startsWith(PREFIXE_RACCOURCI)).toBe(false);
    }
  });
});
