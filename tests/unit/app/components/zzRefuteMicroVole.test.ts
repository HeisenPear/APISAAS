// SONDE DE RÉFUTATION — TEMPORAIRE, SUPPRIMÉE EN FIN DE PASSE. Ne pas commiter.
// Question posée : « micro volé par une autre application pendant la boucle
// vocale → l'apiculteur reste-t-il devant un en-tête qui affiche encore
// "mode vocal" avec un micro éteint ? »
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

interface FausseReco {
  interimResults: boolean;
  demarree: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onresult: ((e: { resultIndex: number; results: unknown }) => void) | null;
}
let sessions: FausseReco[] = [];
/** Micro PRIS par une autre application : la session meurt aussitôt née. */
let micVole = false;
/** Variante : elle meurt sans même un code d'erreur. */
let sansCode = false;

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
      if (micVole) {
        this.demarree = false;
        if (!sansCode) this.onerror?.({ error: 'aborted' });
        this.onend?.();
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
const micOuvert = (): boolean => sessions.some((s) => s.demarree);
const active = (): FausseReco | undefined => sessions[sessions.length - 1];

let paroles: string[] = [];
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
function finirDeParler(): void {
  const liste = enCours;
  enCours = [];
  for (const u of liste) u.onend?.();
}

type Bulle = { role: 'user' | 'assistant'; content: string; pending?: unknown };
let messages: ReturnType<typeof ref<Bulle[]>>;
let streaming: ReturnType<typeof ref<boolean>>;
let erreurCopilote: ReturnType<typeof ref<{ message: string } | null>>;
let wrapper: VueWrapper | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  sessions = [];
  paroles = [];
  enCours = [];
  micVole = false;
  sansCode = false;
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

const MUTEE = '~~/tests/_sonde-tmp/MayaBubbleMutee.vue';

async function monterEnModeVocal(chemin?: string) {
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
    envoyer: () => Promise.resolve(),
    confirmerAction: () => {},
    annulerAction: () => {},
    annulerEcriture: () => {},
    confirmerPlan: () => {},
    annulerPlanProposition: () => {},
    annulerLotExecute: () => {},
    reset: () => {},
  }));
  const MayaBubble = chemin
    ? (await import(/* @vite-ignore */ chemin)).default
    : (await import('~~/app/components/ia/MayaBubble.vue')).default;
  wrapper = mount(MayaBubble, { shallow: true });
  const maya = useMayaStore();
  maya.ouvrirPourLaVoix();
  await nextTick();
  maya.livrerCommandeVocale('');
  await nextTick();
  await nextTick();
  return maya;
}

/** Ce que l'apiculteur VOIT, plus l'état du micro. */
function ecran(maya: { modeVocal: boolean }) {
  const texte = wrapper!.text();
  return {
    modeVocal: maya.modeVocal,
    micOuvert: micOuvert(),
    sessions: sessions.length,
    enTeteDitModeVocal: /mode vocal/.test(texte),
    enTeteDitPrete: /Prête à aider/.test(texte),
    ligneRienEntendu: /Je n’ai rien entendu/.test(texte),
  };
}

async function tempsQuiPasse(ms: number, pas = 300) {
  for (let t = 0; t < ms; t += pas) {
    vi.advanceTimersByTime(pas);
    await nextTick();
  }
  await nextTick();
  await nextTick();
}

describe('R · le micro est repris par une autre application', () => {
  it('R1 · garde-fou : la boucle écoute avant le vol', async () => {
    const maya = await monterEnModeVocal();
    expect(maya.modeVocal).toBe(true);
    expect(micOuvert(), 'sans micro ouvert au départ, tout ce fichier serait vide').toBe(true);
  });

  it('R2 · scénario EXACT du signalement (aucun mot entendu avant le vol)', async () => {
    const maya = await monterEnModeVocal();
    await mayaRepondEtSeTait();
    expect(micOuvert(), 'garde-fou : la boucle réécoute après la réponse').toBe(true);

    micVole = true;
    active()!.stop();
    await tempsQuiPasse(3_000);
    console.log('R2 · micro volé, relances épuisées :', JSON.stringify(ecran(maya)));

    micVole = false;
    await tempsQuiPasse(60_000, 1_000);
    console.log('R2 · micro rendu :', JSON.stringify(ecran(maya)));
  });

  it('R3 · le même relevé SANS rendre la main à Vue', async () => {
    const maya = await monterEnModeVocal();
    micVole = true;
    active()!.stop();
    for (let i = 0; i < 10; i++) vi.advanceTimersByTime(300);
    console.log(
      'R3 · sans tick :',
      JSON.stringify({ modeVocal: maya.modeVocal, mic: micOuvert() }),
    );
    await nextTick();
    await nextTick();
    console.log(
      'R3 · après tick :',
      JSON.stringify({ modeVocal: maya.modeVocal, mic: micOuvert() }),
    );
  });

  it('R4 · vol APRÈS un mot entendu (aEntendu = vrai)', async () => {
    const maya = await monterEnModeVocal();
    const r = active()!;
    r.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { length: 1, isFinal: false, 0: { transcript: 'euh' } } },
    });
    await nextTick();
    micVole = true;
    r.stop();
    await tempsQuiPasse(3_000);
    console.log('R4 · entendu puis volé :', JSON.stringify(ecran(maya)));
  });

  it('R6 · MUTATION : la même scène sur une bulle privée de sa sortie de secours', async () => {
    // Preuve que cette sonde N’EST PAS AVEUGLE : si l’observateur de panne micro
    // n’existait pas, elle verrait exactement ce que décrit le signalement.
    const maya = await monterEnModeVocal(MUTEE);
    expect(micOuvert(), 'garde-fou : la bulle mutée écoute aussi').toBe(true);
    micVole = true;
    active()!.stop();
    await tempsQuiPasse(3_000);
    console.log('R6 · muté :', JSON.stringify(ecran(maya)));
  });

  it('R5 · vol sans le moindre code d’erreur', async () => {
    const maya = await monterEnModeVocal();
    sansCode = true;
    micVole = true;
    active()!.stop();
    await tempsQuiPasse(3_000);
    console.log('R5 · sans code :', JSON.stringify(ecran(maya)));
  });
});

async function mayaRepondEtSeTait() {
  streaming.value = true;
  await nextTick();
  messages.value = [
    ...messages.value,
    { role: 'assistant', content: 'Tes douze ruches vont bien.' },
  ];
  streaming.value = false;
  await nextTick();
  await nextTick();
  finirDeParler();
  await nextTick();
  await nextTick();
}
