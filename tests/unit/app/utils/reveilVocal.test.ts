import { describe, expect, it } from 'vitest';
import { analyserReveil, creerDetecteurReveil } from '../../../../app/utils/reveilVocal';

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

// ═══════════════════════════════════════════════════════════════════════════
// LE DÉTECTEUR À DEUX TEMPS — ouvrir vite SANS perdre la phrase.
//
// ⚠️ CES DEUX BESOINS SE CONTREDISENT, ET C'EST TOUT L'OBJET DU DÉTECTEUR.
//
// Ouvrir vite exige de lire les résultats INTERMÉDIAIRES : le final n'arrive
// qu'après un silence, soit une à deux secondes après « Salut Maya ». Mais un
// intermédiaire se révise (« salut maya » → « salut mais y a »), et surtout il
// ne porte pas encore la question : au moment où l'on reconnaît le réveil,
// « …comment vont mes ruches ? » n'a pas commencé à être transcrit.
//
// Le détecteur sépare donc ce que l'ancienne version confondait : OUVRIR est un
// geste d'écran (rapide, réversible), LIVRER est un geste de contenu (tardif,
// définitif). Chaque cas ci-dessous garde l'un ou l'autre.
// ═══════════════════════════════════════════════════════════════════════════

describe('creerDetecteurReveil — garde-fou', () => {
  it('ne dit rien tant qu’aucun réveil n’est prononcé', () => {
    // Sans ce cas, un détecteur qui ouvrirait à TOUT rendrait les suivants
    // vacuement verts : « il a ouvert, c'est bien ce qu'on attendait ».
    const d = creerDetecteurReveil();
    expect(d.observer('je regarde mes ruches', false).action).toBe('rien');
    expect(d.observer('je regarde mes ruches', true).action).toBe('rien');
    expect(d.confirmer().action).toBe('rien');
  });
});

describe('creerDetecteurReveil — ouvrir vite', () => {
  it('un SEUL intermédiaire ne suffit pas : il fait patienter', () => {
    // C'est la parade à la révision. Ouvrir au premier intermédiaire ferait
    // surgir la bulle sur « salut mais y a… ».
    const d = creerDetecteurReveil();
    expect(d.observer('salut maya', false).action).toBe('patienter');
  });

  it('un SECOND intermédiaire confirme et ouvre', () => {
    const d = creerDetecteurReveil();
    d.observer('salut maya', false);
    expect(d.observer('salut maya comment', false).action).toBe('ouvrir');
  });

  it('le délai confirme quand aucun second intermédiaire n’arrive', () => {
    // « Salut Maya » dit seul, puis silence : le moteur n'émet plus rien avant
    // son final. Sans ce chemin, l'ouverture rapide ne servirait que les
    // phrases longues — exactement l'inverse du besoin.
    const d = creerDetecteurReveil();
    d.observer('salut maya', false);
    const decision = d.confirmer();
    expect(decision.action).toBe('ouvrir');
  });

  it('une RÉVISION désarme : le délai n’ouvre plus rien', () => {
    // Le cas que la confirmation existe pour attraper.
    const d = creerDetecteurReveil();
    expect(d.observer('salut maya', false).action).toBe('patienter');
    expect(d.observer('salut mais y a', false).action).toBe('rien');
    expect(d.confirmer().action, 'une révision doit annuler l’ouverture').toBe('rien');
  });

  it('n’ouvre jamais deux fois', () => {
    // La bulle est déjà là ; ré-ouvrir relancerait le mode vocal et le
    // passage de relais du micro au milieu d'une phrase.
    const d = creerDetecteurReveil();
    d.observer('salut maya', false);
    expect(d.observer('salut maya comment', false).action).toBe('ouvrir');
    expect(d.observer('salut maya comment vont', false).action).toBe('rien');
    expect(d.confirmer().action).toBe('rien');
  });
});

describe('creerDetecteurReveil — livrer la phrase ENTIÈRE', () => {
  it('l’ouverture ne livre AUCUNE commande', () => {
    // ⚠️ LE CŒUR DU DÉCOUPAGE. À l'instant où l'on reconnaît le réveil, la
    // question n'est pas encore transcrite. Livrer ici enverrait un moignon —
    // « comment » au lieu de « comment vont mes ruches ». C'est précisément
    // pour ça que l'ancienne version attendait le final, et perdait deux
    // secondes.
    const d = creerDetecteurReveil();
    d.observer('salut maya comm', false);
    const decision = d.observer('salut maya comment', false);
    expect(decision.action).toBe('ouvrir');
    expect(Object.keys(decision)).not.toContain('livrer');
  });

  it('le FINAL livre la question complète', () => {
    const d = creerDetecteurReveil();
    d.observer('salut maya comm', false);
    d.observer('salut maya comment', false);
    const decision = d.observer('salut maya comment vont mes ruches', true);
    expect(decision).toEqual({ action: 'livrer', commande: 'comment vont mes ruches' });
  });

  it('un final SEUL ouvre et livre d’un coup', () => {
    // L'apiculteur a parlé d'un trait, ou le moteur n'a émis aucun
    // intermédiaire (c'est le cas sur certains navigateurs).
    const d = creerDetecteurReveil();
    expect(d.observer('salut maya note une visite', true)).toEqual({
      action: 'livrer',
      commande: 'note une visite',
    });
  });

  it('« Salut Maya » seul livre une commande VIDE', () => {
    // Cas normal, et il ne doit rien envoyer : la bulle s'ouvre, la dictée
    // prend le relais, l'apiculteur parle.
    const d = creerDetecteurReveil();
    expect(d.observer('salut maya', true)).toEqual({ action: 'livrer', commande: '' });
  });

  it('sans réveil reconnu, analyserReveil ne rend AUCUNE commande', () => {
    /**
     * ⚠️ C'EST L'INVARIANT SUR LEQUEL REPOSE TOUT LE CAS SUIVANT, et il vaut
     * mieux qu'un garde défensif : le détecteur livre `commande` telle quelle,
     * en s'appuyant sur le fait qu'elle est VIDE quand le réveil n'est pas
     * reconnu. Un `reveil ? commande : ''` a été écrit là-bas puis retiré — il
     * gardait une branche morte et donnait l'illusion d'une protection. La
     * protection est ici.
     */
    for (const phrase of ['salut mais y a note ça', 'je pense que maya se trompe', 'note ça']) {
      const r = analyserReveil(phrase);
      expect(r.reveil, phrase).toBe(false);
      expect(r.commande, `« ${phrase} » ne doit rien laisser passer comme commande`).toBe('');
    }
  });

  it('un final qui a PERDU le réveil ne livre pas le reste de la phrase', () => {
    // ⚠️ LE PIÈGE. La bulle est ouverte sur un intermédiaire, puis le moteur
    // révise : « salut maya note ça » devient « salut mais y a note ça ».
    // Rendre le transcript brut ferait poser à Maya une question que personne
    // n'a posée — et, si c'est une écriture, la ferait proposer.
    const d = creerDetecteurReveil();
    d.observer('salut maya', false);
    d.observer('salut maya note', false); // → ouvrir
    expect(d.observer('salut mais y a note ça', true)).toEqual({
      action: 'livrer',
      commande: '',
    });
  });

  it('n’attend pas d’intermédiaire pendant qu’il tient le micro', () => {
    const d = creerDetecteurReveil();
    d.observer('salut maya', false);
    d.observer('salut maya note', false); // → ouvrir
    expect(d.observer('salut maya note une', false).action).toBe('rien');
  });
});

describe('creerDetecteurReveil — repartir à zéro', () => {
  it('après réinitialisation, un nouveau réveil est possible', () => {
    // Sans ça, le second « Salut Maya » de la journée n'ouvrirait plus rien.
    const d = creerDetecteurReveil();
    d.observer('salut maya', true);
    d.reinitialiser();
    expect(d.observer('salut maya', false).action).toBe('patienter');
    expect(d.observer('salut maya encore', false).action).toBe('ouvrir');
  });
});
