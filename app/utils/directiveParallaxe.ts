import type { Directive, DirectiveBinding } from 'vue';

/**
 * `v-parallaxe` — l'élément dérive plus lentement que la page.
 *
 * C'est le procédé qui donne de la profondeur à une page produit : le sujet
 * monte moins vite que son texte, donc il semble être DERRIÈRE. L'amplitude se
 * compte en pixels de course totale, sur la traversée complète du champ.
 *
 *   <div v-parallaxe>…</div>       60 px de course (défaut)
 *   <div v-parallaxe="90">…</div>  90 px
 *   <div v-parallaxe="-40">…</div> dérive en sens inverse (au premier plan)
 *
 * Trois décisions de mise en œuvre :
 *
 *  · UN SEUL ÉCOUTEUR pour toute la page, pas un par élément. Le défilement est
 *    l'événement le plus bavard du navigateur ; y brancher dix écouteurs revient
 *    à payer dix fois la même lecture.
 *
 *  · rAF EN GARDE-BARRIÈRE. On ne calcule qu'une fois par image rendue. Sans
 *    cela, un défilement à la molette déclenche plusieurs dizaines de calculs
 *    entre deux images, tous jetés sauf le dernier.
 *
 *  · `getSSRProps` OBLIGATOIRE. Vue l'appelle sur chaque directive d'un gabarit
 *    rendu côté serveur ; son absence a déjà coûté une page d'accueil en 500.
 */

const AMPLITUDE_DEFAUT = 60;

interface Suivi {
  el: HTMLElement;
  amplitude: number;
}

const suivis = new Set<Suivi>();
let attache = false;
let imagePrevue = false;

function mouvementRefuse(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Position de l'élément dans sa traversée du champ, de -1 (il arrive par le bas)
 * à +1 (il sort par le haut). 0 quand son centre est au centre de l'écran.
 *
 * ⚠️ LE SIGNE PORTE L'EFFET, et il est contre-intuitif.
 *
 * Appliqué tel quel en `translate3d(0, p × amplitude, 0)`, il pousse l'élément
 * VERS LE HAUT quand il arrive par le bas, et vers le bas quand il sort par le
 * haut. Autrement dit il RETARDE l'élément sur le défilement de la page — c'est
 * ce retard qui le fait paraître plus loin, derrière le texte.
 *
 * Écrit dans l'autre sens (`centre - champ/2`), on obtient l'inverse exact :
 * l'élément va plus vite que la page et semble flotter au premier plan. C'est
 * l'erreur que j'avais faite, et elle ne casse rien — elle donne juste une
 * profondeur inversée, qu'on ressent sans savoir la nommer.
 */
export function progressionTraversee(haut: number, hauteur: number, champ: number): number {
  const centre = haut + hauteur / 2;
  const ecart = champ / 2 - centre;
  const course = (champ + hauteur) / 2;
  if (course <= 0) return 0;
  return Math.max(-1, Math.min(1, ecart / course));
}

function peindre(): void {
  imagePrevue = false;
  const champ = window.innerHeight;
  for (const s of suivis) {
    const boite = s.el.getBoundingClientRect();
    // Hors champ (avec une marge) : rien à peindre, on économise le style.
    if (boite.bottom < -champ || boite.top > champ * 2) continue;
    const p = progressionTraversee(boite.top, boite.height, champ);
    s.el.style.transform = `translate3d(0, ${(p * s.amplitude).toFixed(2)}px, 0)`;
  }
}

function auDefilement(): void {
  if (imagePrevue) return;
  imagePrevue = true;
  requestAnimationFrame(peindre);
}

function brancher(): void {
  if (attache) return;
  window.addEventListener('scroll', auDefilement, { passive: true });
  window.addEventListener('resize', auDefilement);
  attache = true;
  auDefilement();
}

function debrancher(): void {
  if (!attache || suivis.size) return;
  window.removeEventListener('scroll', auDefilement);
  window.removeEventListener('resize', auDefilement);
  attache = false;
}

export const directiveParallaxe: Directive<HTMLElement, number | undefined> = {
  getSSRProps: () => ({}),

  mounted(el: HTMLElement, binding: DirectiveBinding<number | undefined>) {
    if (mouvementRefuse() || typeof requestAnimationFrame === 'undefined') return;
    const amplitude = typeof binding.value === 'number' ? binding.value : AMPLITUDE_DEFAUT;
    const suivi: Suivi = { el, amplitude };
    suivis.add(suivi);
    (el as HTMLElement & { _par?: Suivi })._par = suivi;
    brancher();
  },

  unmounted(el: HTMLElement & { _par?: Suivi }) {
    if (el._par) suivis.delete(el._par);
    el._par = undefined;
    el.style.transform = '';
    debrancher();
  },
};
