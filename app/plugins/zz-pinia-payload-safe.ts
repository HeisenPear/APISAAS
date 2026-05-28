import { shouldHydrate as piniaShouldHydrate } from 'pinia';

/**
 * Patch defensif du payload reducer "skipHydrate" enregistre par @pinia/nuxt.
 *
 * Probleme : pinia.prod.cjs:231 appelle `obj.hasOwnProperty(skipHydrateSymbol)`
 * directement, sans `Object.prototype.hasOwnProperty.call(...)`. Si un objet
 * du payload est cree via `Object.create(null)` (ou un objet sans prototype),
 * la methode `hasOwnProperty` n'existe pas et l'appel jette TypeError.
 *
 * Le crash se propage : Nuxt tente alors de rendre la page d'erreur, qui
 * elle aussi serialise le payload Pinia → re-crash → 500. Ca s'observait
 * sur des 404 simples comme `/apple-touch-icon-120x120.png` demande par
 * iOS Safari.
 *
 * Solution : on override le reducer skipHydrate avec une version qui catch
 * les exceptions ou pre-verifie la presence de hasOwnProperty. L'override
 * marche parce que `definePayloadReducer` stocke par cle dans une Map —
 * un second appel remplace le premier. On nomme ce plugin `zz-…` pour
 * garantir qu'il s'execute APRES `@pinia/nuxt/payload-plugin`.
 */
function safeShouldHydrate(data: unknown): boolean {
  // Non-objet ou null → hydrater normalement (comportement Pinia par defaut)
  if (data === null || typeof data !== 'object') return true;

  // Si pas de hasOwnProperty (Object.create(null), Map, Set…), on considere
  // que c'est hydratable. C'est le comportement le plus safe : on ne masque
  // pas l'objet, on le laisse passer dans la serialisation devalue.
  if (typeof (data as { hasOwnProperty?: unknown }).hasOwnProperty !== 'function') {
    return true;
  }

  try {
    return piniaShouldHydrate(data);
  } catch {
    // Defense en profondeur : si Pinia jette pour une autre raison,
    // on laisse passer plutot que de planter tout le SSR
    return true;
  }
}

export default defineNuxtPlugin({
  name: 'pinia-payload-safe',
  // S'execute apres le plugin Pinia
  dependsOn: ['pinia'],
  setup() {
    // Override server-side (la ou les reducers sont stockes)
    definePayloadReducer('skipHydrate', (data: unknown) => !safeShouldHydrate(data) && 1);
    definePayloadReviver('skipHydrate', () => undefined);
  },
});
