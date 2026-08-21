import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { diagnostiquerMicro, MESSAGE_RIEN_ENTENDU } from '~/utils/erreurMicro';

/**
 * Le défaut que ce banc verrouille n'est pas un plantage : c'est un MENSONGE.
 *
 * `useDictee` ne traitait que trois codes d'erreur. Tous les autres finissaient,
 * après six relances, sur « Je n'ai rien entendu — réessaie en approchant le
 * micro ». Un service de reconnaissance injoignable (`network`) donnait donc
 * exactement le conseil qui ne pouvait pas aider.
 */
describe('diagnostiquerMicro — un code, une cause, une phrase juste', () => {
  it('nomme les causes permanentes et dit d’arrêter d’insister', () => {
    for (const code of [
      'not-allowed',
      'service-not-allowed',
      'audio-capture',
      'network',
      'language-not-supported',
      'bad-grammar',
    ]) {
      const d = diagnostiquerMicro(code);
      expect(d.fatal, code).toBe(true);
      expect(d.message.length, code).toBeGreaterThan(10);
    }
  });

  it('le service injoignable ne parle NI de micro NI d’approcher', () => {
    /**
     * Le cœur du correctif. C'est ce message précis qui envoyait chercher au
     * mauvais endroit — il doit désigner le réseau, et écarter explicitement le
     * micro.
     */
    const d = diagnostiquerMicro('network');
    expect(d.message).toMatch(/connexion|service/i);
    expect(d.message).toMatch(/n['’]est pas ton micro/i);
    expect(d.message).not.toMatch(/approch/i);
  });

  it('ne traite PAS comme des échecs les deux codes du fonctionnement normal', () => {
    // L'écoute continue est fermée périodiquement par le navigateur : `onend`
    // suit et la relance reprend. Les signaler afficherait une erreur alors
    // qu'on écoute toujours.
    for (const code of ['no-speech', 'aborted']) {
      const d = diagnostiquerMicro(code);
      expect(d.fatal, code).toBe(false);
      expect(d.message, code).toBe('');
    }
  });

  it('un code inconnu est nommé, sans être déclaré fatal', () => {
    // Les navigateurs inventent des codes. On ne condamne pas la dictée pour
    // autant — mais on cesse de prétendre qu'on n'a rien entendu.
    const d = diagnostiquerMicro('quelque-chose-de-neuf');
    expect(d.fatal).toBe(false);
    expect(d.code).toBe('quelque-chose-de-neuf');
    expect(d.message).toContain('quelque-chose-de-neuf');
    expect(d.message).not.toMatch(/rien entendu/i);
  });

  it('encaisse l’absence de code sans produire une phrase vide', () => {
    for (const v of [undefined, null, '', '   ']) {
      const d = diagnostiquerMicro(v);
      expect(d.code, String(v)).toBe('inconnu');
      expect(d.message.length, String(v)).toBeGreaterThan(10);
    }
  });
});

describe('« je n’ai rien entendu » est réservé au cas où c’est vrai', () => {
  it('le message dédié ne sert pas de fourre-tout', () => {
    // Aucun code d'erreur ne doit produire ce message : il est réservé au cas
    // « on a écouté, on n'a rien capté », qui n'est pas une erreur d'API.
    for (const code of [
      'not-allowed',
      'service-not-allowed',
      'audio-capture',
      'network',
      'language-not-supported',
      'bad-grammar',
      'no-speech',
      'aborted',
      'inconnu',
    ]) {
      expect(diagnostiquerMicro(code).message, code).not.toBe(MESSAGE_RIEN_ENTENDU);
    }
  });

  it('il ne conseille plus d’« approcher le micro » — ce n’était pas la cause', () => {
    expect(MESSAGE_RIEN_ENTENDU).not.toMatch(/approch/i);
    expect(MESSAGE_RIEN_ENTENDU).toMatch(/micro/i);
  });
});

describe('la dictée passe bien par la table, sans message écrit en dur', () => {
  it('useDictee ne compose plus ses phrases d’erreur lui-même', () => {
    /**
     * Le garde qui compte : une table de diagnostic contournée par un message
     * écrit à la main dans le composable, et le mensonge revient sans que ce
     * banc ne bronche.
     */
    const src = readFileSync('app/composables/useDictee.ts', 'utf-8');
    const sansCommentaires = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*)/.test(l))
      .join('\n');

    expect(sansCommentaires, 'useDictee doit consommer la table de diagnostic').toMatch(
      /diagnostiquerMicro/,
    );
    // Aucune affectation de `erreur.value` à une chaîne littérale.
    const enDur = [...sansCommentaires.matchAll(/erreur\.value\s*=\s*['"`]([^'"`]{12,})/g)].map(
      (m) => m[1]!,
    );
    expect(enDur, 'message d’erreur micro écrit en dur au lieu de passer par la table').toEqual([]);
  });
});
