import { describe, expect, it } from 'vitest';
import { resolutionsSaison } from '~~/server/utils/alertesSaison';
import { resolutionsMeteo } from '~~/server/utils/alertesMeteo';
import { resoudreSanteCritique } from '~~/server/utils/moteurAlertes/resolution';
import type { RucheSnapshot } from '~~/server/utils/moteurAlertes/cheptel';
import type { AlerteActive, ContexteResolution } from '~~/server/utils/moteurAlertes/types';

// Les trois résolveurs PURS du moteur. Les autres interrogent la base et ne
// sont donc pas couverts ici — `db` est un auto-import Nitro indisponible sous
// Vitest, c'est précisément pourquoi on pousse la décision hors de l'I/O.

function ctx(partiel: Partial<ContexteResolution> = {}): ContexteResolution {
  return {
    userId: 'u1',
    maintenant: new Date('2026-08-10T12:00:00Z'),
    existantes: [],
    cheptel: [],
    ...partiel,
  };
}

function alerte(partiel: Partial<AlerteActive> = {}): AlerteActive {
  return { id: 'a1', type: 'rappel_saison', referenceId: null, ...partiel };
}

function ruche(partiel: Partial<RucheSnapshot> = {}): RucheSnapshot {
  return {
    id: 'r1',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2026-08-08T09:00:00Z',
    forceColonie: 4,
    couvain: 4,
    reserves: 4,
    reineVue: true,
    varroa: 1,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
    ...partiel,
  };
}

describe('resolutionsSaison', () => {
  it('conserve un rappel dont la fenêtre est encore ouverte', () => {
    // Le 10 août, la fenêtre « traitement varroa » (1er août → 15 septembre)
    // est active.
    const existantes = [alerte({ id: 'a1', referenceId: 'traitement-varroa-2026' })];
    expect(resolutionsSaison(ctx({ existantes }))).toEqual([]);
  });

  it('résout un rappel dont la fenêtre est passée', () => {
    const existantes = [alerte({ id: 'a1', referenceId: 'visite-printemps-2026' })];
    expect(resolutionsSaison(ctx({ existantes }))).toEqual(['a1']);
  });

  it('résout une clé orpheline (référence perdue)', () => {
    const existantes = [alerte({ id: 'a1', referenceId: null })];
    expect(resolutionsSaison(ctx({ existantes }))).toEqual(['a1']);
  });

  it('ne touche à aucun autre type', () => {
    const existantes = [
      alerte({ id: 'a1', type: 'visite_requise', referenceId: 'r1' }),
      alerte({ id: 'a2', type: 'meteo_danger' }),
    ];
    expect(resolutionsSaison(ctx({ existantes }))).toEqual([]);
  });
});

describe('resolutionsMeteo', () => {
  it('résout TOUTES les alertes météo — elles sont régénérées dans le même run', () => {
    const existantes = [
      alerte({ id: 'a1', type: 'meteo_danger' }),
      alerte({ id: 'a2', type: 'meteo_favorable' }),
    ];
    expect(resolutionsMeteo(ctx({ existantes })).sort()).toEqual(['a1', 'a2']);
  });

  it('ne touche à aucun autre type', () => {
    const existantes = [
      alerte({ id: 'a1', type: 'meteo_danger' }),
      alerte({ id: 'a2', type: 'sante_critique', referenceId: 'r1' }),
      alerte({ id: 'a3', type: 'rappel_saison', referenceId: 'traitement-varroa-2026' }),
    ];
    expect(resolutionsMeteo(ctx({ existantes }))).toEqual(['a1']);
  });

  it('aucune alerte active → rien à résoudre', () => {
    expect(resolutionsMeteo(ctx())).toEqual([]);
  });
});

describe('resoudreSanteCritique', () => {
  it('résout l’alerte d’une colonie dont le score est remonté', () => {
    // Ce type n'était résolu NULLE PART : l'alerte survivait à la guérison et
    // bloquait, par anti-doublon, toute rechute ultérieure.
    const existantes = [alerte({ id: 'a1', type: 'sante_critique', referenceId: 'r1' })];
    expect(resoudreSanteCritique(ctx({ existantes, cheptel: [ruche({ id: 'r1' })] }))).toEqual([
      'a1',
    ]);
  });

  it('conserve l’alerte tant que la colonie va mal', () => {
    const malade = ruche({
      id: 'r1',
      qualiteReine: 'absente',
      forceColonie: 1,
      couvain: 0,
      reserves: 1,
      reineVue: false,
      varroa: 8,
      comportement: 'agressive',
    });
    const existantes = [alerte({ id: 'a1', type: 'sante_critique', referenceId: 'r1' })];
    expect(resoudreSanteCritique(ctx({ existantes, cheptel: [malade] }))).toEqual([]);
  });

  it('résout l’alerte d’une ruche qui n’est plus dans le cheptel', () => {
    // Vendue, supprimée, désactivée : plus de ruche, plus d'alerte de santé.
    const existantes = [alerte({ id: 'a1', type: 'sante_critique', referenceId: 'disparue' })];
    expect(resoudreSanteCritique(ctx({ existantes, cheptel: [ruche({ id: 'r1' })] }))).toEqual([
      'a1',
    ]);
  });

  it('aucune alerte de santé active → aucune requête, aucun id', () => {
    const existantes = [alerte({ id: 'a1', type: 'visite_requise', referenceId: 'r1' })];
    expect(resoudreSanteCritique(ctx({ existantes, cheptel: [ruche()] }))).toEqual([]);
  });
});
