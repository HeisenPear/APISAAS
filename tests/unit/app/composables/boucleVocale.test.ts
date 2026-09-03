// ═══════════════════════════════════════════════════════════════════════════
// LA BOUCLE VOCALE — « il s'active, il écoute, et quand la phrase se termine
// il enclenche une réponse sans couper la dictée ».
//
// ⚠️ CE BANC EXISTE PARCE QUE TROIS DÉFAUTS VOCAUX ONT VÉCU LONGTEMPS SANS
// QU'AUCUN TEST NE PUISSE LES VOIR — et pour une raison qui se défend : « le
// comportement micro ne se teste pas hors navigateur ». C'est vrai du MICRO.
// Ce n'est pas vrai de la MACHINE D'ÉTAT qui l'entoure, et c'est là que les
// trois défauts se trouvaient :
//
//   · le réveil se taisait pour toujours après douze relances, en silence,
//     pendant que le réglage affichait « activé » ;
//   · la dictée mourait au bout de six respirations en accusant le micro de
//     quelqu'un dont le micro venait de marcher ;
//   · fermer la bulle ne rendait pas le micro.
//
// On remplace donc `SpeechRecognition` par un double qu'on PILOTE : il rend
// les mêmes évènements, dans le même ordre, et on choisit quand. Tout le reste
// — les composables, le magasin, l'arbitrage du micro — est le vrai code.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  computed,
  effectScope,
  getCurrentInstance,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type EffectScope,
} from 'vue';

// ─── Le double de reconnaissance vocale ────────────────────────────────────

interface FausseReco {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  demarree: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { resultIndex: number; results: unknown }) => void) | null;
}

/** Toutes les sessions créées, dans l'ordre — la dernière est celle qui écoute. */
let sessions: FausseReco[] = [];
/** `start()` doit-il refuser le micro (session mort-née) ? */
let micRefuse = false;

function fabriqueReco(): new () => FausseReco {
  return class {
    lang = '';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    demarree = false;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onresult: ((e: { resultIndex: number; results: unknown }) => void) | null = null;
    constructor() {
      sessions.push(this as unknown as FausseReco);
    }
    start() {
      if (micRefuse) {
        // Le navigateur rend la main sans jamais donner le micro : c'est la
        // signature d'une session mort-née.
        queueMicrotask(() => this.onend?.());
        return;
      }
      this.demarree = true;
      this.onstart?.();
    }
    stop() {
      this.demarree = false;
      this.onend?.();
    }
    abort() {
      this.demarree = false;
      this.onend?.();
    }
  };
}

/** La session en cours d'écoute. */
const active = (): FausseReco => sessions[sessions.length - 1]!;

/** Fait dire une phrase à la session courante. */
function parler(texte: string, final: boolean): void {
  const r = active();
  r.onresult?.({
    resultIndex: 0,
    results: {
      length: 1,
      0: { length: 1, isFinal: final, 0: { transcript: texte } },
    },
  });
}

// ─── Le harnais ────────────────────────────────────────────────────────────

let toasts: { title?: string; description?: string }[] = [];
let portee: EffectScope | null = null;
let mayaModule: typeof import('~~/app/stores/maya') | null = null;

beforeEach(async () => {
  mayaModule = await import('~~/app/stores/maya');
  vi.useFakeTimers();
  sessions = [];
  micRefuse = false;
  toasts = [];
  setActivePinia(createPinia());

  // Les composables résolvent leurs dépendances par auto-import Nuxt : sous
  // Vitest ce sont des identifiants libres, donc des globales.
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('getCurrentInstance', getCurrentInstance);
  vi.stubGlobal('onScopeDispose', onScopeDispose);
  // Le réveil s'abonne à `visibilitychange` au montage ; hors composant, on
  // exécute le rappel tout de suite — la page de test EST visible.
  vi.stubGlobal('onMounted', (f: () => void) => f());
  vi.stubGlobal('useToast', () => ({
    add: (t: { title?: string; description?: string }) => toasts.push(t),
  }));
  vi.stubGlobal('SpeechRecognition', fabriqueReco());
  // Le magasin de Maya est lui aussi un auto-import — et c'est le VRAI magasin
  // qu'on branche : l'arbitrage du micro entre le réveil et la dictée passe
  // par lui, un double l'aurait remplacé par une hypothèse.
  vi.stubGlobal('useMayaStore', () => {
    const { useMayaStore } = mayaModule!;
    return useMayaStore();
  });
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = fabriqueReco();
  localStorage.clear();
});

afterEach(() => {
  portee?.stop();
  portee = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
});

/** Monte un composable dans une portée réactive qu'on ferme proprement après. */
function monter<T>(f: () => T): T {
  portee = effectScope();
  return portee.run(f)!;
}

const store = () => mayaModule!.useMayaStore();

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le garde-fou du harnais
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le double de reconnaissance est bien branché', () => {
  it('la dictée ouvre une session et reçoit ce qu’on lui fait dire', async () => {
    // Sans ce cas, un harnais muet (mauvaise globale, mauvais nom d'évènement)
    // rendrait tous les suivants vacuement verts : « rien reçu, rien attendu ».
    const { useDictee } = await import('~~/app/composables/useDictee');
    const recu: string[] = [];
    const d = monter(() => useDictee());
    expect(d.supporte, 'le navigateur simulé doit savoir reconnaître la parole').toBe(true);

    d.demarrer((t) => recu.push(t));
    expect(sessions.length).toBe(1);
    parler('bonjour', true);
    expect(recu).toEqual(['bonjour']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. La fin d'un énoncé — ce qui déclenche la réponse
// ═══════════════════════════════════════════════════════════════════════════

describe('la fin d’un énoncé se mesure au SILENCE, pas au premier final', () => {
  it('n’envoie pas au premier résultat final', async () => {
    /**
     * ⚠️ LE DÉFAUT QUE CE CAS INTERDIT. Le moteur clôt un résultat à la moindre
     * respiration : « j'ai vu la reine… [souffle] …sur le cadre 4 » en produit
     * deux. Envoyer au premier couperait l'apiculteur au milieu de sa phrase,
     * et Maya recevrait « j'ai vu la reine » — une demi-information, sur
     * laquelle elle proposerait peut-être une écriture.
     */
    const { useDictee } = await import('~~/app/composables/useDictee');
    const envoyes: string[] = [];
    const d = monter(() => useDictee());
    d.demarrer(() => {}, { surEnonce: (t) => envoyes.push(t), silenceMs: 1000 });

    parler('j’ai vu la reine', true);
    vi.advanceTimersByTime(400);
    expect(envoyes, 'la phrase n’est pas finie').toEqual([]);

    parler('sur le cadre 4', true);
    vi.advanceTimersByTime(400);
    expect(envoyes, 'la respiration a relancé le compte à rebours').toEqual([]);

    vi.advanceTimersByTime(1000);
    expect(envoyes).toEqual(['j’ai vu la reine sur le cadre 4']);
  });

  it('n’envoie qu’UNE fois par énoncé', async () => {
    const { useDictee } = await import('~~/app/composables/useDictee');
    const envoyes: string[] = [];
    const d = monter(() => useDictee());
    d.demarrer(() => {}, { surEnonce: (t) => envoyes.push(t), silenceMs: 500 });

    parler('note une visite', true);
    vi.advanceTimersByTime(2000);
    expect(envoyes.length).toBe(1);
  });

  it('l’énoncé SUIVANT ne traîne pas le précédent', async () => {
    // Piège concret : le texte est CUMULÉ d'une relance à l'autre (c'est voulu,
    // sinon une coupure perdrait la phrase). Sans remise à zéro à l'envoi, la
    // deuxième question contiendrait la première.
    const { useDictee } = await import('~~/app/composables/useDictee');
    const envoyes: string[] = [];
    const d = monter(() => useDictee());
    d.demarrer(() => {}, { surEnonce: (t) => envoyes.push(t), silenceMs: 500 });

    parler('combien de ruches', true);
    vi.advanceTimersByTime(600);
    parler('et de hausses', true);
    vi.advanceTimersByTime(600);

    expect(envoyes).toEqual(['combien de ruches', 'et de hausses']);
  });

  it('n’envoie RIEN quand aucun `surEnonce` n’est fourni (usage au doigt)', async () => {
    // Règle produit : au doigt, l'apiculteur garde le dernier regard. Le mode
    // vocal est la seule exception, et il doit le rester.
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    let texte = '';
    d.demarrer((t) => (texte = t));
    parler('supprime la ruche 3', true);
    vi.advanceTimersByTime(5000);
    expect(texte).toBe('supprime la ruche 3');
    expect(d.actif.value, 'la dictée continue, elle n’a rien envoyé').toBe(true);
  });

  it('un silence sans un mot n’envoie pas une chaîne vide', async () => {
    const { useDictee } = await import('~~/app/composables/useDictee');
    const envoyes: string[] = [];
    const d = monter(() => useDictee());
    d.demarrer(() => {}, { surEnonce: (t) => envoyes.push(t), silenceMs: 300 });
    vi.advanceTimersByTime(3000);
    expect(envoyes).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. La dictée ne meurt plus d'une respiration
// ═══════════════════════════════════════════════════════════════════════════

describe('les relances : ce qui compte et ce qui ne compte pas', () => {
  it('SURVIT à dix respirations — une session qui a vécu n’est pas un échec', async () => {
    /**
     * ⚠️ LE DÉFAUT EXACT. Le compteur montait à CHAQUE session close sans un
     * mot, alors que l'écoute continue se referme d'elle-même à chaque silence
     * un peu long : c'est son fonctionnement normal. Six respirations
     * suffisaient donc à tuer la dictée — en affichant « Je n'ai rien
     * entendu », à quelqu'un qu'on venait d'entendre parler. Dans une boucle
     * vocale, où l'apiculteur se tait entre deux gestes, elle s'éteignait toute
     * seule au bout de quelques secondes.
     */
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    d.demarrer(() => {});
    parler('bonjour', true);

    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(1500); // la session vit…
      active().stop(); // …puis le navigateur la referme sur un silence
      vi.advanceTimersByTime(300); // repos de relance
      await Promise.resolve();
    }

    expect(d.erreur.value, 'une respiration n’est pas une panne de micro').toBeNull();
    expect(d.actif.value, 'la boucle vocale doit rester ouverte').toBe(true);
  });

  it('RENONCE quand le micro ne lui est jamais donné', async () => {
    // Le contre-test : sans lui, « ne jamais renoncer » satisferait le cas
    // précédent tout en harcelant le navigateur indéfiniment.
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    micRefuse = true;
    d.demarrer(() => {});

    for (let i = 0; i < 12; i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    }

    expect(d.actif.value).toBe(false);
    expect(d.erreur.value, 'et il faut le DIRE').toBeTruthy();
  });

  it('ne dit PAS « je n’ai rien entendu » quand il a entendu', async () => {
    /**
     * ⚠️ UN DIAGNOSTIC QUI MENT COÛTE PLUS CHER QUE PAS DE DIAGNOSTIC. Ce
     * message envoie vérifier le micro, changer d'entrée audio, souffler
     * dedans — alors que le micro vient de transcrire une phrase entière. La
     * vraie cause, elle, est ailleurs (une autre application l'a repris).
     */
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    d.demarrer(() => {});
    parler('la ruche 3 est faible', true);
    micRefuse = true;

    for (let i = 0; i < 12; i++) {
      active().stop();
      await Promise.resolve();
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    }

    expect(d.actif.value, 'on s’arrête bien').toBe(false);
    expect(
      d.erreur.value,
      'accuser le micro de quelqu’un dont le micro vient de marcher envoie chercher au mauvais endroit',
    ).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Le réveil : ouvrir vite, et NE PAS lâcher le micro trop tôt
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prive le réveil du micro et fait tourner N relances.
 *
 * ⚠️ IL FAUT FERMER LA SESSION EN COURS D'ABORD. Sans ça, la première session
 * — ouverte AVANT le refus — reste bien vivante, aucune relance n'a lieu, et le
 * banc mesure zéro tentative en croyant en mesurer soixante-dix. C'est la forme
 * « le balayage vide » de CLAUDE.md, transposée au temps.
 */
async function priverDuMicro(tours: number): Promise<void> {
  micRefuse = true;
  active().stop();
  for (let i = 0; i < tours; i++) {
    await Promise.resolve();
    vi.advanceTimersByTime(31_000);
    await Promise.resolve();
  }
}

/** Monte le réveil vocal, option activée. */
async function reveilActif() {
  const maya = store();
  maya.setReveilVocal(true);
  const { useReveilMaya } = await import('~~/app/composables/useReveilMaya');
  const r = monter(() => useReveilMaya());
  await nextTick();
  return { maya, r };
}

describe('le réveil ouvre la bulle SANS attendre le résultat final', () => {
  it('garde-fou : sans réveil prononcé, la bulle reste fermée', async () => {
    const { maya } = await reveilActif();
    parler('je regarde mes ruches', false);
    parler('je regarde mes ruches', true);
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(maya.bubbleOpen).toBe(false);
    expect(maya.modeVocal).toBe(false);
  });

  it('ouvre sur un INTERMÉDIAIRE confirmé — pas au bout d’une seconde', async () => {
    /**
     * ⚠️ C'EST LA DEMANDE : « il faut qu'il soit plus rapide à s'ouvrir ». Le
     * réveil ne lisait que les résultats FINAUX, qui n'arrivent qu'après un
     * silence : une à deux secondes d'attente devant une bulle qui ne bouge
     * pas, sans savoir si on a été entendu.
     */
    const { maya } = await reveilActif();
    parler('salut maya', false);
    vi.advanceTimersByTime(250); // le délai de confirmation
    await nextTick();
    expect(maya.bubbleOpen, 'la bulle doit être là avant le résultat final').toBe(true);
    expect(maya.modeVocal).toBe(true);
  });

  it('GARDE le micro entre l’ouverture et la fin de la phrase', async () => {
    /**
     * ⚠️ LE POINT LE PLUS SUBTIL DE TOUT LE MODE VOCAL. La bulle s'ouvre sur
     * « salut maya », mais la question — « comment vont mes ruches ? » — n'est
     * pas encore prononcée. Rendre le micro ici en perdrait la moitié ; le
     * reprendre par une seconde reconnaissance ferait tuer l'une des deux par
     * le navigateur (c'est ce qui coupait la dictée au bout d'une seconde).
     */
    const { maya } = await reveilActif();
    parler('salut maya', false);
    parler('salut maya comment', false);
    await nextTick();
    expect(maya.transfertVocal, 'le réveil doit encore tenir le micro').toBe(true);
    expect(maya.commandeVocale, 'rien ne doit partir sur un intermédiaire').toBeNull();
  });

  it('livre la question ENTIÈRE au résultat final, puis rend le micro', async () => {
    const { maya } = await reveilActif();
    parler('salut maya', false);
    parler('salut maya comment', false);
    parler('salut maya comment vont mes ruches', true);
    await nextTick();
    expect(maya.commandeVocale).toBe('comment vont mes ruches');
    expect(maya.transfertVocal, 'le micro passe à la dictée').toBe(false);
  });

  it('« Salut Maya » seul ouvre sans rien envoyer', async () => {
    // La bulle est là, la dictée prend le relais, l'apiculteur parle. Envoyer
    // une question vide ferait répondre Maya à personne.
    const { maya } = await reveilActif();
    parler('salut maya', true);
    await nextTick();
    expect(maya.bubbleOpen).toBe(true);
    expect(maya.modeVocal).toBe(true);
    expect(maya.commandeVocale).toBeNull();
  });

  it('rend le micro même si le résultat final n’arrive JAMAIS', async () => {
    /**
     * ⚠️ SANS CE GARDE-FOU, LE MODE VOCAL RESTERAIT MUET POUR TOUJOURS. La
     * dictée de la bulle attend que le transfert soit rendu ; si le final ne
     * vient pas — session fermée sur une erreur, apiculteur qui se tait — elle
     * ne démarrerait plus jamais, sur un micro que personne n'écoute.
     */
    const { maya } = await reveilActif();
    parler('salut maya', false);
    vi.advanceTimersByTime(250);
    await nextTick();
    expect(maya.transfertVocal).toBe(true);

    vi.advanceTimersByTime(5000);
    await nextTick();
    expect(maya.transfertVocal, 'le micro doit finir par être rendu').toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Le réveil ne se tait plus en silence
// ═══════════════════════════════════════════════════════════════════════════

describe('quand le micro est pris, le réveil le DIT', () => {
  it('espace ses tentatives au lieu de renoncer tout de suite', async () => {
    // Douze coupures rapides ne veulent pas dire « impossible » : le micro est
    // souvent pris quelques secondes par un appel ou une note vocale.
    const { maya } = await reveilActif();
    await priverDuMicro(14);

    expect(sessions.length, 'le banc doit avoir vraiment retenté').toBeGreaterThan(10);
    expect(toasts, 'trop tôt pour abandonner').toEqual([]);
    expect(maya.reveilVocal, 'l’option reste active').toBe(true);
  });

  it('finit par renoncer, EN LE DISANT et en nommant où relancer', async () => {
    /**
     * ⚠️ LE DÉFAUT EXACT. Après douze relances à vide, l'ancien code posait un
     * drapeau interne et se taisait. Or ce drapeau entre dans sa propre
     * condition d'écoute : une fois levé, plus rien ne repartait — ni au retour
     * au premier plan, ni après une dictée. L'apiculteur disait « Salut Maya »
     * dans le vide, devant un réglage qui affichait « activé ».
     */
    await reveilActif();
    await priverDuMicro(70);

    expect(sessions.length, 'le banc doit avoir vraiment retenté').toBeGreaterThan(40);
    expect(toasts.length, 'se taire laisse appeler dans le vide').toBeGreaterThan(0);
    expect(
      toasts.map((t) => `${t.title} ${t.description}`).join(' '),
      'un refus doit nommer sa porte de sortie',
    ).toMatch(/Réglages/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Sortir du mode vocal — le micro ne se rouvre jamais tout seul
// ═══════════════════════════════════════════════════════════════════════════

describe('reprendre la main coupe le mode vocal', () => {
  it('fermer la bulle sort du mode vocal', async () => {
    /**
     * ⚠️ LA DICTÉE SURVIVAIT À LA FERMETURE : micro pris, indicateur
     * d'enregistrement allumé, brouillon qui se remplissait dans une fenêtre
     * invisible — et le réveil, qui cède la place à toute dictée en cours, ne
     * pouvait plus reprendre. Le composant n'est jamais démonté (c'est le
     * bouton flottant) : rien ne nettoyait.
     */
    const maya = store();
    maya.ouvrirPourLaVoix();
    expect(maya.modeVocal).toBe(true);
    maya.closeBubble();
    expect(maya.modeVocal).toBe(false);
    expect(maya.transfertVocal).toBe(false);
  });

  it('mettre Maya en pause sort aussi du mode vocal', async () => {
    // Même défaut, autre porte : `setPresence('pause')` posait `bubbleOpen` à
    // faux directement, sans passer par la fermeture — le micro restait pris
    // par une bulle que plus rien n'affiche.
    const maya = store();
    maya.ouvrirPourLaVoix();
    maya.setPresence('pause');
    expect(maya.bubbleOpen).toBe(false);
    expect(maya.modeVocal).toBe(false);
  });

  it('Maya en pause n’ouvre PAS de mode vocal', async () => {
    // Sans ce cas, « Salut Maya » prendrait le micro pour une bulle qui ne
    // s'affichera jamais.
    const maya = store();
    maya.setPresence('pause');
    maya.ouvrirPourLaVoix();
    expect(maya.bubbleOpen).toBe(false);
    expect(maya.modeVocal, 'aucun micro pour une bulle invisible').toBe(false);
  });

  it('le réveil se remet à écouter quand la bulle se referme', async () => {
    // La boucle doit pouvoir recommencer : sans ça, un seul « Salut Maya » par
    // chargement de page.
    const { maya } = await reveilActif();
    parler('salut maya', true);
    await nextTick();
    expect(maya.bubbleOpen).toBe(true);

    const avant = sessions.length;
    maya.closeBubble();
    await nextTick();
    vi.advanceTimersByTime(600);
    await nextTick();
    expect(sessions.length, 'une nouvelle écoute doit s’ouvrir').toBeGreaterThan(avant);
  });
});
