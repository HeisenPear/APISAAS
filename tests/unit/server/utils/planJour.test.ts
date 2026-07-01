import { describe, it, expect } from 'vitest';
import { resumerFeuilleDeRoute } from '~~/server/utils/planJour';

const VIDE = { nbRuchers: 0, nbRuches: 0, nbCritiques: 0 };

describe('resumerFeuilleDeRoute', () => {
  it('est vide quand rien n’est à faire → pas de notif', () => {
    const r = resumerFeuilleDeRoute({ visites: VIDE, rdv: [], nbTraitements: 0 });
    expect(r.estVide).toBe(true);
    expect(r.resume).toBe('');
  });

  it('résume les visites avec accord singulier/pluriel', () => {
    const r = resumerFeuilleDeRoute({
      visites: { nbRuchers: 1, nbRuches: 1, nbCritiques: 0 },
      rdv: [],
      nbTraitements: 0,
    });
    expect(r.estVide).toBe(false);
    expect(r.resume).toBe('1 rucher à visiter (1 ruche)');
    expect(r.priorite).toBe('moyenne');
  });

  it('passe en priorité haute et signale les critiques', () => {
    const r = resumerFeuilleDeRoute({
      visites: { nbRuchers: 3, nbRuches: 12, nbCritiques: 2 },
      rdv: [],
      nbTraitements: 0,
    });
    expect(r.resume).toBe('3 ruchers à visiter (12 ruches, 2 critiques)');
    expect(r.priorite).toBe('haute');
  });

  it('combine visites, un RDV et des traitements', () => {
    const r = resumerFeuilleDeRoute({
      visites: { nbRuchers: 2, nbRuches: 8, nbCritiques: 0 },
      rdv: [{ heure: '14:00', label: 'RDV vétérinaire 14:00' }],
      nbTraitements: 1,
    });
    expect(r.resume).toBe(
      '2 ruchers à visiter (8 ruches) · RDV vétérinaire 14:00 · 1 traitement à clôturer',
    );
    expect(r.priorite).toBe('haute'); // un RDV suffit
  });

  it('agrège plusieurs RDV', () => {
    const r = resumerFeuilleDeRoute({
      visites: VIDE,
      rdv: [
        { heure: '09:00', label: 'RDV client 09:00' },
        { heure: '14:00', label: 'RDV vétérinaire 14:00' },
      ],
      nbTraitements: 0,
    });
    expect(r.resume).toBe('2 rendez-vous');
    expect(r.estVide).toBe(false);
  });
});
