import { describe, it, expect } from 'vitest';
import {
  extraireCibles,
  estCommandeLotEcriture,
  libelleCible,
} from '~~/server/utils/copilote-cibles';

describe('extraireCibles — portée multi-ruches', () => {
  it('reconnaît « toutes mes ruches »', () => {
    expect(extraireCibles('nourris toutes mes ruches avec 2 kg de candi')).toEqual({ mode: 'toutes' });
    expect(extraireCibles('note un controle sur toutes les ruches')).toEqual({ mode: 'toutes' });
  });

  it('reconnaît un rucher nommé collectif', () => {
    expect(extraireCibles('note un controle sur toutes les ruches du rucher Nord')).toEqual({
      mode: 'rucher',
      rucher: 'nord',
    });
    expect(extraireCibles('les ruches du rucher des Tilleuls')).toEqual({
      mode: 'rucher',
      rucher: 'des tilleuls',
    });
  });

  it('reconnaît une liste explicite (≥ 2 numéros)', () => {
    expect(extraireCibles('note un controle sur les ruches 3, 5 et 7')).toEqual({
      mode: 'liste',
      numeros: ['3', '5', '7'],
    });
    expect(extraireCibles('traite les ruches 2 et 4')).toEqual({ mode: 'liste', numeros: ['2', '4'] });
  });

  it('reconnaît une plage', () => {
    expect(extraireCibles('note une visite sur les ruches 1 à 5')).toEqual({
      mode: 'plage',
      de: 1,
      a: 5,
    });
    expect(extraireCibles('de la 3 à la 10 ruches')).toEqual({ mode: 'plage', de: 3, a: 10 });
  });

  it('reconnaît un critère de santé/état', () => {
    expect(extraireCibles('nourris les ruches faibles')).toEqual({
      mode: 'critere',
      critere: 'faible',
    });
    expect(extraireCibles('note un controle sur les ruches en retard')).toEqual({
      mode: 'critere',
      critere: 'retard',
    });
    expect(extraireCibles('traite les ruches touchées par le varroa')).toEqual({
      mode: 'critere',
      critere: 'varroa',
    });
  });

  it('ne laisse PAS un critère voler la portée « toutes » quand le mot est le sujet', () => {
    // Régression : « varroa » est ici le SUJET du traitement, pas un filtre de
    // sélection → la commande doit viser TOUT le cheptel, pas les seules ruches
    // déjà infestées.
    expect(extraireCibles('note un traitement varroa sur toutes mes ruches')).toEqual({
      mode: 'toutes',
    });
    expect(extraireCibles('traite le varroa sur toutes mes ruches')).toEqual({ mode: 'toutes' });
    // « faible » comme observation de force, pas comme critère de sélection.
    expect(extraireCibles('note un controle force faible sur toutes mes ruches')).toEqual({
      mode: 'toutes',
    });
  });

  it('déclenche le critère quand il QUALIFIE bien les ruches', () => {
    expect(extraireCibles('traite les ruches infestées')).toEqual({
      mode: 'critere',
      critere: 'varroa',
    });
    expect(extraireCibles('note un controle sur toutes les ruches à surveiller')).toEqual({
      mode: 'critere',
      critere: 'malade',
    });
  });

  it('ignore une cible mono-ruche (retourne null)', () => {
    expect(extraireCibles('note une visite ruche 3 reine vue')).toBeNull();
    expect(extraireCibles('la ruche 7 va bien')).toBeNull();
    expect(extraireCibles('ajoute un client Jean')).toBeNull();
  });

  it('ne prend pas une simple question pour une cible', () => {
    // « comment vont mes ruches » n'a ni critère ni sélecteur → pas de lot.
    expect(extraireCibles('comment vont mes ruches')).toBeNull();
  });
});

describe('estCommandeLotEcriture — garde d’intention', () => {
  it('accepte un ORDRE d’écriture en lot', () => {
    expect(estCommandeLotEcriture('nourris toutes mes ruches avec 2 kg de candi')).toBe(true);
    expect(
      estCommandeLotEcriture('note un controle force 3 calme sur toutes les ruches du rucher Nord'),
    ).toBe(true);
    expect(estCommandeLotEcriture('traite le varroa sur les ruches 3, 5 et 7')).toBe(true);
  });

  it('refuse une LECTURE ou une question (même avec un sélecteur)', () => {
    expect(estCommandeLotEcriture('montre les ruches faibles')).toBe(false);
    expect(estCommandeLotEcriture('combien de ruches en retard')).toBe(false);
    expect(estCommandeLotEcriture('quelles ruches sont faibles')).toBe(false);
  });

  it('refuse s’il n’y a pas de portée multiple', () => {
    expect(estCommandeLotEcriture('note une intervention')).toBe(false);
    expect(estCommandeLotEcriture('note une visite ruche 3 reine vue')).toBe(false);
  });
});

describe('libelleCible', () => {
  it('produit un libellé lisible par mode', () => {
    expect(libelleCible({ mode: 'toutes' })).toBe('toutes vos ruches');
    expect(libelleCible({ mode: 'rucher', rucher: 'nord' })).toContain('nord');
    expect(libelleCible({ mode: 'liste', numeros: ['3', '5'] })).toBe('les ruches 3, 5');
    expect(libelleCible({ mode: 'plage', de: 1, a: 5 })).toBe('les ruches 1 à 5');
    expect(libelleCible({ mode: 'critere', critere: 'faible' })).toContain('faibles');
  });
});
