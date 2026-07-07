import { describe, it, expect } from 'vitest';
import {
  prixMoyenKg,
  rentabiliteRuchers,
  alignerMensuel,
  comparaisonMensuelle,
  deltaPct,
  pearson,
  indiceFavorabilite,
  correlationMeteoProduction,
  centroide,
  tendance,
  syntheseSaisons,
  PRIX_MIEL_DEFAUT_EUR_KG,
  type MeteoMois,
  type SaisonAgg,
} from '../../../../server/utils/analytics';

describe('prixMoyenKg', () => {
  it('dérive le prix réalisé CA ÷ production', () => {
    expect(prixMoyenKg(1200, 100)).toBe(12);
    expect(prixMoyenKg(1500, 100)).toBe(15);
  });
  it('replie sur le prix marché si pas de vente ou pas de production', () => {
    expect(prixMoyenKg(0, 100)).toBe(PRIX_MIEL_DEFAUT_EUR_KG);
    expect(prixMoyenKg(1000, 0)).toBe(PRIX_MIEL_DEFAUT_EUR_KG);
  });
});

describe('rentabiliteRuchers', () => {
  const ruchers = [
    { rucherId: 'A', nom: 'Plaine', nbRuches: 10 },
    { rucherId: 'B', nom: 'Montagne', nbRuches: 5 },
  ];
  const production = [
    { rucherId: 'A', kg: 200 },
    { rucherId: 'B', kg: 50 },
  ];

  it('calcule kg/ruche exact et trie par production décroissante', () => {
    const r = rentabiliteRuchers(ruchers, production, 12, 0);
    expect(r[0]!.rucherId).toBe('A');
    expect(r[0]!.kgParRuche).toBe(20); // 200 / 10
    expect(r[1]!.kgParRuche).toBe(10); // 50 / 5
  });

  it('valorise au prix passé et répartit les coûts au prorata de la production', () => {
    const r = rentabiliteRuchers(ruchers, production, 12, 1000);
    const a = r.find((x) => x.rucherId === 'A')!;
    expect(a.valorisationEur).toBe(2400); // 200 × 12
    expect(a.coutsEur).toBe(800); // 1000 × 200/250
    expect(a.margeEur).toBe(1600); // 2400 − 800
  });

  it('gère un rucher sans production (0 partout, pas de division par zéro)', () => {
    const r = rentabiliteRuchers([{ rucherId: 'Z', nom: 'Vide', nbRuches: 0 }], [], 12, 500);
    expect(r[0]!.productionKg).toBe(0);
    expect(r[0]!.kgParRuche).toBe(0);
    expect(r[0]!.coutsEur).toBe(0);
  });
});

describe('alignerMensuel & comparaisonMensuelle', () => {
  it('replie sur 12 cases et somme les doublons', () => {
    const a = alignerMensuel([
      { mois: 1, valeur: 5 },
      { mois: 1, valeur: 3 },
      { mois: 12, valeur: 10 },
    ]);
    expect(a[0]).toBe(8);
    expect(a[11]).toBe(10);
    expect(a).toHaveLength(12);
  });

  it('produit le delta mensuel N vs N-1', () => {
    const c = comparaisonMensuelle([10, 0], [4, 0]);
    expect(c[0]!.n).toBe(10);
    expect(c[0]!.n1).toBe(4);
    expect(c[0]!.delta).toBe(6);
  });
});

describe('deltaPct', () => {
  it('calcule la variation en %', () => {
    expect(deltaPct(120, 100)).toBe(20);
    expect(deltaPct(80, 100)).toBe(-20);
  });
  it('retourne null sans base de comparaison', () => {
    expect(deltaPct(50, 0)).toBeNull();
    expect(deltaPct(0, 0)).toBe(0);
  });
});

describe('pearson', () => {
  it('vaut +1 pour une relation linéaire croissante', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBe(1);
  });
  it('vaut -1 pour une relation linéaire décroissante', () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBe(-1);
  });
  it('vaut 0 si variance nulle ou échantillon trop petit', () => {
    expect(pearson([5, 5, 5], [1, 2, 3])).toBe(0);
    expect(pearson([1], [1])).toBe(0);
  });
});

describe('indiceFavorabilite', () => {
  it('maximise autour de 24 °C bien ensoleillé', () => {
    const chaud = indiceFavorabilite({ tMax: 24, sunHours: 10 });
    const froid = indiceFavorabilite({ tMax: 5, sunHours: 2 });
    expect(chaud).toBeGreaterThan(froid);
    expect(chaud).toBeGreaterThan(90);
  });
});

describe('correlationMeteoProduction', () => {
  const meteo: MeteoMois[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    tMax: [5, 7, 12, 16, 20, 24, 27, 26, 22, 16, 10, 6][i]!,
    sunHours: [2, 3, 5, 6, 8, 9, 10, 9, 7, 5, 3, 2][i]!,
    precip: 40,
  }));

  it('détecte une corrélation forte quand la production suit les mois favorables', () => {
    // production calée sur l'été (mai→août)
    const prod = [0, 0, 0, 0, 10, 25, 40, 20, 5, 0, 0, 0];
    const r = correlationMeteoProduction(prod, meteo);
    expect(r.coefficient).toBeGreaterThan(0.3);
    expect(['forte', 'modérée']).toContain(r.force);
    expect(r.points).toHaveLength(12);
  });

  it('renvoie un état neutre sans récolte', () => {
    const r = correlationMeteoProduction(new Array(12).fill(0), meteo);
    expect(r.force).toBe('nulle');
    expect(r.insight).toContain('Pas encore assez');
  });
});

describe('tendance', () => {
  it('détecte hausse / baisse / stable', () => {
    expect(tendance([10, 20, 30, 40])).toBe('hausse');
    expect(tendance([40, 30, 20, 10])).toBe('baisse');
    expect(tendance([20, 20, 20, 20])).toBe('stable');
  });
  it('stable si moins de 2 points', () => {
    expect(tendance([5])).toBe('stable');
  });
});

describe('syntheseSaisons', () => {
  const saisons: SaisonAgg[] = [
    { annee: 2023, productionKg: 100, ca: 1200, margeEur: 400 },
    { annee: 2024, productionKg: 60, ca: 800, margeEur: 100 },
    { annee: 2025, productionKg: 140, ca: 1800, margeEur: 700 },
  ];

  it('identifie meilleure et pire saison (par production)', () => {
    const s = syntheseSaisons(saisons);
    expect(s.meilleure?.annee).toBe(2025);
    expect(s.pire?.annee).toBe(2024);
  });
  it('calcule les moyennes', () => {
    const s = syntheseSaisons(saisons);
    expect(s.productionMoyenne).toBe(100);
    expect(s.caMoyen).toBe(1267); // (1200+800+1800)/3
  });
  it('gère une liste vide', () => {
    const s = syntheseSaisons([]);
    expect(s.meilleure).toBeNull();
    expect(s.productionMoyenne).toBe(0);
  });
});

describe('centroide', () => {
  it('calcule le barycentre', () => {
    const c = centroide([
      { lat: 44, lng: 4 },
      { lat: 46, lng: 6 },
    ]);
    expect(c).toEqual({ lat: 45, lng: 5 });
  });
  it('retourne null pour une liste vide', () => {
    expect(centroide([])).toBeNull();
  });
});
