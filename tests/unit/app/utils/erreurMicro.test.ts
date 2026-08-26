import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  diagnostiquerMicro,
  creerDiagnostiqueurMicro,
  MESSAGE_RIEN_ENTENDU,
} from '~/utils/erreurMicro';

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
      /creerDiagnostiqueurMicro/,
    );
    // Aucune affectation de `erreur.value` à une chaîne littérale.
    const enDur = [...sansCommentaires.matchAll(/erreur\.value\s*=\s*['"`]([^'"`]{12,})/g)].map(
      (m) => m[1]!,
    );
    expect(enDur, 'message d’erreur micro écrit en dur au lieu de passer par la table').toEqual([]);
  });
});

describe('un service injoignable qui SE RÉPÈTE n’est plus un incident passager', () => {
  /**
   * ⚠️ LE DÉFAUT QUE CE BLOC VERROUILLE A ÉTÉ SIGNALÉ DEPUIS LE TERRAIN.
   *
   * Journal rapporté : `onstart · le micro est à nous` à 129 330 ms, puis
   * `onerror:network` 550 ms plus tard. Le micro est acquis, l'application
   * répond, la connexion marche — et pourtant le service de reconnaissance ne
   * répond pas. C'est la signature d'un navigateur qui n'a PAS accès au service
   * distant de Chrome : Brave, un Chromium sans clé Google, certaines vues web
   * intégrées. Là, « réessaie plus tard » est faux pour toujours.
   *
   * Un conseil qui ne peut pas aider est un cul-de-sac. La règle : au premier
   * échec on laisse sa chance au réseau ; au second, on nomme la vraie cause et
   * on donne l'issue qui, elle, marche — écrire.
   */
  it('le premier échec laisse sa chance au réseau', () => {
    const d = diagnostiquerMicro('network', 0);
    expect(d.fatal).toBe(true);
    expect(d.message).toMatch(/n['’]est pas ton micro/i);
  });

  it('le deuxième échec cesse de promettre que ça marchera plus tard', () => {
    const d = diagnostiquerMicro('network', 1);
    expect(d.message).not.toBe(diagnostiquerMicro('network', 0).message);
    expect(d.message, 'ne doit plus renvoyer à la connexion').not.toMatch(/plus tard/i);
    expect(d.message, 'doit désigner le navigateur').toMatch(/navigateur/i);
    expect(d.fatal).toBe(true);
  });

  it('les DEUX messages proposent d’écrire — la seule issue qui marche toujours', () => {
    // Sans issue, le diagnostic le plus juste reste un mur. Maya comprend la
    // phrase écrite exactement comme la phrase dictée : c'est ce qu'il faut dire.
    for (const n of [0, 1, 5]) {
      expect(diagnostiquerMicro('network', n).message, `échec n°${n}`).toMatch(/écri/i);
    }
  });

  it('le compte d’échecs ne change RIEN aux autres codes', () => {
    // La bascule ne doit s'appliquer qu'au réseau : un micro refusé au troisième
    // essai reste un micro refusé.
    for (const code of ['not-allowed', 'audio-capture', 'no-speech', 'aborted', 'inconnu-xyz']) {
      expect(diagnostiquerMicro(code, 4).message, code).toBe(diagnostiquerMicro(code, 0).message);
      expect(diagnostiquerMicro(code, 4).fatal, code).toBe(diagnostiquerMicro(code, 0).fatal);
    }
  });
});

describe('le réveil vocal lit la MÊME table que la dictée', () => {
  /**
   * ⚠️ IL AVAIT SA PROPRE LISTE, RECOPIÉE ET COURTE — deux codes sur huit :
   *
   *     if (e.error === 'not-allowed' || e.error === 'service-not-allowed')
   *
   * `network` n'y était pas. Sur un navigateur qui ne joint pas le service, le
   * réveil vocal relançait donc douze fois toutes les 400 ms, puis se taisait
   * sans un mot — et `watch(doitEcouter)` remettait le compteur à zéro à chaque
   * retour au premier plan et à chaque fin de dictée. Une boucle permanente,
   * l'indicateur d'enregistrement qui clignote, la batterie qui descend, et
   * aucune explication.
   *
   * C'est exactement la faute que CLAUDE.md interdit : recopier au lieu de
   * dériver. La table existait déjà à côté.
   */
  const source = readFileSync('app/composables/useReveilMaya.ts', 'utf-8');
  const sansCommentaires = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join('\n');

  it('il APPELLE le diagnostic partagé, il ne le cite pas', () => {
    // On exige l'appel, pas le mot : une mutation a déjà démontré qu'une simple
    // occurrence survit dans la ligne d'import et garde l'assertion verte.
    expect(sansCommentaires).toMatch(/creerDiagnostiqueurMicro\(\)/);
    expect(sansCommentaires).toMatch(/diagnostiquer\(\s*\w/);
  });

  it('il ne garde plus sa liste de codes recopiée', () => {
    const recopies = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network'].filter(
      (c) => new RegExp(`['"\`]${c}['"\`]`).test(sansCommentaires),
    );
    expect(recopies, 'codes d’erreur recopiés au lieu d’être lus dans la table').toEqual([]);
  });

  it('un code fatal coupe l’option au lieu de relancer', () => {
    // `bloque` seul ne suffit pas : il est local au composable, et le watch le
    // ressuscite. Il faut couper l'option elle-même.
    expect(sansCommentaires).toMatch(/fatal/);
    expect(sansCommentaires).toMatch(/setReveilVocal\(false\)/);
  });
});

describe('la mémoire des échecs vit dans la table, pas chez les appelants', () => {
  /**
   * ⚠️ LA PREMIÈRE VERSION DE CE CORRECTIF AVAIT LA MÊME FAUTE QUE LE DÉFAUT
   * QU'IL CORRIGEAIT. Chaque lecteur tenait son propre compteur et son propre
   * `if (code === 'network') compteur++` — la règle écrite deux fois, à deux
   * endroits, exactement ce que CLAUDE.md interdit. Ce bloc garde la version
   * dérivée : la mémoire est DANS la table, les lecteurs n'en tiennent aucune.
   */
  it('le diagnostiqueur escalade tout seul, sans que l’appelant compte', () => {
    const diagnostiquer = creerDiagnostiqueurMicro();
    const premier = diagnostiquer('network');
    const second = diagnostiquer('network');
    const troisieme = diagnostiquer('network');
    expect(premier.message).toBe(diagnostiquerMicro('network', 0).message);
    expect(second.message).not.toBe(premier.message);
    expect(troisieme.message).toBe(second.message);
  });

  it('seul le réseau alimente la mémoire', () => {
    // Un « rien entendu » entre deux tentatives ne doit pas faire croire à une
    // panne durable du service.
    const diagnostiquer = creerDiagnostiqueurMicro();
    diagnostiquer('no-speech');
    diagnostiquer('aborted');
    diagnostiquer('not-allowed');
    expect(diagnostiquer('network').message).toBe(diagnostiquerMicro('network', 0).message);
  });

  it('deux lecteurs ne se contaminent pas', () => {
    // La dictée et le réveil vocal ont chacun leur instance : l'échec de l'un
    // ne doit pas condamner l'autre d'entrée de jeu.
    const dictee = creerDiagnostiqueurMicro();
    const reveil = creerDiagnostiqueurMicro();
    dictee('network');
    dictee('network');
    expect(reveil('network').message).toBe(diagnostiquerMicro('network', 0).message);
  });

  it('aucun lecteur ne tient sa propre mémoire d’échecs', () => {
    for (const f of ['app/composables/useDictee.ts', 'app/composables/useReveilMaya.ts']) {
      const src = readFileSync(f, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');
      expect(src, `${f} doit fabriquer son diagnostiqueur`).toMatch(/creerDiagnostiqueurMicro\(\)/);
      expect(src, `${f} ne doit pas recompter pour son compte`).not.toMatch(/echecsReseau/);
      expect(src, `${f} ne doit pas rejuger le code lui-même`).not.toMatch(/===\s*['"`]network/);
    }
  });
});
