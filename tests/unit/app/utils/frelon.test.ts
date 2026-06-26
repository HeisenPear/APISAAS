import { describe, it, expect } from 'vitest';
import { distanceKm, menacesParRucher, statsFrelon, type NidPos } from '~/utils/frelon';

describe('distanceKm', () => {
  it('vaut ~0 pour le même point', () => {
    expect(distanceKm({ lat: 45, lng: 5 }, { lat: 45, lng: 5 })).toBeCloseTo(0, 5);
  });
  it('mesure une distance plausible', () => {
    // ~0.1° de longitude à 45° ≈ 7.9 km
    const d = distanceKm({ lat: 45, lng: 0 }, { lat: 45, lng: 0.1 });
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(9);
  });
});

describe('menacesParRucher', () => {
  const rucher = { id: 'R', nom: 'Rucher', lat: 45, lng: 5 };

  it('niveau élevé si un nid actif est à moins d’1 km', () => {
    const nids: NidPos[] = [{ id: 'n1', lat: 45.005, lng: 5.005, statut: 'confirme' }]; // ~0.7 km
    const m = menacesParRucher(nids, [rucher]);
    expect(m[0]!.niveau).toBe('eleve');
    expect(m[0]!.nidsProches).toBe(1);
  });

  it('niveau surveillance dans le rayon mais au-delà d’1 km', () => {
    const nids: NidPos[] = [{ id: 'n1', lat: 45.018, lng: 5.018, statut: 'signale' }]; // ~2.3 km
    const m = menacesParRucher(nids, [rucher]);
    expect(m[0]!.niveau).toBe('surveillance');
  });

  it('ignore les nids détruits et ceux hors rayon', () => {
    const nids: NidPos[] = [
      { id: 'n1', lat: 45.005, lng: 5.005, statut: 'detruit' }, // proche mais détruit
      { id: 'n2', lat: 46, lng: 6, statut: 'confirme' }, // trop loin
    ];
    const m = menacesParRucher(nids, [rucher]);
    expect(m[0]!.niveau).toBe('aucun');
    expect(m[0]!.nidsProches).toBe(0);
  });

  it('trie les ruchers les plus menacés en premier', () => {
    const r2 = { id: 'R2', nom: 'Loin', lat: 48, lng: 2 };
    const nids: NidPos[] = [{ id: 'n1', lat: 45.005, lng: 5.005, statut: 'confirme' }];
    const m = menacesParRucher(nids, [r2, rucher]);
    expect(m[0]!.rucherId).toBe('R');
  });
});

describe('statsFrelon', () => {
  it('compte par statut et les actifs', () => {
    const s = statsFrelon([
      { statut: 'signale' },
      { statut: 'confirme' },
      { statut: 'detruit' },
      { statut: 'confirme' },
    ]);
    expect(s.total).toBe(4);
    expect(s.confirme).toBe(2);
    expect(s.detruit).toBe(1);
    expect(s.actifs).toBe(3); // tout sauf le détruit
  });
});
