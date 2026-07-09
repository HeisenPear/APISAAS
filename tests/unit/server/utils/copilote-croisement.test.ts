import { describe, it, expect } from 'vitest';
import { croisementPour } from '~~/server/utils/copilote-local';

describe('croisementPour — mapping fiche → thème de croisement (« chez toi »)', () => {
  it('associe les fiches varroa', () => {
    expect(croisementPour('traitement-varroa')).toBe('varroa');
    expect(croisementPour('varroa-bio')).toBe('varroa');
    expect(croisementPour('compter-varroa')).toBe('varroa');
  });

  it('associe les fiches sanitaires', () => {
    expect(croisementPour('loques')).toBe('maladie');
    expect(croisementPour('nosemose')).toBe('maladie');
  });

  it('associe les fiches de visite et de récolte', () => {
    expect(croisementPour('visite-printemps')).toBe('visite');
    expect(croisementPour('calendrier-apicole')).toBe('visite');
    expect(croisementPour('quand-recolter')).toBe('recolte');
    expect(croisementPour('combien-miel')).toBe('recolte');
  });

  it('renvoie null pour une fiche non croisée', () => {
    expect(croisementPour('abeilles-generalites')).toBeNull();
    expect(croisementPour('races-abeilles')).toBeNull();
    expect(croisementPour('inconnue')).toBeNull();
  });
});
