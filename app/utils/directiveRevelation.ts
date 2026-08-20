import type { Directive, DirectiveBinding } from 'vue';

/**
 * `v-reveal` — révélation au défilement.
 *
 * L'élément part légèrement plus bas et transparent, puis se pose quand il entre
 * dans le champ. C'est la mécanique de base des pages produit soignées : on ne
 * voit jamais un bloc « apparaître », on le voit ARRIVER.
 *
 * Vit ici, et non dans le plugin, pour être exerçable par un banc : le mode de
 * panne à surveiller — un élément qui reste masqué pour toujours — est muet.
 * Rien ne le signale, ni erreur ni avertissement ; on découvre juste une page
 * vide. C'est exactement le genre de défaut qui mérite un test.
 */

/** Retard entre deux enfants successifs, en mode `.cascade`. */
export const CASCADE_MS = 70;

export function mouvementRefuse(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type ElementObserve = HTMLElement & { _rev?: IntersectionObserver };

export const directiveRevelation: Directive<ElementObserve, number | undefined> = {
  mounted(el: ElementObserve, binding: DirectiveBinding<number | undefined>) {
    /**
     * DEUX SORTIES AVANT DE MASQUER QUOI QUE CE SOIT.
     *
     * On ne pose `.rev` — qui met l'opacité à zéro — que si l'on a de quoi la
     * retirer ensuite. Sans IntersectionObserver, ou avec « réduire les
     * animations », l'élément reste tel quel : visible. Masquer d'abord et
     * espérer pouvoir démasquer serait parier le contenu sur une capacité qu'on
     * n'a pas vérifiée.
     */
    if (mouvementRefuse() || typeof IntersectionObserver === 'undefined') return;

    const retard = typeof binding.value === 'number' ? binding.value : 0;
    const cibles: HTMLElement[] = binding.modifiers.cascade
      ? (Array.from(el.children) as HTMLElement[])
      : [el];

    for (const c of cibles) c.classList.add('rev');

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (!entree.isIntersecting) continue;
          cibles.forEach((c, i) => {
            const ms = retard + (binding.modifiers.cascade ? i * CASCADE_MS : 0);
            if (ms) c.style.transitionDelay = `${ms}ms`;
            c.classList.add('rev-on');
          });
          // UNE SEULE FOIS : un bloc qui se rejoue quand on remonte donne le mal
          // de mer, et sur une page longue on remonte souvent.
          observateur.disconnect();
        }
      },
      // Seuil bas, marge basse : le mouvement doit être FINI quand l'œil arrive
      // dessus, pas commencer à ce moment-là.
      { threshold: 0.12, rootMargin: '0px 0px -100px 0px' },
    );

    observateur.observe(el);
    el._rev = observateur;
  },

  unmounted(el: ElementObserve) {
    el._rev?.disconnect();
    el._rev = undefined;
  },
};
