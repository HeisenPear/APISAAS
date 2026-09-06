import { describe, expect, it } from 'vitest';
import {
  calculerFenetresRucher,
  trierFenetres,
  joursDepuis,
  type MeteoJourFenetre,
  type RucherFenetreInput,
  type FenetreSuggestion,
} from '../../../../server/utils/maya-fenetres';

// Prévisions type : un jour médiocre, un jour idéal, un jour moyen.
const previsions: MeteoJourFenetre[] = [
  {
    date: '2026-06-15',
    scoreVisite: 30,
    tempMax: 13,
    ventMaxKmh: 30,
    pluieMm: 4,
    conditions: 'Pluie',
  },
  {
    date: '2026-06-16',
    scoreVisite: 90,
    tempMax: 24,
    ventMaxKmh: 8,
    pluieMm: 0,
    conditions: 'Ciel dégagé',
  },
  {
    date: '2026-06-17',
    scoreVisite: 60,
    tempMax: 19,
    ventMaxKmh: 12,
    pluieMm: 0,
    conditions: 'Peu nuageux',
  },
];

function rucher(over: Partial<RucherFenetreInput> = {}): RucherFenetreInput {
  return {
    rucherId: 'r1',
    rucherNom: 'Les Tilleuls',
    derniers: {},
    previsions,
    ...over,
  };
}

const find = (list: FenetreSuggestion[], t: string) => list.find((f) => f.tache === t);

describe('joursDepuis', () => {
  it('compte les jours pleins écoulés', () => {
    expect(joursDepuis('2026-06-01', new Date('2026-06-15T10:00:00'))).toBe(14);
  });
  it('renvoie null sans date', () => {
    expect(joursDepuis(null, new Date('2026-06-15T10:00:00'))).toBeNull();
    expect(joursDepuis(undefined, new Date('2026-06-15T10:00:00'))).toBeNull();
  });
});

describe('calculerFenetresRucher — contrôle (visite)', () => {
  const juin = new Date('2026-06-15T10:00:00'); // mois 6, intervalle 12 j

  it('suggère un contrôle en retard et choisit la meilleure fenêtre météo', () => {
    const f = find(
      calculerFenetresRucher(rucher({ derniers: { controle: '2026-05-10' } }), juin),
      'controle',
    );
    expect(f).toBeTruthy();
    expect(f!.urgence).toBe('haute'); // 36 j > 2×12
    expect(f!.meilleureDate).toBe('2026-06-16'); // meilleur scoreVisite (90)
    expect(f!.scoreMeteo).toBe(90);
    expect(f!.raison).toContain('36 j');
    expect(f!.alerte.type).toBe('fenetre_controle');
    expect(f!.alerte.actionUrl).toContain('rucherId=r1');
  });

  it('ne suggère rien si le contrôle est à jour', () => {
    const f = find(
      calculerFenetresRucher(rucher({ derniers: { controle: '2026-06-10' } }), juin),
      'controle',
    );
    expect(f).toBeUndefined(); // 5 j < 12
  });

  it('suggère un contrôle (haute) si aucun n’a jamais été fait en pleine saison', () => {
    const f = find(calculerFenetresRucher(rucher({ derniers: {} }), juin), 'controle');
    expect(f!.urgence).toBe('haute');
    expect(f!.raison).toContain('Aucun contrôle');
  });

  it('ne suggère pas de visite en hivernage (janvier)', () => {
    const janvier = new Date('2026-01-15T10:00:00');
    const f = find(
      calculerFenetresRucher(rucher({ derniers: { controle: '2025-09-01' } }), janvier),
      'controle',
    );
    expect(f).toBeUndefined();
  });
});

describe('calculerFenetresRucher — récolte', () => {
  it('suggère la récolte en juillet sans récolte récente', () => {
    const juillet = new Date('2026-07-15T10:00:00');
    const f = find(calculerFenetresRucher(rucher({ derniers: {} }), juillet), 'recolte');
    expect(f).toBeTruthy();
    expect(f!.urgence).toBe('haute');
  });
  it('ne suggère pas la récolte hors saison (octobre)', () => {
    const octobre = new Date('2026-10-15T10:00:00');
    const f = find(calculerFenetresRucher(rucher({ derniers: {} }), octobre), 'recolte');
    expect(f).toBeUndefined();
  });
});

describe('calculerFenetresRucher — varroa', () => {
  it('alerte haute pour le traitement post-récolte (août) sans traitement', () => {
    const aout = new Date('2026-08-15T10:00:00');
    const f = find(calculerFenetresRucher(rucher({ derniers: {} }), aout), 'varroa');
    expect(f!.urgence).toBe('haute');
    expect(f!.raison.toLowerCase()).toContain('varroa');
  });
  it('rien si un traitement varroa est récent (août, il y a 20 j)', () => {
    const aout = new Date('2026-08-15T10:00:00');
    const f = find(
      calculerFenetresRucher(rucher({ derniers: { varroa: '2026-07-26' } }), aout),
      'varroa',
    );
    expect(f).toBeUndefined();
  });
});

describe('calculerFenetresRucher — nourrissement', () => {
  it('suggère le nourrissement d’automne (octobre)', () => {
    const octobre = new Date('2026-10-15T10:00:00');
    const f = find(calculerFenetresRucher(rucher({ derniers: {} }), octobre), 'nourrissement');
    expect(f!.urgence).toBe('haute');
  });
});

describe('sans GPS (pas de prévisions)', () => {
  it('suggère quand même, sans date météo', () => {
    const juin = new Date('2026-06-15T10:00:00');
    const f = find(
      calculerFenetresRucher(
        rucher({ derniers: { controle: '2026-04-01' }, previsions: [] }),
        juin,
      ),
      'controle',
    );
    expect(f).toBeTruthy();
    expect(f!.meilleureDate).toBeNull();
    expect(f!.scoreMeteo).toBeNull();
  });
});

describe('trierFenetres', () => {
  it('classe haute avant moyenne avant basse', () => {
    const base = calculerFenetresRucher(
      rucher({ derniers: { controle: '2026-06-10' } }),
      new Date('2026-06-15T10:00:00'),
    );
    const fake: FenetreSuggestion[] = [
      assemblerFake('basse'),
      assemblerFake('haute'),
      assemblerFake('moyenne'),
    ];
    const tri = trierFenetres([...base, ...fake]);
    const urgences = tri.map((f) => f.urgence);
    expect(urgences[0]).toBe('haute');
    expect(urgences[urgences.length - 1]).toBe('basse');
  });
});

function assemblerFake(urgence: 'haute' | 'moyenne' | 'basse'): FenetreSuggestion {
  return {
    rucherId: 'rx',
    rucherNom: 'X',
    tache: 'controle',
    tacheLabel: 'Contrôle',
    icon: 'i-lucide-search',
    urgence,
    raison: 'test',
    meilleureDate: null,
    meilleureDateLabel: null,
    scoreMeteo: null,
    meteoResume: null,
    alerte: {
      type: 'fenetre_controle',
      titre: 't',
      message: 'm',
      priorite: urgence,
      actionUrl: '/x',
    },
  };
}
