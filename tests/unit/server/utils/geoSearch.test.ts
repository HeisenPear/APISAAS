import { describe, it, expect } from 'vitest';
import {
  distKm,
  grille,
  hexagone,
  plusProcheCommune,
  selectionEspacee,
  mapLimit,
} from '../../../../server/utils/geoSearch';

describe('distKm', () => {
  it('Paris → Lyon ≈ 392 km', () => {
    const d = distKm({ lat: 48.8566, lng: 2.3522 }, { lat: 45.764, lng: 4.8357 });
    expect(d).toBeGreaterThan(385);
    expect(d).toBeLessThan(400);
  });
});

describe('grille', () => {
  it('produit n×n points dans la bbox', () => {
    const pts = grille(44, 45, 4, 5, 5);
    expect(pts).toHaveLength(25);
    for (const p of pts) {
      expect(p.lat).toBeGreaterThanOrEqual(44);
      expect(p.lat).toBeLessThanOrEqual(45);
      expect(p.lng).toBeGreaterThanOrEqual(4);
      expect(p.lng).toBeLessThanOrEqual(5);
    }
  });
});

describe('hexagone', () => {
  it('renvoie 6 sommets à ~rayon du centre', () => {
    const c = { lat: 45, lng: 5 };
    const h = hexagone(c.lat, c.lng, 2000);
    expect(h).toHaveLength(6);
    for (const p of h) {
      const d = distKm(c, p);
      expect(d).toBeGreaterThan(1.7);
      expect(d).toBeLessThan(2.3);
    }
  });
});

describe('plusProcheCommune', () => {
  it('trouve la commune la plus proche', () => {
    const communes = [
      { nom: 'A', lat: 45.0, lng: 5.0 },
      { nom: 'B', lat: 45.5, lng: 5.0 },
    ];
    const r = plusProcheCommune({ lat: 45.45, lng: 5.0 }, communes);
    expect(r.nom).toBe('B');
    expect(r.dist).toBeLessThan(8);
  });
});

describe('selectionEspacee', () => {
  it('garde les meilleurs scores espacés d’au moins minKm', () => {
    const pts = [
      { lat: 45.0, lng: 5.0, score: 0.9 },
      { lat: 45.01, lng: 5.0, score: 0.85 }, // ~1 km du 1er → écarté
      { lat: 46.0, lng: 5.0, score: 0.8 }, // ~111 km → gardé
    ];
    const sel = selectionEspacee(pts, 3, 15);
    expect(sel.map((s) => s.score)).toEqual([0.9, 0.8]);
  });

  it('respecte la limite n', () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ lat: 40 + i, lng: 5, score: i / 10 }));
    expect(selectionEspacee(pts, 3, 1).length).toBe(3);
  });
});

describe('mapLimit', () => {
  it('préserve l’ordre et plafonne la concurrence', async () => {
    let courant = 0;
    let pic = 0;
    const fn = async (x: number) => {
      courant++;
      pic = Math.max(pic, courant);
      await new Promise((r) => setTimeout(r, 5));
      courant--;
      return x * 2;
    };
    const res = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8], 3, fn);
    expect(res).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(pic).toBeLessThanOrEqual(3);
  });
});
