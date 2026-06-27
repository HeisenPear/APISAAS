import { describe, it, expect } from 'vitest';
import {
  scoreFiabilite,
  statutCommunautaire,
  deltaReputation,
  trouverDoublon,
  SEUIL_CONFIRME,
} from '~/utils/frelonFiabilite';

describe('scoreFiabilite', () => {
  const zero = { confirmations: 0, infirmations: 0, destructions: 0 };

  it('part de ~50 pour un auteur neutre sans vote ni âge', () => {
    expect(scoreFiabilite(zero, 0, 0)).toBe(50);
  });

  it('monte avec les confirmations', () => {
    expect(scoreFiabilite({ ...zero, confirmations: 3 }, 0, 0)).toBeGreaterThan(50);
  });

  it('une infirmation pèse plus qu’une confirmation (asymétrie anti-faux)', () => {
    const conf = scoreFiabilite({ ...zero, confirmations: 1 }, 0, 0);
    const inf = scoreFiabilite({ ...zero, infirmations: 1 }, 0, 0);
    expect(50 - inf).toBeGreaterThan(conf - 50);
  });

  it('s’érode avec le temps tant que non confirmé', () => {
    const frais = scoreFiabilite(zero, 0, 0);
    const vieux = scoreFiabilite(zero, 0, 75);
    expect(vieux).toBeLessThan(frais);
  });

  it('la réputation de l’auteur déplace la base', () => {
    expect(scoreFiabilite(zero, 30, 0)).toBeGreaterThan(scoreFiabilite(zero, -30, 0));
  });
});

describe('statutCommunautaire', () => {
  it('confirme avec assez de confirmations nettes de comptes distincts', () => {
    expect(
      statutCommunautaire({ confirmations: SEUIL_CONFIRME, infirmations: 0, destructions: 0 }),
    ).toBe('confirme');
  });
  it('rejette quand les infirmations dominent', () => {
    expect(statutCommunautaire({ confirmations: 0, infirmations: 2, destructions: 0 })).toBe(
      'rejete',
    );
  });
  it('détruit prime sur tout', () => {
    expect(statutCommunautaire({ confirmations: 5, infirmations: 0, destructions: 2 })).toBe(
      'detruit',
    );
  });
  it('reste à vérifier sans consensus', () => {
    expect(statutCommunautaire({ confirmations: 1, infirmations: 0, destructions: 0 })).toBe(
      'a_verifier',
    );
  });
});

describe('deltaReputation', () => {
  it('+ quand un signalement devient confirmé, - quand rejeté', () => {
    expect(deltaReputation('a_verifier', 'confirme')).toBeGreaterThan(0);
    expect(deltaReputation('a_verifier', 'rejete')).toBeLessThan(0);
  });
  it('nul si le statut ne change pas', () => {
    expect(deltaReputation('confirme', 'confirme')).toBe(0);
  });
});

describe('trouverDoublon', () => {
  it('repère un signalement à moins de 150 m (même nid)', () => {
    const id = trouverDoublon({ lat: 45, lng: 5 }, [{ id: 'a', lat: 45.0005, lng: 5.0005 }]); // ~65 m
    expect(id).toBe('a');
  });
  it('ne dédoublonne pas au-delà du rayon', () => {
    expect(trouverDoublon({ lat: 45, lng: 5 }, [{ id: 'a', lat: 45.01, lng: 5.01 }])).toBeNull();
  });
});
