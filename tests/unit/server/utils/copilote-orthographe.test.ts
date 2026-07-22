import { describe, it, expect } from 'vitest';
import { corrigerToken, corrigerTexte } from '../../../../server/utils/copilote-orthographe';
import { SAVOIR } from '../../../../server/utils/copilote-savoir';

describe('corrigerToken — mots légitimes JAMAIS altérés', () => {
  it('ne touche aucun mot-clé du savoir (tous dans le lexique)', () => {
    for (const art of SAVOIR) {
      for (const cle of art.motsCles) {
        for (const mot of cle.split(/\s+/)) {
          if (mot.length >= 5 && /^[a-z]+$/.test(mot)) {
            expect(corrigerToken(mot), `mot-clé altéré : ${mot}`).toBe(mot);
          }
        }
      }
    }
  });

  it('laisse intacts des mots apicoles corrects', () => {
    for (const m of [
      'varroa',
      'oxalique',
      'essaimage',
      'rucher',
      'controle',
      'hivernage',
      'apivar',
      'nourrissement',
    ]) {
      expect(corrigerToken(m)).toBe(m);
    }
  });

  it('ne corrige pas des mots courants hors périmètre (zéro fausse correction)', () => {
    for (const m of [
      'bonjour',
      'comment',
      'pourquoi',
      'capitale',
      'perou',
      'azerty',
      'quelle',
      'ordinateur',
    ]) {
      expect(corrigerToken(m), `fausse correction sur : ${m}`).toBe(m);
    }
  });

  it('laisse les nombres et mots courts intacts', () => {
    expect(corrigerToken('3')).toBe('3');
    expect(corrigerToken('r12')).toBe('r12');
    expect(corrigerToken('miel')).toBe('miel'); // < 5 lettres
    expect(corrigerToken('2024')).toBe('2024');
  });
});

describe('corrigerToken — fautes rattrapées', () => {
  it('faute d’une lettre (distance ≤ 1)', () => {
    expect(corrigerToken('varoa')).toBe('varroa');
    expect(corrigerToken('apivare')).toBe('apivar');
    expect(corrigerToken('essaimmage')).toBe('essaimage');
  });

  it('faute qui préserve le son (phonétique)', () => {
    expect(corrigerToken('oksalique')).toBe('oxalique');
    expect(corrigerToken('amitrase')).toBe('amitraze');
  });
});

describe('corrigerTexte — sur chaîne normalisée', () => {
  it('corrige mot à mot, préserve nombres et structure', () => {
    expect(corrigerTexte('preconise apivar ou oksalique')).toBe('preconise apivar ou oxalique');
    expect(corrigerTexte('traiter le varoa sur 3 ruches')).toBe('traiter le varroa sur 3 ruches');
  });

  it('est idempotent', () => {
    const une = corrigerTexte('traite le varoa');
    expect(corrigerTexte(une)).toBe(une);
  });

  it('laisse une phrase déjà correcte inchangée', () => {
    const ok = 'comment traiter le varroa en hiver';
    expect(corrigerTexte(ok)).toBe(ok);
  });
});
