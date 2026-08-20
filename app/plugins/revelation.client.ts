import { directiveRevelation } from '~/utils/directiveRevelation';

/**
 * Enregistre `v-reveal`. La logique vit dans `app/utils/directiveRevelation.ts`
 * — un plugin Nuxt ne s'exerce pas depuis un banc, une directive exportée si.
 *
 * Usage :
 *   <div v-reveal>…</div>          révélation à l'entrée dans le champ
 *   <div v-reveal="120">…</div>    120 ms de retard
 *   <ul v-reveal.cascade>…</ul>    chaque enfant direct décalé de 70 ms
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', directiveRevelation);
});
