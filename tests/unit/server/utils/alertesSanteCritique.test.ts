import { describe, expect, it } from 'vitest';
import {
  detecterSanteCritique,
  ruchesRetabliesIds,
  SEUIL_SANTE_CRITIQUE,
} from '../../../../server/utils/alertesCore';
import type { RucheSnapshot } from '../../../../server/utils/moteurAlertes/cheptel';

const REF = new Date('2026-06-15T12:00:00Z');

function ruche(partiel: Partial<RucheSnapshot> = {}): RucheSnapshot {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2026-06-10T09:00:00Z', // 5 jours avant REF
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

/** Colonie en très mauvais état : reine absente, plus de couvain, varroa massif. */
function moribonde(partiel: Partial<RucheSnapshot> = {}): RucheSnapshot {
  return ruche({
    qualiteReine: 'absente',
    forceColonie: 1,
    couvain: 0,
    reserves: 1,
    reineVue: false,
    varroa: 8,
    comportement: 'agressive',
    ...partiel,
  });
}

const JAMAIS = () => false;

describe('detecterSanteCritique', () => {
  it('colonie saine → aucune alerte', () => {
    expect(detecterSanteCritique('u1', [ruche()], JAMAIS, REF)).toEqual([]);
  });

  it('colonie moribonde → alerte critique avec le score dans le message', () => {
    const out = detecterSanteCritique('u1', [moribonde()], JAMAIS, REF);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      type: 'sante_critique',
      referenceType: 'ruche',
      referenceId: '11111111-1111-4111-8111-111111111111',
      actionUrl: '/ruches/11111111-1111-4111-8111-111111111111',
    });
    expect(out[0]!.message).toMatch(/Score de santé : \d+\/100/);
  });

  it('sous 20 → priorité critique ; entre 20 et 40 → haute', () => {
    const tresBas = detecterSanteCritique('u1', [moribonde()], JAMAIS, REF);
    expect(tresBas[0]!.priorite).toBe('critique');

    // Colonie fragile mais pas effondrée : score 32, entre les deux seuils.
    const fragile = ruche({
      qualiteReine: 'faible',
      reineVue: false,
      forceColonie: 2,
      couvain: 1,
      reserves: 1,
      varroa: 4,
      comportement: 'nerveuse',
    });
    const out = detecterSanteCritique('u1', [fragile], JAMAIS, REF);
    expect(out).toHaveLength(1);
    expect(out[0]!.priorite).toBe('haute');
  });

  it('ne recrée pas une alerte déjà active pour cette ruche', () => {
    const deja = (type: string, ref?: string) =>
      type === 'sante_critique' && ref === '11111111-1111-4111-8111-111111111111';
    expect(detecterSanteCritique('u1', [moribonde()], deja, REF)).toEqual([]);
  });

  it('une ruche vendue ou fusionnée n’alerte JAMAIS', () => {
    // Son score est `null` (non comptabilisée). Sans garde explicite, le `?? 0`
    // de `computeScore` la ramènerait à 0 et on alerterait sur une ruche qui
    // n'est plus au rucher.
    expect(detecterSanteCritique('u1', [ruche({ statut: 'vendue' })], JAMAIS, REF)).toEqual([]);
    expect(detecterSanteCritique('u1', [ruche({ statut: 'fusionnee' })], JAMAIS, REF)).toEqual([]);
  });

  it('une colonie morte alerte (score 0) — elle est encore au rucher', () => {
    const out = detecterSanteCritique('u1', [ruche({ statut: 'morte' })], JAMAIS, REF);
    expect(out).toHaveLength(1);
    expect(out[0]!.priorite).toBe('critique');
  });

  it('l’instant du run traverse jusqu’à la décote de fraîcheur', () => {
    // Colonie à 41 au moment du contrôle, donc juste au-dessus du seuil. Six
    // mois plus tard, la décote de fraîcheur (−2 pts/semaine au-delà de 30 j,
    // plafonnée à −15) la fait tomber à 26 : l'alerte se déclenche.
    const limite = ruche({
      qualiteReine: 'moyenne',
      reineVue: false,
      forceColonie: 2,
      couvain: 1,
      reserves: 2,
      varroa: 4,
      comportement: 'nerveuse',
    });
    const tot = detecterSanteCritique('u1', [limite], JAMAIS, REF);
    const tard = detecterSanteCritique('u1', [limite], JAMAIS, new Date('2026-12-15T12:00:00Z'));
    expect(tot).toEqual([]);
    expect(tard).toHaveLength(1);
  });
});

describe('ruchesRetabliesIds', () => {
  it('rend les ruches dont le score est remonté au-dessus du seuil', () => {
    const retablies = ruchesRetabliesIds(
      [ruche({ id: 'saine' }), moribonde({ id: 'malade' })],
      REF,
    );
    expect(retablies.has('saine')).toBe(true);
    expect(retablies.has('malade')).toBe(false);
  });

  it('une ruche non comptabilisée compte comme rétablie : son alerte doit se résoudre', () => {
    // Vendue → plus au rucher → l'alerte de santé n'a plus lieu d'être.
    const retablies = ruchesRetabliesIds([ruche({ id: 'vendue', statut: 'vendue' })], REF);
    expect(retablies.has('vendue')).toBe(true);
  });

  it('le seuil de rétablissement est bien celui de l’alerte', () => {
    expect(SEUIL_SANTE_CRITIQUE).toBe(40);
  });
});
