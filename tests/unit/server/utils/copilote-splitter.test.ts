import { describe, it, expect } from 'vitest';
import { decouperSequence, estSequenceComposee } from '~~/server/utils/copilote-splitter';

describe('decouperSequence — découpage multi-clauses', () => {
  it('découpe deux actions hétérogènes sur « puis »', () => {
    expect(decouperSequence('ajoute le client Jean puis récolte 25 kg de lavande')).toEqual([
      'ajoute le client Jean',
      'récolte 25 kg de lavande',
    ]);
  });

  it('découpe sur « ensuite »', () => {
    expect(decouperSequence('note un contrôle sur la ruche 3 ensuite pèse la ruche 5')).toEqual([
      'note un contrôle sur la ruche 3',
      'pèse la ruche 5',
    ]);
  });

  it('découpe sur « ; » et gère 3 clauses', () => {
    const r = decouperSequence('ajoute client Marc ; récolte 10 kg acacia ; note une visite ruche 2');
    expect(r).toHaveLength(3);
    expect(r?.[2]).toContain('ruche 2');
  });

  it('NE découpe PAS une observation unique (« reine vue puis couvain »)', () => {
    // « couvain » n'a pas de tête d'action → c'est une seule observation, pas 2 actions.
    expect(decouperSequence('note reine vue puis couvain')).toBeNull();
  });

  it('NE découpe PAS une énumération de propriétés (virgule)', () => {
    expect(decouperSequence('ajoute le client Jean, email jean@mail.fr, tel 0600000000')).toBeNull();
  });

  it('NE découpe PAS une commande mono-action (pas de connecteur)', () => {
    expect(decouperSequence('nourris toutes mes ruches avec 2 kg de candi')).toBeNull();
    expect(decouperSequence('note un contrôle sur la ruche 3')).toBeNull();
  });

  it('rejette si une clause n’a pas de tête d’action', () => {
    // « la ruche 5 » (ellipse sans verbe) → pas une action indépendante.
    expect(decouperSequence('nourris la ruche 3 puis la ruche 5')).toBeNull();
  });

  it('estSequenceComposee reflète decouperSequence', () => {
    expect(estSequenceComposee('note une visite ruche 3 puis pèse la ruche 5')).toBe(true);
    expect(estSequenceComposee('note une visite ruche 3')).toBe(false);
  });
});
