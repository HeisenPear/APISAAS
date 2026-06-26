import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  routeOptimale,
  routeUrgences,
  distanceTotaleKm,
  lienMaps,
  type ArretBase,
} from '../../../../app/utils/tourneeRoutes';

const a = (over: Partial<ArretBase> & Pick<ArretBase, 'rucherId' | 'lat' | 'lng'>): ArretBase => ({
  nom: over.rucherId,
  commune: null,
  nbEnRetard: 0,
  nbCritiques: 0,
  ...over,
});

// 4 points alignés ouest→est : A(0) B(0.1) C(0.2) D(0.3)
const A = a({ rucherId: 'A', lat: 45, lng: 0 });
const B = a({ rucherId: 'B', lat: 45, lng: 0.1 });
const C = a({ rucherId: 'C', lat: 45, lng: 0.2 });
const D = a({ rucherId: 'D', lat: 45, lng: 0.3 });

describe('routeOptimale', () => {
  it('ordonne des points alignés sans détour (A-B-C-D ou D-C-B-A)', () => {
    // Entrée volontairement dans le désordre.
    const route = routeOptimale([C, A, D, B]);
    const ordre = route.map((r) => r.rucherId).join('');
    expect(['ABCD', 'DCBA']).toContain(ordre);
    // distance totale = 3 sauts de ~7.9 km (0.1° de longitude à 45°)
    expect(distanceTotaleKm(route)).toBeLessThan(25);
  });

  it('respecte un départ imposé', () => {
    const route = routeOptimale([C, A, D, B], 'C');
    expect(route[0]!.rucherId).toBe('C');
  });

  it('1er arrêt a une distance 0 et ordre 1', () => {
    const route = routeOptimale([A, B]);
    expect(route[0]!.distanceKm).toBe(0);
    expect(route[0]!.ordre).toBe(1);
    expect(route[1]!.ordre).toBe(2);
  });

  it('trouve un trajet plus court que l’ordre naïf sur un cas piège', () => {
    // Ordre d'entrée A, D, B, C → naïf = A→D→B→C (long aller-retour).
    const seq = [A, D, B, C];
    let naif = 0;
    for (let i = 1; i < seq.length; i++) naif += haversineKm(seq[i - 1]!, seq[i]!);
    const opt = distanceTotaleKm(routeOptimale(seq));
    expect(opt).toBeLessThan(naif);
  });
});

describe('routeUrgences', () => {
  it('démarre sur le rucher le plus critique', () => {
    const route = routeUrgences([
      a({ rucherId: 'A', lat: 45, lng: 0 }),
      a({ rucherId: 'B', lat: 45, lng: 0.1, nbCritiques: 3 }),
      a({ rucherId: 'C', lat: 45, lng: 0.2 }),
    ]);
    expect(route[0]!.rucherId).toBe('B');
  });
});

describe('lienMaps & haversineKm', () => {
  it('haversine ~0 pour le même point', () => {
    expect(haversineKm({ lat: 45, lng: 5 }, { lat: 45, lng: 5 })).toBeCloseTo(0, 5);
  });
  it('construit un lien Maps multi-étapes', () => {
    const url = lienMaps([
      { lat: 45, lng: 0 },
      { lat: 46, lng: 1 },
    ]);
    expect(url).toBe('https://www.google.com/maps/dir/45,0/46,1');
  });
});
