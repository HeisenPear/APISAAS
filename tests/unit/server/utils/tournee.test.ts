import { describe, it, expect } from 'vitest';
import {
  haversineKm,
  urgence,
  agregerArrets,
  ordonnerTournee,
  distanceTotaleKm,
  lienMaps,
  type RucheEtat,
  type ArretGeo,
} from '../../../../server/utils/tournee';

const ruche = (over: Partial<RucheEtat> & Pick<RucheEtat, 'rucherId'>): RucheEtat => ({
  nom: 'R',
  commune: null,
  lat: 48,
  lng: 2,
  score: 80,
  enRetard: false,
  ...over,
});

describe('haversineKm', () => {
  it('renvoie ~0 pour le même point', () => {
    expect(haversineKm({ lat: 48.85, lng: 2.35 }, { lat: 48.85, lng: 2.35 })).toBeCloseTo(0, 5);
  });

  it('Paris → Lyon ≈ 392 km', () => {
    const d = haversineKm({ lat: 48.8566, lng: 2.3522 }, { lat: 45.764, lng: 4.8357 });
    expect(d).toBeGreaterThan(385);
    expect(d).toBeLessThan(400);
  });
});

describe('urgence', () => {
  it('une santé critique pèse plus qu’un retard', () => {
    expect(urgence({ nbCritiques: 1, nbEnRetard: 0 })).toBeGreaterThan(
      urgence({ nbCritiques: 0, nbEnRetard: 9 }),
    );
  });
});

describe('agregerArrets', () => {
  it('ne garde que les ruchers à visiter et compte retards + critiques', () => {
    const { arrets, nbRuchesAVisiter } = agregerArrets([
      ruche({ rucherId: 'A', enRetard: true }),
      ruche({ rucherId: 'A', score: 20 }), // critique
      ruche({ rucherId: 'A', score: 90 }), // OK → ignorée
      ruche({ rucherId: 'B', score: 95 }), // tout va bien → rucher exclu
    ]);
    expect(arrets).toHaveLength(1);
    expect(arrets[0]!.rucherId).toBe('A');
    expect(arrets[0]!.nbEnRetard).toBe(1);
    expect(arrets[0]!.nbCritiques).toBe(1);
    expect(nbRuchesAVisiter).toBe(2);
  });

  it('ne double-compte pas une ruche à la fois en retard ET critique', () => {
    const { nbRuchesAVisiter } = agregerArrets([
      ruche({ rucherId: 'A', enRetard: true, score: 10 }),
    ]);
    expect(nbRuchesAVisiter).toBe(1);
  });
});

describe('ordonnerTournee', () => {
  const a = (id: string, lat: number, lng: number, over = {}): ArretGeo => ({
    rucherId: id,
    nom: id,
    commune: null,
    lat,
    lng,
    nbEnRetard: 0,
    nbCritiques: 0,
    ...over,
  });

  it('démarre sur le plus urgent puis suit le plus proche voisin', () => {
    // Géométrie : urgent au milieu, voisins à gauche/droite.
    const route = ordonnerTournee([
      a('gauche', 48.0, 2.0),
      a('urgent', 48.0, 2.1, { nbCritiques: 2 }),
      a('droite', 48.0, 2.2),
    ]);
    expect(route.map((r) => r.rucherId)).toEqual(['urgent', 'gauche', 'droite']);
    expect(route[0]!.ordre).toBe(1);
    expect(route[0]!.distanceKm).toBe(0);
    // gauche est plus proche de urgent que droite ne l'est de gauche
    expect(route[1]!.distanceKm).toBeGreaterThan(0);
  });

  it('renvoie [] sur une liste vide', () => {
    expect(ordonnerTournee([])).toEqual([]);
  });
});

describe('distanceTotaleKm & lienMaps', () => {
  it('somme les distances par étape', () => {
    const route = ordonnerTournee([
      {
        rucherId: 'A',
        nom: 'A',
        commune: null,
        lat: 48.0,
        lng: 2.0,
        nbEnRetard: 1,
        nbCritiques: 0,
      },
      {
        rucherId: 'B',
        nom: 'B',
        commune: null,
        lat: 48.5,
        lng: 2.0,
        nbEnRetard: 1,
        nbCritiques: 0,
      },
    ]);
    expect(distanceTotaleKm(route)).toBeCloseTo(route[1]!.distanceKm, 5);
  });

  it('construit un lien Google Maps multi-étapes', () => {
    const url = lienMaps([
      { lat: 48, lng: 2 },
      { lat: 49, lng: 3 },
    ]);
    expect(url).toBe('https://www.google.com/maps/dir/48,2/49,3');
  });

  it('renvoie null si aucune étape', () => {
    expect(lienMaps([])).toBeNull();
  });
});
