import { describe, it, expect } from 'vitest';
import {
  classifierCulture,
  classifierForet,
  classifierCorine,
  genererEchantillons,
  agregerButinage,
  AUTRE,
  type EchantillonClasse,
} from '../../../../server/utils/butinage';

describe('classifierCulture', () => {
  it('colza et tournesol = très mellifères', () => {
    expect(classifierCulture('5').label).toBe('Colza');
    expect(classifierCulture('5').mellifere).toBe(1);
    expect(classifierCulture('6').label).toBe('Tournesol');
  });
  it('céréales = peu mellifères', () => {
    expect(classifierCulture('1').mellifere).toBeLessThan(0.3);
  });
  it('code inconnu = culture générique', () => {
    expect(classifierCulture('99').categorie).toBe('culture');
    expect(classifierCulture(null).label).toBe('Cultures');
  });
});

describe('classifierForet', () => {
  it('feuillus > conifères en valeur mellifère', () => {
    expect(classifierForet('Forêt fermée feuillus').mellifere).toBeGreaterThan(
      classifierForet('Forêt fermée conifères').mellifere,
    );
  });
  it('catégorie forêt par défaut', () => {
    expect(classifierForet(null).categorie).toBe('foret');
  });
});

describe('classifierCorine', () => {
  it('classe correctement les grandes familles CLC', () => {
    expect(classifierCorine('111').categorie).toBe('urbain'); // urbain dense
    expect(classifierCorine('322').miel).toBe('bruyère'); // landes
    expect(classifierCorine('323').miel).toBe('thym'); // garrigue
    expect(classifierCorine('231').mellifere).toBeGreaterThan(0.5); // prairies
    expect(classifierCorine('512').mellifere).toBe(0); // eau
  });
  it('replie sur la famille du 1er chiffre si code inconnu', () => {
    expect(classifierCorine('199').categorie).toBe('urbain');
    expect(classifierCorine('399').mellifere).toBeGreaterThan(0.4); // naturel
  });
  it("déduit le miel de l'essence forestière", () => {
    expect(classifierForet('feuillus', 'Châtaignier').miel).toBe('châtaignier');
    expect(classifierForet('feuillus', 'Robinier faux-acacia').miel).toBe('acacia');
    expect(classifierForet('conifères', 'Sapin, épicéa').miel).toBe('sapin');
  });
});

describe('genererEchantillons', () => {
  it('centre + 2 anneaux = 13 points dans le rayon', () => {
    const pts = genererEchantillons(45, 5, 3000);
    expect(pts.length).toBe(13);
    expect(pts[0]).toEqual({ lat: 45, lng: 5 }); // centre d'abord
  });
  it('les points restent proches du centre (< ~0.05°)', () => {
    const pts = genererEchantillons(45, 5, 3000);
    for (const p of pts) {
      expect(Math.abs(p.lat - 45)).toBeLessThan(0.05);
      expect(Math.abs(p.lng - 5)).toBeLessThan(0.06);
    }
  });
});

describe('agregerButinage', () => {
  const ech = (over: Partial<EchantillonClasse>): EchantillonClasse => ({
    categorie: 'culture',
    label: 'X',
    mellifere: 0.5,
    ...over,
  });

  it('calcule des % et un potentiel cohérents', () => {
    const res = agregerButinage([
      classifierCulture('5'), // colza 1.0
      classifierCulture('5'), // colza 1.0
      classifierForet('feuillus'), // 0.75
      AUTRE, // 0.25
    ]);
    expect(res.nbEchantillons).toBe(4);
    const colza = res.ressources.find((r) => r.label === 'Colza');
    expect(colza?.pct).toBe(50);
    expect(colza?.mellifere).toBe(true);
    // vals=[1,1,0.75,0.25] mean=0.75 meanTop2=1 → 100*(0.6*0.75+0.4*1)=85
    expect(res.potentiel).toBe(85);
    expect(res.potentielLabel).toBe('excellent');
  });

  it('trie les ressources par % décroissant', () => {
    const res = agregerButinage([ech({ label: 'A' }), ech({ label: 'B' }), ech({ label: 'B' })]);
    expect(res.ressources[0]!.label).toBe('B');
  });

  it('100% eau/roche = potentiel nul', () => {
    const eau = classifierCorine('512'); // plans d'eau, mellifère 0
    const res = agregerButinage([eau, eau, eau]);
    expect(res.potentiel).toBe(0);
    expect(res.potentielLabel).toBe('faible');
  });

  it('déduit les miels probables des ressources présentes', () => {
    const res = agregerButinage([
      classifierCulture('5'), // colza
      classifierCulture('6'), // tournesol
      classifierForet('feuillus', 'Châtaignier'), // châtaignier
      AUTRE, // pas de miel
    ]);
    const miels = res.mielsProbables.map((m) => m.typeMiel);
    expect(miels).toContain('colza');
    expect(miels).toContain('tournesol');
    expect(miels).toContain('châtaignier');
    expect(res.mielsProbables.find((m) => m.typeMiel === 'colza')?.pct).toBe(25);
  });
});
