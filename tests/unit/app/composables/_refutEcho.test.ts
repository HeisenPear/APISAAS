// SONDE DE RÉFUTATION (temporaire) — le micro reste-t-il OUVERT après `surEnonce` ?
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  computed,
  effectScope,
  getCurrentInstance,
  onScopeDispose,
  ref,
  watch,
  type EffectScope,
} from 'vue';

interface FausseReco {
  continuous: boolean;
  interimResults: boolean;
  demarree: boolean;
  start(): void;
  stop(): void;
  abort(): void;
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
const active = (): FausseReco => sessions[sessions.length - 1]!;
function parler(texte: string, final: boolean): void {
  const r = active();
  if (!r.demarree) return; // une session arrêtée ne livre rien
  if (!final && !r.interimResults) return;
  r.onresult?.({
    resultIndex: 0,
    results: { length: 1, 0: { length: 1, isFinal: final, 0: { transcript: texte } } },
  });
}
let portee: EffectScope | null = null;
let mayaModule: typeof import('~~/app/stores/maya') | null = null;
beforeEach(async () => {
  mayaModule = await import('~~/app/stores/maya');
  vi.useFakeTimers();
  sessions = [];
  setActivePinia(createPinia());
  vi.stubGlobal('ref', ref);
  vi.stubGlobal('computed', computed);
  vi.stubGlobal('watch', watch);
  vi.stubGlobal('getCurrentInstance', getCurrentInstance);
  vi.stubGlobal('onScopeDispose', onScopeDispose);
  vi.stubGlobal('onMounted', (f: () => void) => f());
  vi.stubGlobal('useToast', () => ({ add: () => {} }));
  vi.stubGlobal('SpeechRecognition', fabriqueReco());
  vi.stubGlobal('useMayaStore', () => mayaModule!.useMayaStore());
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
function monter<T>(f: () => T): T {
  portee = effectScope();
  return portee.run(f)!;
}

describe('sonde : le micro après un énoncé', () => {
  it('GARDE-FOU — le double est bien branché et surEnonce se déclenche', async () => {
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    expect(d.supporte).toBe(true);
    const enonces: string[] = [];
    d.demarrer(() => {}, { surEnonce: (t) => enonces.push(t) });
    parler('je crée le client jean', true);
    vi.advanceTimersByTime(1200);
    expect(enonces, 'sans énoncé livré, tout le reste serait vacuement vert').toEqual([
      'je crée le client jean',
    ]);
  });

  it('LE MICRO RESTE OUVERT après surEnonce — rien dans la dictée ne le ferme', async () => {
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    const enonces: string[] = [];
    d.demarrer(() => {}, { surEnonce: (t) => enonces.push(t) });
    parler('non', true);
    vi.advanceTimersByTime(1200);
    expect(enonces).toEqual(['non']);
    // C'est ICI que le composant appellerait `voix.dire(...)`. Le micro est-il fermé ?
    expect(active().continuous, 'la session écoute en continu').toBe(true);
    expect(d.actif.value, 'la dictée se croit-elle encore active ?').toBe(true);
    expect(active().demarree, 'LE MICRO EST-IL ENCORE OUVERT pendant que Maya parle ?').toBe(true);
  });

  it('L’ÉCHO EST CONSOMMÉ — Maya s’entend et son propre mot repart en énoncé', async () => {
    const { useDictee } = await import('~~/app/composables/useDictee');
    const d = monter(() => useDictee());
    const enonces: string[] = [];
    d.demarrer(() => {}, { surEnonce: (t) => enonces.push(t) });
    parler('non', true);
    vi.advanceTimersByTime(1200);
    // Maya parle dans le micro resté ouvert. Le moteur ne capte que le début.
    parler('d accord', true);
    vi.advanceTimersByTime(1200);
    expect(enonces, 'la voix de Maya revient comme un énoncé de l’apiculteur').toEqual([
      'non',
      'd accord',
    ]);
  });
});
