import { describe, expect, it } from 'vitest';
import { detecterVisites } from '../../../../server/utils/alertesCore';
import type { RucheSnapshot } from '../../../../server/utils/moteurAlertes/cheptel';

// Règle PURE : le cheptel est fourni, l'instant du run aussi. C'est ce qui rend
// « visite requise » — le type d'alerte le plus fréquent du produit — enfin
// testable, alors qu'il faisait sa propre requête et lisait `new Date()`.

const AVRIL = new Date('2026-04-15T12:00:00Z'); // printemps → seuil 10 j
const OCTOBRE = new Date('2026-10-15T12:00:00Z'); // automne → seuil 21 j

function ruche(partiel: Partial<RucheSnapshot> = {}): RucheSnapshot {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2026-04-03T09:00:00Z', // 12 jours avant AVRIL
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

const JAMAIS = () => false;

describe('detecterVisites — retard de visite', () => {
  it('applique la cadence SAISONNIÈRE, pas un délai fixe', () => {
    // Même ruche, même retard de 12 jours : en retard au printemps (seuil 10 j),
    // à l'heure en automne (seuil 21 j).
    const auPrintemps = detecterVisites('u1', [ruche()], JAMAIS, AVRIL);
    expect(auPrintemps.map((a) => a.type)).toEqual(['visite_requise']);

    const enAutomne = detecterVisites(
      'u1',
      [ruche({ dateVisite: '2026-10-03T09:00:00Z' })],
      JAMAIS,
      OCTOBRE,
    );
    expect(enAutomne).toEqual([]);
  });

  it('compte les jours depuis l’instant du run, pas depuis l’horloge réelle', () => {
    const out = detecterVisites('u1', [ruche()], JAMAIS, AVRIL);
    expect(out[0]!.message).toContain('12 jours');
    expect(out[0]!.message).toContain('seuil de saison : 10 j');
  });

  it('au-delà de 45 jours de retard, la priorité passe en haute', () => {
    const vieille = ruche({ dateVisite: '2026-02-01T09:00:00Z' }); // 73 j avant AVRIL
    expect(detecterVisites('u1', [vieille], JAMAIS, AVRIL)[0]!.priorite).toBe('haute');
    expect(detecterVisites('u1', [ruche()], JAMAIS, AVRIL)[0]!.priorite).toBe('moyenne');
  });

  it('une alerte PAR ruche en retard : l’action est individuelle', () => {
    const out = detecterVisites(
      'u1',
      [ruche({ id: 'r-1', numero: 'R-01' }), ruche({ id: 'r-2', numero: 'R-02' })],
      JAMAIS,
      AVRIL,
    );
    expect(out).toHaveLength(2);
    expect(out.map((a) => a.referenceId)).toEqual(['r-1', 'r-2']);
  });

  it('ne recrée pas une alerte déjà active pour CETTE ruche', () => {
    const dejaR1 = (type: string, ref?: string) => type === 'visite_requise' && ref === 'r-1';
    const out = detecterVisites('u1', [ruche({ id: 'r-1' }), ruche({ id: 'r-2' })], dejaR1, AVRIL);
    expect(out.map((a) => a.referenceId)).toEqual(['r-2']);
  });
});

describe('detecterVisites — première visite', () => {
  it('N ruches jamais visitées → UNE seule alerte groupée', () => {
    const jamais = [
      ruche({ id: 'r-1', dateVisite: null }),
      ruche({ id: 'r-2', dateVisite: null }),
      ruche({ id: 'r-3', dateVisite: null }),
    ];
    const out = detecterVisites('u1', jamais, JAMAIS, AVRIL);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ type: 'premiere_visite', priorite: 'basse' });
    expect(out[0]!.titre).toBe('3 ruches attendent leur première visite');
  });

  it('une seule ruche → titre au singulier', () => {
    const out = detecterVisites('u1', [ruche({ dateVisite: null })], JAMAIS, AVRIL);
    expect(out[0]!.titre).toBe('Une ruche attend sa première visite');
  });

  it('l’alerte groupée n’est pas recréée si elle est déjà active', () => {
    const deja = (type: string) => type === 'premiere_visite';
    expect(detecterVisites('u1', [ruche({ dateVisite: null })], deja, AVRIL)).toEqual([]);
  });

  it('cheptel vide → rien (on ne sollicite pas un compte sans ruche)', () => {
    expect(detecterVisites('u1', [], JAMAIS, AVRIL)).toEqual([]);
  });
});
