// ═══════════════════════════════════════════════════════════════════════════
// LA BOUCLE VOCALE, MONTÉE POUR DE VRAI.
//
// ⚠️ CE FICHIER EST LE PREMIER DU DÉPÔT À MONTER UN COMPOSANT, ET CE N'EST PAS
// UNE PROUESSE : C'EST UN TROU QU'ON BOUCHE.
//
// `@vue/test-utils` et `happy-dom` sont installés depuis toujours. Personne ne
// s'en servait — si bien que toute décision vivant dans un `<script setup>`
// était HORS COUVERTURE, sans que rien ne le dise. Le mode vocal en a fait les
// frais quatre fois de suite : Maya parlait dans un micro ouvert et s'entendait
// se relancer ; le bouton « Quitter le mode vocal » OUVRAIT le micro ; une
// panne micro laissait un mode vocal fantôme ; un échec de requête faisait
// relire la réponse précédente. Quatre défauts, zéro banc capable de les voir.
//
// Ce qui est DOUBLÉ ici : le navigateur (`SpeechRecognition`,
// `speechSynthesis`) et le transport (`useCopilote`, qui parle au réseau).
// Ce qui est RÉEL : le composant, le magasin, `useDictee`, `useVoixMaya`, et
// tout l'arbitrage du micro entre eux. C'est là que vivaient les défauts.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount, type VueWrapper } from '@vue/test-utils';
import {
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onScopeDispose,
  onUnmounted,
  ref,
  watch,
} from 'vue';

// ─── Le double de reconnaissance vocale ────────────────────────────────────

interface FausseReco {
  interimResults: boolean;
  demarree: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { resultIndex: number; results: unknown }) => void) | null;
}

let sessions: FausseReco[] = [];

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

/** LE MICRO EST-IL OUVERT ? La question que tout ce fichier pose. */
const micOuvert = (): boolean => sessions.some((s) => s.demarree);
const active = (): FausseReco | undefined => sessions[sessions.length - 1];

/** Fait dire une phrase à la session en cours (un vrai moteur ne parle pas si elle est close). */
function dicter(texte: string, final: boolean): void {
  const r = active();
  if (!r || !r.demarree) return;
  if (!final && !r.interimResults) return;
  r.onresult?.({
    resultIndex: 0,
    results: { length: 1, 0: { length: 1, isFinal: final, 0: { transcript: texte } } },
  });
}

// ─── Le double de synthèse vocale ──────────────────────────────────────────

/** Ce que Maya a prononcé, dans l'ordre. */
let paroles: string[] = [];
/** Les énonciations en attente de leur `onend` — on choisit quand elles finissent. */
let enCours: { onend: (() => void) | null }[] = [];

function fabriqueSynthese() {
  return {
    getVoices: () => [{ lang: 'fr-FR', localService: true, name: 'fr' }],
    addEventListener: () => {},
    removeEventListener: () => {},
    speak(u: { text: string; onend: (() => void) | null }) {
      paroles.push(u.text);
      enCours.push(u);
    },
    cancel() {
      enCours = [];
    },
  };
}

/** Termine la parole en cours (ce que fait le navigateur à la dernière syllabe). */
function finirDeParler(): void {
  const liste = enCours;
  enCours = [];
  for (const u of liste) u.onend?.();
}

// ─── Le double de transport ────────────────────────────────────────────────

type Bulle = {
  role: 'user' | 'assistant';
  content: string;
  pending?: unknown;
  pendingPlan?: unknown;
  undo?: unknown;
  undoPlan?: unknown;
};

let messages: ReturnType<typeof ref<Bulle[]>>;
let streaming: ReturnType<typeof ref<boolean>>;
let erreurCopilote: ReturnType<typeof ref<{ message: string } | null>>;
/** Ce que le composant a demandé au transport — pour vérifier qu'il n'écrit pas à tort. */
let demandes: string[] = [];

// ─── Le harnais ────────────────────────────────────────────────────────────

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  /**
   * ⚠️ LES MINUTEURS SONT FAUX DÈS LE DÉPART, ET C'EST OBLIGATOIRE. La fin
   * d'énoncé s'arme par `setTimeout` au premier mot entendu ; basculer en
   * minuteurs faux APRÈS ne reprend pas la main sur ceux déjà posés — le banc
   * avançait alors le temps sans que rien ne se déclenche, et concluait que la
   * phrase n'avait pas été traitée.
   */
  vi.useFakeTimers();
  sessions = [];
  paroles = [];
  enCours = [];
  demandes = [];
  setActivePinia(createPinia());
  messages = ref<Bulle[]>([]);
  streaming = ref(false);
  erreurCopilote = ref<{ message: string } | null>(null);

  const Reco = fabriqueReco();
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = Reco;
  (window as unknown as { speechSynthesis?: unknown }).speechSynthesis = fabriqueSynthese();
  (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
    class {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      lang = '';
      voice: unknown = null;
      rate = 1;
      pitch = 1;
      constructor(public text: string) {}
    };

  // Les auto-imports de Nuxt sont, sous Vitest, des identifiants libres.
  for (const [nom, valeur] of Object.entries({
    ref,
    computed,
    watch,
    onMounted,
    onUnmounted,
    onScopeDispose,
    getCurrentInstance,
    nextTick,
    useToast: () => ({ add: () => {} }),
    useAuthStore: () => ({ profil: { prenom: 'Antoine' } }),
    navigateTo: () => {},
  })) {
    vi.stubGlobal(nom, valeur);
  }
});

afterEach(() => {
  vi.useRealTimers();
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
  delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
});

/** Monte la vraie bulle, en mode vocal, prête à écouter. */
async function monterEnModeVocal() {
  const { useMayaStore } = await import('~~/app/stores/maya');
  const { useDictee } = await import('~~/app/composables/useDictee');
  const { useVoixMaya } = await import('~~/app/composables/useVoixMaya');
  const { lireAccord, decisionVocale } = await import('~~/app/utils/accordVocal');
  const { paroleDeLaReponse } = await import('~~/app/utils/paroleMaya');

  vi.stubGlobal('useMayaStore', useMayaStore);
  vi.stubGlobal('useDictee', useDictee);
  vi.stubGlobal('useVoixMaya', useVoixMaya);
  vi.stubGlobal('lireAccord', lireAccord);
  vi.stubGlobal('decisionVocale', decisionVocale);
  vi.stubGlobal('paroleDeLaReponse', paroleDeLaReponse);
  vi.stubGlobal('useCopilote', () => ({
    messages,
    streaming,
    activite: ref(null),
    quota: ref(null),
    suggestions: ref([]),
    erreur: erreurCopilote,
    envoyer: (q: string) => {
      demandes.push(`envoyer:${q}`);
      return Promise.resolve();
    },
    confirmerAction: () => demandes.push('confirmerAction'),
    annulerAction: () => demandes.push('annulerAction'),
    annulerEcriture: () => demandes.push('annulerEcriture'),
    confirmerPlan: () => demandes.push('confirmerPlan'),
    annulerPlanProposition: () => demandes.push('annulerPlanProposition'),
    annulerLotExecute: () => demandes.push('annulerLotExecute'),
    reset: () => {},
  }));

  const MayaBubble = (await import('~~/app/components/ia/MayaBubble.vue')).default;
  wrapper = mount(MayaBubble, { shallow: true });

  const maya = useMayaStore();
  /**
   * ⚠️ DEUX TEMPS, ET UN TICK ENTRE LES DEUX — comme dans la réalité. Le réveil
   * OUVRE sur un résultat intermédiaire, puis LIVRE sur le final, une seconde
   * plus tard. Poser les deux dans le même tour laisse `transfertVocal` passer
   * de `false` à `false` du point de vue de l'observateur, qui ne se déclenche
   * donc jamais : le banc mesurerait un micro fermé et croirait à un défaut.
   */
  maya.ouvrirPourLaVoix();
  await nextTick();
  maya.livrerCommandeVocale('');
  await nextTick();
  await nextTick();
  return maya;
}

/** Pose une réponse de Maya et joue la fin du flux (ce que fait un tour réel). */
async function mayaRepond(bulle: Partial<Bulle> & { content: string }) {
  streaming.value = true;
  await nextTick();
  messages.value = [...messages.value, { role: 'assistant', ...bulle }];
  streaming.value = false;
  await nextTick();
  await nextTick();
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le garde-fou
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : la bulle montée écoute vraiment', () => {
  it('le mode vocal ouvre le micro tout seul', async () => {
    // Sans ce cas, un composant qui n'écouterait jamais rendrait tous les
    // suivants vacuement verts : « micro fermé, c'est bien ce qu'on voulait ».
    const maya = await monterEnModeVocal();
    expect(maya.modeVocal).toBe(true);
    expect(micOuvert(), 'la dictée doit démarrer sans qu’on touche à rien').toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Maya ne parle JAMAIS dans un micro ouvert
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ Maya ne s’entend pas parler', () => {
  it('le micro est fermé pendant qu’elle répond, et rouvert après', async () => {
    /**
     * ⚠️ LE DÉFAUT LE PLUS COÛTEUX DU MODE VOCAL. Sur un téléphone posé près
     * d'une ruche, haut-parleur allumé, le micro entend Maya. Le silence de fin
     * d'énoncé tombe alors sur SA propre phrase, qui repart comme une question.
     * Elle se répond à elle-même, et chaque réponse relance la suivante.
     */
    await monterEnModeVocal();
    await mayaRepond({ content: 'Tes douze ruches vont bien.' });

    expect(paroles, 'elle doit avoir parlé').toContain('Tes douze ruches vont bien.');
    expect(micOuvert(), 'le micro doit être FERMÉ pendant qu’elle parle').toBe(false);

    finirDeParler();
    await nextTick();
    await nextTick();
    expect(micOuvert(), 'et rouvert dès la dernière syllabe — la boucle continue').toBe(true);
  });

  it('le micro reste fermé quand elle répond à un « non »', async () => {
    // Trois branches parlaient sans couper : le renoncement en faisait partie.
    await monterEnModeVocal();
    await mayaRepond({ content: 'Je crée le client Jean ?', pending: {} });
    finirDeParler();
    await nextTick();
    await nextTick();

    dicter('non', true);
    vi.advanceTimersByTime(2000);
    await nextTick();
    await nextTick();

    expect(demandes).toContain('annulerAction');
    expect(micOuvert(), 'elle parle : le micro doit être fermé').toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Ce qu'elle dit, et ce qu'elle ne redit pas
// ═══════════════════════════════════════════════════════════════════════════

describe('un échec se dit, la réponse d’avant ne se redit pas', () => {
  it('prononce l’erreur au lieu de relire la réponse précédente', async () => {
    /**
     * ⚠️ SUR UN ÉCHEC, `useCopilote` RETIRE la question et la bulle vide : la
     * dernière bulle redevient la réponse d'AVANT. Maya la relisait mot pour
     * mot, consigne « dis oui pour confirmer » comprise, pour une proposition
     * qui n'existait plus — l'apiculteur pouvait dire « oui » à un vide.
     */
    await monterEnModeVocal();
    await mayaRepond({ content: 'Je crée le client Jean ?', pending: {} });
    finirDeParler();
    await nextTick();
    paroles = [];

    // Le tour suivant échoue : le fil ne bouge pas, l'erreur apparaît.
    erreurCopilote.value = { message: 'Ton abonnement ne permet pas cette action.' };
    streaming.value = true;
    await nextTick();
    streaming.value = false;
    await nextTick();
    await nextTick();

    expect(paroles.join(' ')).toContain('abonnement');
    expect(paroles.join(' '), 'la proposition n’existe plus : ne pas la redire').not.toContain(
      'Je crée le client Jean',
    );
  });

  it('la consigne d’accord est DITE quand une écriture attend', async () => {
    await monterEnModeVocal();
    await mayaRepond({ content: 'Je crée le client Jean ?', pending: {} });
    expect(paroles.join(' '), 'à l’oreille, rien ne dit qu’on peut répondre').toMatch(/oui/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Reprendre la main
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ le bouton micro ne peut pas faire l’inverse de ce qu’il promet', () => {
  it('touché pendant que Maya parle, il FERME et quitte le mode vocal', async () => {
    /**
     * ⚠️ IL DÉCIDAIT SUR `dicteeActive`. Or en mode vocal le micro est FERMÉ
     * pendant que Maya réfléchit ou parle : le bouton — dont l'étiquette
     * annonce « Quitter le mode vocal » — tombait dans la branche « démarrer »
     * et OUVRAIT le micro, en laissant la boucle en place. L'inverse exact de
     * ce qu'il promet, au seul moment où l'apiculteur cherche à reprendre la
     * main.
     */
    const maya = await monterEnModeVocal();
    await mayaRepond({ content: 'Tes douze ruches vont bien.' });
    expect(micOuvert(), 'elle parle, le micro est fermé').toBe(false);

    await wrapper!.find('.maya-mic').trigger('click');
    await nextTick();

    expect(maya.modeVocal, 'le mode vocal doit s’arrêter').toBe(false);
    expect(micOuvert(), 'et surtout : le micro ne doit PAS s’ouvrir').toBe(false);
  });

  it('fermer la bulle rend le micro', async () => {
    const maya = await monterEnModeVocal();
    expect(micOuvert()).toBe(true);
    maya.closeBubble();
    await nextTick();
    expect(maya.modeVocal).toBe(false);
    expect(micOuvert()).toBe(false);
  });
});

describe('⚠️ passer en arrière-plan ferme le micro', () => {
  /** Cache ou révèle l'onglet, comme le fait le navigateur. */
  async function masquer(cache: boolean): Promise<void> {
    Object.defineProperty(document, 'hidden', { value: cache, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();
    await nextTick();
  }

  it('l’onglet caché rend le micro et sort du mode vocal', async () => {
    /**
     * ⚠️ LE RÉVEIL AVAIT CE GARDE, LA BOUCLE NON. Elle gardait le micro ouvert
     * en arrière-plan, transcrivait ce qui se disait dans la pièce, envoyait
     * chaque énoncé comme une question — et pouvait ÉCRIRE sur un « oui »
     * adressé à quelqu'un d'autre. Le réglage, lui, promet noir sur blanc
     * « jamais en arrière-plan ni téléphone verrouillé ».
     */
    const maya = await monterEnModeVocal();
    expect(micOuvert()).toBe(true);

    await masquer(true);

    expect(micOuvert(), 'personne ne surveille cet écran').toBe(false);
    expect(maya.modeVocal, 'un mode vocal sans micro est un mensonge d’écran').toBe(false);
    await masquer(false);
  });

  it('revenir sur l’onglet NE rouvre PAS le micro', async () => {
    // Revenir n'est pas un accord. Rallumer sur ce geste-là, c'est « un micro
    // qui se rouvre tout seul » — la seule chose que ce dépôt refuse.
    const maya = await monterEnModeVocal();
    await masquer(true);
    await masquer(false);

    expect(micOuvert()).toBe(false);
    expect(maya.modeVocal).toBe(false);
  });

  it('l’onglet caché PENDANT que Maya parle ne rouvre pas le micro à la fin', async () => {
    /**
     * ⚠️ LA COURSE, ET C'EST ELLE QUI REND LE GARDE VIVANT. L'apiculteur met le
     * téléphone dans sa poche pendant que Maya répond. La parole se termine
     * quelques secondes plus tard et la boucle rouvre l'écoute — dans une poche.
     * Le garde de sortie ne suffit pas ici : la reprise est décidée APRÈS une
     * attente, et l'état a changé entre-temps.
     */
    await monterEnModeVocal();
    await mayaRepond({ content: 'Tes douze ruches vont bien.' });
    expect(micOuvert(), 'elle parle, le micro est fermé').toBe(false);

    await masquer(true);
    finirDeParler();
    await nextTick();
    await nextTick();

    expect(micOuvert(), 'la parole finit dans une poche : ne pas rouvrir').toBe(false);
    await masquer(false);
  });

  it('aucun énoncé entendu en arrière-plan ne part comme question', async () => {
    // Chaque énoncé entendu onglet caché consommait du quota et créait un fil
    // de conversation que l'apiculteur ne verrait jamais.
    await monterEnModeVocal();
    await masquer(true);
    dicter('combien de ruches ai-je', true);
    vi.advanceTimersByTime(2000);
    await nextTick();

    expect(demandes).toEqual([]);
    await masquer(false);
  });
});

describe('⚠️ une panne micro ne laisse pas un mode vocal fantôme', () => {
  it('quitte le mode vocal quand la dictée renonce', async () => {
    /**
     * ⚠️ L'EN-TÊTE MENTAIT. La dictée renonce (micro pris par une autre
     * application, service injoignable) et pose son message ; la boucle, elle,
     * restait « en mode vocal » — l'en-tête affichait « mode vocal · je
     * t'écoute » devant un micro éteint. L'apiculteur parlait dans le vide, et
     * rien à l'écran ne le démentait.
     */
    const maya = await monterEnModeVocal();
    expect(maya.modeVocal).toBe(true);

    // Le navigateur refuse le micro, définitivement.
    active()!.onerror?.({ error: 'not-allowed' });
    active()!.stop();
    vi.advanceTimersByTime(2000);
    await nextTick();
    await nextTick();

    expect(maya.modeVocal, 'un mode vocal sans micro est un mensonge d’écran').toBe(false);
  });
});

describe('⚠️ chaque réponse est dite UNE fois, et la suivante n’est pas tue', () => {
  it('ne relit pas la même bulle au tour suivant', async () => {
    // Sans garde, chaque fin de flux relisait la dernière bulle : Maya répétait
    // sa réponse à l'infini, et le micro se refermait à chaque fois.
    await monterEnModeVocal();
    await mayaRepond({ content: 'Tes douze ruches vont bien.' });
    finirDeParler();
    await nextTick();
    expect(paroles).toEqual(['Tes douze ruches vont bien.']);

    // Un tour qui ne produit AUCUNE bulle neuve (flux vide, réponse déjà là).
    streaming.value = true;
    await nextTick();
    streaming.value = false;
    await nextTick();
    await nextTick();

    expect(paroles, 'la même phrase deux fois donne une Maya bègue').toEqual([
      'Tes douze ruches vont bien.',
    ]);
  });

  it('une nouvelle conversation N’EST PAS tue par la garde', async () => {
    /**
     * ⚠️ LE REVERS EXACT. La garde « déjà dite » retient une RÉFÉRENCE de
     * bulle ; si on ne l'oublie pas à la fermeture, elle peut encore désigner
     * la dernière bulle au retour — et la première réponse de la conversation
     * suivante serait avalée en silence. Une Maya muette au premier mot est
     * pire qu'une Maya bègue : on la croit cassée.
     */
    const maya = await monterEnModeVocal();
    await mayaRepond({ content: 'Tes douze ruches vont bien.' });
    finirDeParler();
    await nextTick();

    maya.closeBubble();
    await nextTick();
    paroles = [];

    maya.ouvrirPourLaVoix();
    await nextTick();
    maya.livrerCommandeVocale('');
    await nextTick();
    // Le fil n'a pas bougé : la dernière bulle est la MÊME qu'avant la fermeture.
    streaming.value = true;
    await nextTick();
    streaming.value = false;
    await nextTick();
    await nextTick();

    expect(paroles, 'la conversation reprend, elle doit reparler').toEqual([
      'Tes douze ruches vont bien.',
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. « stop » — sortir du mode vocal sans toucher l'écran
// ═══════════════════════════════════════════════════════════════════════════

describe('on sort du mode vocal à la voix', () => {
  it('« stop » ferme le micro et le dit', async () => {
    // L'impasse visait exactement la personne pour qui le mode existe :
    // l'apiculteur qui a les mains dans une ruche.
    const maya = await monterEnModeVocal();
    dicter('stop', true);
    vi.advanceTimersByTime(2000);
    await nextTick();
    await nextTick();

    expect(maya.modeVocal).toBe(false);
    expect(paroles.join(' '), 'un arrêt muet ressemble à une panne').toMatch(/Salut Maya|laisse/i);
    expect(micOuvert()).toBe(false);
  });
});
