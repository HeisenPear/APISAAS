import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { DirectiveBinding } from 'vue';
import { directiveRevelation, CASCADE_MS } from '~/utils/directiveRevelation';

/**
 * Le mode de panne à surveiller est MUET.
 *
 * `v-reveal` met l'opacité à zéro puis compte sur un IntersectionObserver pour
 * la rendre. Si l'observateur n'existe pas, ou si la révélation ne part jamais,
 * il ne se passe rien de visible côté console : pas d'erreur, pas
 * d'avertissement. On découvre une page blanche, en production, sans indice.
 *
 * D'où ces bancs : ils vérifient qu'on ne masque JAMAIS sans pouvoir démasquer.
 */

type Rappel = (entrees: Array<{ isIntersecting: boolean }>) => void;

let rappels: Rappel[] = [];
let deconnexions = 0;
let ObserverOriginal: typeof IntersectionObserver | undefined;
let matchMediaOriginal: typeof window.matchMedia | undefined;

/** Faux observateur : on garde le rappel sous la main pour le déclencher nous-même. */
class FauxObserver {
  constructor(rappel: Rappel) {
    rappels.push(rappel);
  }
  observe() {}
  disconnect() {
    deconnexions += 1;
  }
}

function poserMatchMedia(reduit: boolean) {
  window.matchMedia = ((requete: string) => ({
    matches: reduit && requete.includes('reduce'),
    media: requete,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

function monter(el: HTMLElement, binding: Partial<DirectiveBinding> = {}) {
  const complet = {
    value: undefined,
    oldValue: undefined,
    arg: undefined,
    modifiers: {},
    instance: null,
    dir: {},
    ...binding,
  } as DirectiveBinding;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (directiveRevelation.mounted as any)?.(el, complet, null, null);
}

beforeEach(() => {
  rappels = [];
  deconnexions = 0;
  ObserverOriginal = globalThis.IntersectionObserver;
  matchMediaOriginal = window.matchMedia;
  globalThis.IntersectionObserver = FauxObserver as unknown as typeof IntersectionObserver;
  poserMatchMedia(false);
});

afterEach(() => {
  globalThis.IntersectionObserver = ObserverOriginal as typeof IntersectionObserver;
  if (matchMediaOriginal) window.matchMedia = matchMediaOriginal;
  vi.restoreAllMocks();
});

describe('v-reveal — on ne masque jamais sans pouvoir démasquer', () => {
  it('ne masque RIEN quand IntersectionObserver n’existe pas', () => {
    // @ts-expect-error — on simule un navigateur sans l'API.
    delete globalThis.IntersectionObserver;
    const el = document.createElement('div');
    monter(el);
    expect(
      el.classList.contains('rev'),
      'sans observateur, la classe qui masque ne doit jamais être posée',
    ).toBe(false);
  });

  it('ne masque RIEN quand l’apiculteur a demandé moins d’animations', () => {
    poserMatchMedia(true);
    const el = document.createElement('div');
    monter(el);
    expect(el.classList.contains('rev')).toBe(false);
    expect(rappels.length, 'aucun observateur ne devrait être créé').toBe(0);
  });

  it('masque puis révèle quand tout est disponible', () => {
    const el = document.createElement('div');
    monter(el);
    expect(el.classList.contains('rev')).toBe(true);
    expect(el.classList.contains('rev-on')).toBe(false);

    rappels[0]!([{ isIntersecting: true }]);
    expect(el.classList.contains('rev-on')).toBe(true);
  });

  it('ne révèle pas tant que l’élément n’est pas entré dans le champ', () => {
    const el = document.createElement('div');
    monter(el);
    rappels[0]!([{ isIntersecting: false }]);
    expect(el.classList.contains('rev-on')).toBe(false);
  });

  it('se débranche après la révélation — une seule fois, jamais rejouée', () => {
    const el = document.createElement('div');
    monter(el);
    rappels[0]!([{ isIntersecting: true }]);
    expect(deconnexions).toBe(1);
  });
});

describe('v-reveal — cascade et retard', () => {
  it('décale chaque enfant direct en mode cascade', () => {
    const el = document.createElement('ul');
    for (let i = 0; i < 3; i++) el.appendChild(document.createElement('li'));
    monter(el, { modifiers: { cascade: true } });

    const enfants = Array.from(el.children) as HTMLElement[];
    expect(enfants.every((c) => c.classList.contains('rev'))).toBe(true);
    // Le parent lui-même n'est pas masqué : c'est le conteneur, pas le contenu.
    expect(el.classList.contains('rev')).toBe(false);

    rappels[0]!([{ isIntersecting: true }]);
    expect(enfants.map((c) => c.style.transitionDelay)).toEqual([
      '',
      `${CASCADE_MS}ms`,
      `${CASCADE_MS * 2}ms`,
    ]);
  });

  it('applique le retard donné en valeur', () => {
    const el = document.createElement('div');
    monter(el, { value: 240 });
    rappels[0]!([{ isIntersecting: true }]);
    expect(el.style.transitionDelay).toBe('240ms');
  });

  it('cumule retard et cascade', () => {
    const el = document.createElement('ul');
    for (let i = 0; i < 2; i++) el.appendChild(document.createElement('li'));
    monter(el, { value: 100, modifiers: { cascade: true } });
    rappels[0]!([{ isIntersecting: true }]);

    const enfants = Array.from(el.children) as HTMLElement[];
    expect(enfants.map((c) => c.style.transitionDelay)).toEqual(['100ms', `${100 + CASCADE_MS}ms`]);
  });
});
