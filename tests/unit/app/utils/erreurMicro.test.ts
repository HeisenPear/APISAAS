import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  diagnostiquerMicro,
  creerDiagnostiqueurMicro,
  issueDeSecours,
  messageServiceInjoignableDurable,
  memoireVolatile,
  MESSAGE_RIEN_ENTENDU,
  type Appareil,
  type MemoireEchecs,
} from '~/utils/erreurMicro';
import { memoireLocaleEchecsMicro, detecterAppareil } from '~/utils/memoireEchecsMicro';

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
    //
    // La forme attendue s'est RESSERRÉE le jour où la mémoire a dû survivre au
    // rechargement : il ne suffit plus de fabriquer un diagnostiqueur, il faut
    // lui donner la mémoire PARTAGÉE. Un lecteur qui en bricolerait une autre
    // recréerait la duplication que tout ce fichier existe pour interdire.
    expect(sansCommentaires).toMatch(/creerDiagnostiqueurMicro\(/);
    expect(sansCommentaires).toMatch(/memoireLocaleEchecsMicro\(/);
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
      expect(src, `${f} doit fabriquer son diagnostiqueur`).toMatch(/creerDiagnostiqueurMicro\(/);
      expect(src, `${f} doit prendre la mémoire PARTAGÉE, pas s'en fabriquer une`).toMatch(
        /memoireLocaleEchecsMicro\(/,
      );
      expect(src, `${f} ne doit pas lire le stockage lui-même`).not.toMatch(/localStorage/);
      expect(src, `${f} ne doit pas recompter pour son compte`).not.toMatch(/echecsReseau/);
      expect(src, `${f} ne doit pas rejuger le code lui-même`).not.toMatch(/===\s*['"`]network/);
    }
  });
});

describe('la mémoire d’échecs survit au rechargement de la page', () => {
  /**
   * ⚠️ LE DÉFAUT, TEL QU'IL A ÉTÉ VÉCU. Signalé depuis le terrain sur Arc — un
   * Chromium qui n'est pas Google Chrome, donc sans la clé du service de
   * reconnaissance. Journal à l'appui :
   *
   *     2609 ms · demarrer · réveil vocal inactif
   *     2620 ms · onstart · le micro est à nous
   *     3190 ms · onerror:network
   *     3191 ms · onend · session fermée (relances à vide : 0)
   *
   * Le micro est acquis, la connexion marche, et le service refuse — pour
   * toujours, sur ce navigateur. Le message durable existait déjà… et ne
   * s'affichait JAMAIS. Deux raisons qui se cumulent :
   *
   *   · il faut un DEUXIÈME échec réseau pour basculer,
   *   · mais le premier est FATAL et coupe la relance,
   *   · et la mémoire vivait dans une fermeture de module, remise à zéro à
   *     chaque chargement de page.
   *
   * Résultat : l'apiculteur relisait « réessaie » à chaque session, sur un
   * navigateur où réessayer ne pouvait rien changer. C'est exactement le
   * cul-de-sac que l'en-tête d'`erreurMicro` dit vouloir éviter.
   */
  it('un diagnostiqueur NEUF hérite des échecs de la session précédente', () => {
    // Le cœur du correctif. La mémoire est le SEUL lien entre deux sessions :
    // on simule le rechargement en jetant le diagnostiqueur, pas la mémoire.
    const memoire = memoireVolatile();
    const avantRechargement = creerDiagnostiqueurMicro(memoire);
    const premier = avantRechargement('network');

    const apresRechargement = creerDiagnostiqueurMicro(memoire);
    const second = apresRechargement('network');

    expect(premier.message, 'le premier échec laisse sa chance au réseau').toBe(
      diagnostiquerMicro('network', 0).message,
    );
    expect(
      second.message,
      'après rechargement, le diagnostic doit ESCALADER : sans ça l’apiculteur ' +
        'relit « réessaie » indéfiniment sur un navigateur où c’est impossible',
    ).not.toBe(premier.message);
    expect(second.message).toMatch(/navigateur/i);
  });

  it('sans mémoire fournie, le comportement d’avant est conservé', () => {
    // Contrôle négatif : la mémoire est une OPTION. Un appelant qui n'en donne
    // pas doit obtenir exactement l'ancien comportement, pas une régression.
    const a = creerDiagnostiqueurMicro();
    const b = creerDiagnostiqueurMicro();
    a('network');
    expect(b('network').message).toBe(diagnostiquerMicro('network', 0).message);
  });

  it('la mémoire locale écrit et se relit vraiment (garde-fou)', () => {
    // ⚠️ SANS CE CAS, TOUT LE BLOC EST VIDE. Si `localStorage` ne retenait rien
    // dans le harnais, `lire()` rendrait 0 pour toujours et les cas ci-dessus
    // passeraient au vert en ne mesurant rien.
    localStorage.clear();
    const m = memoireLocaleEchecsMicro('banc');
    expect(m.lire(), 'part de zéro').toBe(0);
    m.ecrire(3);
    expect(memoireLocaleEchecsMicro('banc').lire(), 'une AUTRE instance doit relire').toBe(3);
    localStorage.clear();
  });

  it('deux lecteurs gardent des mémoires distinctes', () => {
    // La dictée et le réveil vocal ne partagent ni leur déclencheur ni leur
    // usage : l'échec de l'un ne doit pas condamner l'autre d'entrée de jeu.
    localStorage.clear();
    memoireLocaleEchecsMicro('dictee').ecrire(5);
    expect(memoireLocaleEchecsMicro('reveil').lire()).toBe(0);
    localStorage.clear();
  });

  it('un stockage refusé dégrade le message, il ne casse jamais la dictée', () => {
    // Navigation privée, réglage strict : `localStorage` peut JETER. Perdre la
    // mémoire doit coûter un message moins bon, jamais une panne.
    const vrai = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('stockage refusé');
      },
    });
    try {
      const m = memoireLocaleEchecsMicro('refuse');
      expect(m.lire()).toBe(0);
      expect(() => m.ecrire(2)).not.toThrow();
    } finally {
      if (vrai) Object.defineProperty(globalThis, 'localStorage', vrai);
    }
  });
});

describe('l’issue de secours nomme ce qui MARCHE, là où l’apiculteur est', () => {
  /**
   * « Écris ta phrase » est vrai, mais c'est le conseil le plus pauvre : il
   * retire la voix à quelqu'un qui dicte PARCE QUE ses mains sont prises. Or
   * toute plateforme a une dictée SYSTÈME qui ne passe pas par le service
   * distant de Chrome — c'est justement pourquoi elle marche quand Web Speech
   * tombe. La nommer, c'est rendre la voix au lieu de la retirer.
   */
  const APPAREILS: Appareil[] = ['tactile', 'mac', 'windows', 'autre'];

  it('chaque appareil a sa propre issue — aucune n’est recopiée', () => {
    const phrases = APPAREILS.map(issueDeSecours);
    expect(new Set(phrases).size, 'deux appareils rendent la même phrase').toBe(APPAREILS.length);
  });

  it('toutes proposent d’écrire — la seule issue vraie partout', () => {
    // Reprise de la règle du bloc réseau : quel que soit l'appareil, on ne
    // laisse jamais l'apiculteur sans une issue qui marche à coup sûr.
    for (const a of APPAREILS) expect(issueDeSecours(a), a).toMatch(/écri/i);
  });

  it('chaque issue nomme un geste CONCRET, pas une catégorie', () => {
    expect(issueDeSecours('tactile')).toMatch(/clavier/i);
    expect(issueDeSecours('mac'), 'doit donner le raccourci, pas « la dictée »').toMatch(/Fn|🌐/);
    expect(issueDeSecours('windows'), 'doit donner le raccourci').toMatch(/Windows \+ H/);
  });

  it('un appareil inconnu retombe sur la phrase prudente, jamais sur un mauvais raccourci', () => {
    // Une détection ratée doit dégrader le conseil, pas le rendre FAUX :
    // envoyer un Mac chercher « Windows + H » serait pire que se taire.
    const prudente = issueDeSecours('autre');
    expect(prudente).not.toMatch(/Fn|🌐|Windows \+ H|clavier/i);
  });

  it('le message durable porte l’issue de l’appareil', () => {
    for (const a of APPAREILS) {
      expect(messageServiceInjoignableDurable(a), a).toContain(issueDeSecours(a));
      expect(messageServiceInjoignableDurable(a), a).toMatch(/navigateur/i);
    }
  });

  it('le diagnostic transporte l’appareil jusqu’au message', () => {
    // Le raccord : l'appareil doit traverser diagnostiquerMicro, sinon les
    // phrases ci-dessus existent et ne sortent jamais.
    expect(diagnostiquerMicro('network', 1, 'mac').message).toBe(
      messageServiceInjoignableDurable('mac'),
    );
    expect(diagnostiquerMicro('network', 1, 'windows').message).not.toBe(
      messageServiceInjoignableDurable('mac'),
    );
  });

  it('le diagnostiqueur passe l’appareil qu’on lui donne', () => {
    const suivre: MemoireEchecs = { lire: () => 1, ecrire: () => {} };
    expect(creerDiagnostiqueurMicro(suivre, 'mac')('network').message).toBe(
      messageServiceInjoignableDurable('mac'),
    );
  });

  it('la détection rend toujours un appareil du type, jamais une valeur libre', () => {
    expect(APPAREILS).toContain(detecterAppareil());
  });
});
