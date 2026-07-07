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

describe('menacesParRucher (proximité × quantité)', () => {
  const rucher = { id: 'R', nom: 'Rucher', lat: 45, lng: 5 };
  const nid = (over: Partial<NidPos> & Pick<NidPos, 'id' | 'lat' | 'lng'>): NidPos => ({
    statut: 'confirme',
    pression: 'modere',
    ...over,
  });

  it('infestation proche → niveau infestation', () => {
    const m = menacesParRucher(
      [nid({ id: 'n1', lat: 45.005, lng: 5.005, pression: 'infestation' })],
      [rucher],
    );
    expect(m[0]!.niveau).toBe('infestation');
    expect(m[0]!.nidsProches).toBe(1);
  });

  it('pression forte à moins d’1 km → infestation (3 + bonus proximité)', () => {
    const m = menacesParRucher(
      [nid({ id: 'n1', lat: 45.005, lng: 5.005, pression: 'fort' })],
      [rucher],
    );
    expect(m[0]!.niveau).toBe('infestation');
  });

  it('pression modérée au-delà d’1 km → modérée', () => {
    const m = menacesParRucher(
      [nid({ id: 'n1', lat: 45.018, lng: 5.018, pression: 'modere' })],
      [rucher],
    ); // ~2.3 km
    expect(m[0]!.niveau).toBe('modere');
  });

  it('quelques individus isolés et lointains → faible', () => {
    const m = menacesParRucher(
      [nid({ id: 'n1', lat: 45.018, lng: 5.018, pression: 'faible' })],
      [rucher],
    );
    expect(m[0]!.niveau).toBe('faible');
  });

  it('ignore les nids détruits, rejetés et hors rayon → aucune', () => {
    const nids: NidPos[] = [
      nid({ id: 'n1', lat: 45.005, lng: 5.005, statut: 'detruit', pression: 'infestation' }),
      nid({ id: 'n3', lat: 45.004, lng: 5.004, statut: 'rejete', pression: 'fort' }),
      nid({ id: 'n2', lat: 46, lng: 6, statut: 'confirme', pression: 'infestation' }),
    ];
    const m = menacesParRucher(nids, [rucher]);
    expect(m[0]!.niveau).toBe('aucun');
    expect(m[0]!.nidsProches).toBe(0);
  });

  it('trie les ruchers les plus menacés en premier', () => {
    const r2 = { id: 'R2', nom: 'Loin', lat: 48, lng: 2 };
    const nids = [nid({ id: 'n1', lat: 45.005, lng: 5.005, pression: 'fort' })];
    const m = menacesParRucher(nids, [r2, rucher]);
    expect(m[0]!.rucherId).toBe('R');
  });
});

describe('statsFrelon', () => {
  it('compte par statut et les actifs (ni détruit ni rejeté)', () => {
    const s = statsFrelon([
      { statut: 'a_verifier' },
      { statut: 'confirme' },
      { statut: 'detruit' },
      { statut: 'confirme' },
      { statut: 'rejete' },
    ]);
    expect(s.total).toBe(5);
    expect(s.confirme).toBe(2);
    expect(s.detruit).toBe(1);
    expect(s.rejete).toBe(1);
    expect(s.actifs).toBe(3); // a_verifier + 2 confirmés
  });
});
