import { directiveParallaxe } from '~/utils/directiveParallaxe';
import { directiveRevelation } from '~/utils/directiveRevelation';

/**
 * Enregistre `v-reveal`, SUR LES DEUX CÔTÉS.
 *
 * Ce fichier s'est d'abord appelé `revelation.client.ts`. La directive n'existait
 * donc pas au rendu serveur, et Vue — qui appelle `getSSRProps` sur chaque
 * directive d'un gabarit — plantait sur `undefined` : 500 sur la page d'accueil.
 * Une directive utilisée dans un gabarit rendu côté serveur doit être connue du
 * serveur, même si tout son travail se fait au montage client.
 *
 * La logique vit dans `app/utils/directiveRevelation.ts` — un plugin Nuxt ne
 * s'exerce pas depuis un banc, une directive exportée si.
 *
 * Usage :
 *   <div v-reveal>…</div>          révélation à l'entrée dans le champ
 *   <div v-reveal="120">…</div>    120 ms de retard
 *   <ul v-reveal.cascade>…</ul>    chaque enfant direct décalé de 70 ms
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', directiveRevelation);
  nuxtApp.vueApp.directive('parallaxe', directiveParallaxe);
});
