// ═══════════════════════════════════════════════════════════════════════════
// LA RÈGLE QUI DISTINGUE UN SILENCE D'UNE PANNE.
//
// ⚠️ CE BANC EXISTE À CÔTÉ DE `boucleVocale`, PAS À SA PLACE. Le banc
// d'intégration mesure le COMPORTEMENT — le réveil survit-il à soixante
// respirations ? — mais il ne peut pas atteindre toutes les branches : sous
// Vitest, `performance.now()` répond toujours, donc « durée illisible » n'y
// est jamais traversée. Une mutation l'a montré (`Number.isFinite` inversé :
// banc d'intégration VERT). CLAUDE.md le dit : une branche qu'un banc ne peut
// pas atteindre, on l'annonce et on la force ailleurs.
//
// La règle est PURE : elle se mesure ici directement, sans navigateur, sans
// minuteurs, sans magasin.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  compteurApresSession,
  sessionSaine,
  DUREE_SESSION_SAINE_MS,
} from '../../../../app/utils/sessionSaine';

describe('une session a-t-elle VÉCU ?', () => {
  it('garde-fou : une session qui a démarré et duré est saine', () => {
    // Sans lui, un `return false` constant satisferait tous les cas suivants —
    // et le silence redeviendrait une panne.
    expect(sessionSaine({ aDemarre: true, vecuMs: 1500 })).toBe(true);
  });

  it('une session qui n’a JAMAIS obtenu le micro n’est pas saine', () => {
    // Micro refusé, pris ailleurs : `onstart` n'est jamais appelé. C'est
    // celle-là, et elle seule, qu'il faut compter.
    expect(sessionSaine({ aDemarre: false, vecuMs: 9999 })).toBe(false);
  });

  it('une session mort-née en quelques millisecondes n’est pas saine', () => {
    expect(sessionSaine({ aDemarre: true, vecuMs: 40 })).toBe(false);
  });

  it('le seuil est inclusif — pile 700 ms compte comme vécu', () => {
    expect(sessionSaine({ aDemarre: true, vecuMs: DUREE_SESSION_SAINE_MS })).toBe(true);
    expect(sessionSaine({ aDemarre: true, vecuMs: DUREE_SESSION_SAINE_MS - 1 })).toBe(false);
  });

  it('⚠️ une durée ILLISIBLE ne vaut pas « saine »', () => {
    /**
     * `performance.now()` n'existe pas au rendu serveur : `vecuMs` peut
     * arriver `NaN`. Devant une mesure qu'on ne sait pas lire, on refuse — la
     * règle du dépôt, « inconnu ne vaut jamais laisse-passer ». La laisser
     * passer rendrait TOUTE session saine, donc le compteur éternellement à
     * zéro : un micro réellement pris ne se dirait plus jamais.
     */
    expect(sessionSaine({ aDemarre: true, vecuMs: Number.NaN })).toBe(false);
    expect(sessionSaine({ aDemarre: true, vecuMs: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe('le compteur après la session', () => {
  it('garde-fou : une session mort-née l’incrémente', () => {
    expect(compteurApresSession(5, { aDemarre: false, vecuMs: 10 })).toBe(6);
  });

  it('une session saine le remet à ZÉRO, quel qu’il soit', () => {
    /**
     * ⚠️ C'EST LA MOITIÉ DE LA RÈGLE QUI AVAIT DIVERGÉ. La fonction rend le
     * compteur plutôt qu'un booléen précisément pour que personne n'ait à
     * recoller « si saine alors 0 sinon +1 » chez soi — c'est en le recollant
     * une fois sur deux que le réveil s'est retrouvé sans la règle.
     */
    expect(compteurApresSession(11, { aDemarre: true, vecuMs: 1500 })).toBe(0);
  });

  it('il ne redescend jamais tout seul sur une mort-née', () => {
    expect(compteurApresSession(0, { aDemarre: true, vecuMs: 5 })).toBe(1);
  });
});
