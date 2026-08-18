import { describe, expect, it } from 'vitest';
import {
  agregerDangers,
  deciderAlertesMeteo,
  dedupliquerCoordonnees,
  evaluerPrevision,
  extraireJourDemain,
  urlPrevisionDemain,
  type JourMeteoBrut,
  type PrevisionDemain,
} from '../../../../server/utils/alertesMeteo';

// La décision météo est PURE : ces tests l'exercent sans réseau ni base. Seul
// le fetch Open-Meteo reste non couvert, et il est injectable.

function jour(partiel: Partial<JourMeteoBrut> = {}): JourMeteoBrut {
  return { tempMin: 12, tempMax: 22, code: 0, pluieMm: 0, ventKmh: 8, rafaleKmh: 15, ...partiel };
}

function prev(partiel: Partial<PrevisionDemain> = {}): PrevisionDemain {
  return {
    gel: false,
    orage: false,
    vent: false,
    canicule: false,
    favorable: false,
    tempMin: 12,
    tempMax: 22,
    ...partiel,
  };
}

const JAMAIS = () => false;

describe('urlPrevisionDemain', () => {
  it('demande 2 jours en fuseau Paris et des vents en km/h', () => {
    const url = urlPrevisionDemain(44.83, -0.57);
    expect(url).toContain('latitude=44.83');
    expect(url).toContain('longitude=-0.57');
    expect(url).toContain('forecast_days=2'); // aujourd'hui + demain
    expect(url).toContain('timezone=Europe%2FParis');
    expect(url).toContain('wind_speed_unit=kmh');
  });
});

describe('extraireJourDemain', () => {
  const reponse = {
    daily: {
      temperature_2m_max: [18, 26],
      temperature_2m_min: [8, 14],
      weathercode: [1, 95],
      precipitation_sum: [0, 4],
      windspeed_10m_max: [10, 30],
      windgusts_10m_max: [20, 55],
    },
  };

  it('lit DEMAIN (index 1), pas aujourd’hui', () => {
    expect(extraireJourDemain(reponse)).toEqual({
      tempMax: 26,
      tempMin: 14,
      code: 95,
      pluieMm: 4,
      ventKmh: 30,
      rafaleKmh: 55,
    });
  });

  it('null si la température de demain manque — le reste ne suffit pas', () => {
    expect(extraireJourDemain({ daily: { temperature_2m_max: [18] } })).toBeNull();
    expect(extraireJourDemain({ daily: {} })).toBeNull();
    expect(extraireJourDemain({})).toBeNull();
    expect(extraireJourDemain(null)).toBeNull();
  });

  it('les champs secondaires absents retombent sur 0', () => {
    const j = extraireJourDemain({ daily: { temperature_2m_max: [18, 26] } });
    expect(j).toEqual({
      tempMax: 26,
      tempMin: 0,
      code: 0,
      pluieMm: 0,
      ventKmh: 0,
      rafaleKmh: 0,
    });
  });
});

describe('evaluerPrevision', () => {
  it('gel au seuil de 3 °C, pas à 4', () => {
    expect(evaluerPrevision(jour({ tempMin: 3 })).gel).toBe(true);
    expect(evaluerPrevision(jour({ tempMin: 4 })).gel).toBe(false);
  });

  it('canicule à 35 °C, orage au code 95, vent aux rafales de 40 km/h', () => {
    expect(evaluerPrevision(jour({ tempMax: 35 })).canicule).toBe(true);
    expect(evaluerPrevision(jour({ code: 95 })).orage).toBe(true);
    expect(evaluerPrevision(jour({ rafaleKmh: 40 })).vent).toBe(true);
  });

  it('journée douce, calme et sèche → favorable', () => {
    expect(
      evaluerPrevision(jour({ tempMax: 22, pluieMm: 0, ventKmh: 10, code: 0 })).favorable,
    ).toBe(true);
  });

  it('la moindre pluie disqualifie le créneau favorable', () => {
    expect(evaluerPrevision(jour({ pluieMm: 0.2 })).favorable).toBe(false);
  });

  it('arrondit les températures affichées', () => {
    const p = evaluerPrevision(jour({ tempMin: 11.6, tempMax: 22.4 }));
    expect(p.tempMin).toBe(12);
    expect(p.tempMax).toBe(22);
  });
});

describe('dedupliquerCoordonnees', () => {
  it('deux ruchers à quelques centaines de mètres ne font qu’une requête', () => {
    const out = dedupliquerCoordonnees([
      { latitude: 44.837, longitude: -0.579 },
      { latitude: 44.838, longitude: -0.5791 },
    ]);
    expect(out).toHaveLength(1);
  });

  it('ignore les coordonnées illisibles plutôt que d’interroger sur NaN', () => {
    // `null` et `''` méritent une mention : `Number()` les convertit en 0, donc
    // un rucher sans latitude serait devenu un point au large de l'Afrique.
    const out = dedupliquerCoordonnees([
      { latitude: null, longitude: -0.57 },
      { latitude: '', longitude: -0.57 },
      { latitude: undefined, longitude: -0.57 },
      { latitude: 'abc', longitude: -0.57 },
      { latitude: 44.83, longitude: null },
      { latitude: 44.83, longitude: -0.57 },
    ]);
    expect(out).toEqual([{ lat: 44.83, lon: -0.57 }]);
  });

  it('plafonne le nombre de requêtes', () => {
    const lieux = Array.from({ length: 30 }, (_, i) => ({ latitude: 40 + i, longitude: 2 }));
    expect(dedupliquerCoordonnees(lieux, 20)).toHaveLength(20);
  });

  it('accepte des coordonnées en chaîne (colonnes decimal de Drizzle)', () => {
    expect(dedupliquerCoordonnees([{ latitude: '44.83', longitude: '-0.57' }])).toEqual([
      { lat: 44.83, lon: -0.57 },
    ]);
  });
});

describe('agregerDangers', () => {
  it('un seul rucher concerné suffit (agrégation OU)', () => {
    expect(agregerDangers([prev(), prev({ orage: true }), prev()])).toEqual(['orage']);
  });

  it('ordre stable quel que soit l’ordre des ruchers', () => {
    const attendu = ['gel', 'canicule', 'orage', 'vent fort'];
    expect(
      agregerDangers([
        prev({ vent: true }),
        prev({ gel: true }),
        prev({ canicule: true }),
        prev({ orage: true }),
      ]),
    ).toEqual(attendu);
  });

  it('aucun danger → tableau vide', () => {
    expect(agregerDangers([prev(), prev()])).toEqual([]);
  });
});

describe('deciderAlertesMeteo', () => {
  it('danger prévu → une alerte meteo_danger de priorité haute', () => {
    const out = deciderAlertesMeteo('u1', [prev({ gel: true })], JAMAIS);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      userId: 'u1',
      type: 'meteo_danger',
      priorite: 'haute',
      referenceType: 'meteo',
      actionUrl: '/meteo',
    });
    expect(out[0]!.titre).toContain('gel');
  });

  it('on ne pousse JAMAIS à visiter quand un danger est prévu', () => {
    // Un rucher au beau fixe, un autre sous l'orage : le danger l'emporte.
    const out = deciderAlertesMeteo(
      'u1',
      [prev({ favorable: true }), prev({ orage: true })],
      JAMAIS,
    );
    expect(out.map((a) => a.type)).toEqual(['meteo_danger']);
  });

  it('aucun danger et au moins un créneau favorable → meteo_favorable en priorité basse', () => {
    const out = deciderAlertesMeteo('u1', [prev({ favorable: true })], JAMAIS);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ type: 'meteo_favorable', priorite: 'basse' });
  });

  it('ni danger ni créneau favorable → rien à dire', () => {
    expect(deciderAlertesMeteo('u1', [prev()], JAMAIS)).toEqual([]);
  });

  it('aucune prévision exploitable → aucune alerte', () => {
    expect(deciderAlertesMeteo('u1', [], JAMAIS)).toEqual([]);
  });

  it('respecte la déduplication (alerte déjà active)', () => {
    const dejaDanger = (type: string) => type === 'meteo_danger';
    expect(deciderAlertesMeteo('u1', [prev({ gel: true })], dejaDanger)).toEqual([]);

    const dejaFavorable = (type: string) => type === 'meteo_favorable';
    expect(deciderAlertesMeteo('u1', [prev({ favorable: true })], dejaFavorable)).toEqual([]);
  });
});
