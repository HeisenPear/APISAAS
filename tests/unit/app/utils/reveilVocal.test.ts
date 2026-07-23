import { describe, expect, it } from 'vitest';
import { analyserReveil } from '../../../../app/utils/reveilVocal';

// ═══════════════════════════════════════════════════════════════════════════
// Réveil vocal « Salut Maya » — cœur PUR (le lecteur live, lui, n'est pas
// testable hors navigateur). On verrouille ici l'essentiel : ça réveille quand
// il faut, ça n'invente pas de réveil, et ça extrait la bonne commande.
// ═══════════════════════════════════════════════════════════════════════════

describe('analyserReveil — déclenche au bon moment', () => {
  it('réveille sur « salut maya »', () => {
    expect(analyserReveil('salut maya').reveil).toBe(true);
  });

  it('réveille sur le nom en tête de phrase', () => {
    expect(analyserReveil('maya comment vont mes ruches').reveil).toBe(true);
  });

  it.each([
    'ok maya',
    'coucou maya',
    'hey maya',
    'bonjour maya',
    'dis maya',
    'salut maïa', // l'ASR écrit souvent « maïa »
    'ok maja',
  ])('réveille sur « %s »', (phrase) => {
    expect(analyserReveil(phrase).reveil).toBe(true);
  });
});

describe('analyserReveil — n’invente pas de réveil', () => {
  it('ne réveille PAS sur un « maya » noyé au milieu', () => {
    expect(analyserReveil('je pense que maya se trompe').reveil).toBe(false);
  });

  it('ne réveille PAS sans le nom', () => {
    expect(analyserReveil('salut tout le monde').reveil).toBe(false);
  });

  it('ne réveille PAS sur une chaîne vide', () => {
    expect(analyserReveil('').reveil).toBe(false);
  });
});

describe('analyserReveil — extrait la commande qui suit', () => {
  it('rend la commande après le réveil', () => {
    expect(analyserReveil('salut maya comment vont mes ruches')).toEqual({
      reveil: true,
      commande: 'comment vont mes ruches',
    });
  });

  it('commande vide si on dit juste le réveil', () => {
    expect(analyserReveil('salut maya').commande).toBe('');
  });

  it('normalise accents et ponctuation de la commande', () => {
    // « maïa » ne doit pas se scinder en « mai a » (sinon le nom n'est pas reconnu).
    const r = analyserReveil('Maïa, météo demain ?');
    expect(r.reveil).toBe(true);
    expect(r.commande).toBe('meteo demain');
  });
});
