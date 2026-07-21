import { describe, it, expect } from 'vitest';
import { construireGenealogie, type ReineNoeud } from '../../../../server/utils/genealogieReines';

function reine(overrides: Partial<ReineNoeud> & { id: string }): ReineNoeud {
  return {
    identifiant: null,
    couleurMarquage: null,
    anneeNaissance: null,
    estActive: true,
    ligneeNom: null,
    reineMereId: null,
    ...overrides,
  };
}

describe('construireGenealogie', () => {
  it('retourne un seul niveau (0) quand la reine est seule', () => {
    const reines = [reine({ id: 'a' })];
    const gen = construireGenealogie(reines, 'a');
    expect(gen).toEqual([{ niveau: 0, reines: [reines[0]] }]);
  });

  it('retourne un tableau vide si la reine cible est introuvable', () => {
    expect(construireGenealogie([reine({ id: 'a' })], 'inconnue')).toEqual([]);
  });

  it('remonte la chaîne des ancêtres (mère, grand-mère)', () => {
    const grandMere = reine({ id: 'gm' });
    const mere = reine({ id: 'm', reineMereId: 'gm' });
    const fille = reine({ id: 'f', reineMereId: 'm' });
    const gen = construireGenealogie([grandMere, mere, fille], 'f');

    expect(gen.map((g) => g.niveau)).toEqual([-2, -1, 0]);
    expect(gen[0]!.reines[0]!.id).toBe('gm');
    expect(gen[1]!.reines[0]!.id).toBe('m');
    expect(gen[2]!.reines[0]!.id).toBe('f');
  });

  it('descend vers plusieurs filles et petites-filles (parcours en largeur)', () => {
    const mere = reine({ id: 'm' });
    const filleA = reine({ id: 'fa', reineMereId: 'm' });
    const filleB = reine({ id: 'fb', reineMereId: 'm' });
    const petiteFille = reine({ id: 'pf', reineMereId: 'fa' });
    const gen = construireGenealogie([mere, filleA, filleB, petiteFille], 'm');

    expect(gen.map((g) => g.niveau)).toEqual([0, 1, 2]);
    expect(gen[1]!.reines.map((r) => r.id).sort()).toEqual(['fa', 'fb']);
    expect(gen[2]!.reines.map((r) => r.id)).toEqual(['pf']);
  });

  it("ne boucle pas à l'infini si les données forment un cycle (garde-fou)", () => {
    // Cycle corrompu : a est mère de b, b est mère de a.
    const a = reine({ id: 'a', reineMereId: 'b' });
    const b = reine({ id: 'b', reineMereId: 'a' });
    const gen = construireGenealogie([a, b], 'a');
    expect(gen.length).toBeGreaterThan(0);
    expect(gen.length).toBeLessThan(20);
  });

  it('un ancêtre ou descendant absent de la liste stoppe la remontée/descente proprement', () => {
    // reineMereId pointe vers un id non présent dans la liste transmise.
    const orpheline = reine({ id: 'o', reineMereId: 'fantome' });
    const gen = construireGenealogie([orpheline], 'o');
    expect(gen).toEqual([{ niveau: 0, reines: [orpheline] }]);
  });
});
