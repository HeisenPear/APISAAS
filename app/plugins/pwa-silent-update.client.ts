/**
 * Mise à jour silencieuse du service worker.
 *
 * Objectif UX : l'utilisateur doit toujours être sur la dernière version dès
 * qu'il (re)charge le site, sans bandeau « recharger ? » ni reload forcé en
 * pleine utilisation, tout en gardant le mode hors-ligne fonctionnel.
 *
 * Comment ça marche :
 *  - Les pages HTML sont servies en NetworkFirst (cf. nuxt.config workbox) :
 *    une connexion EN LIGNE récupère donc déjà le HTML + les assets hashés les
 *    plus récents. On n'a jamais besoin de recharger pour « être à jour ».
 *  - Le service worker ne sert qu'au cache hors-ligne. Quand un nouveau SW est
 *    détecté, on l'active en silence (skipWaiting + clientsClaim via
 *    updateServiceWorker(false), SANS reload) pour que le cache hors-ligne
 *    reflète la dernière version à la prochaine ouverture.
 *  - Hors-ligne : aucune mise à jour possible, le SW existant continue de
 *    servir le cache → rien n'est cassé.
 *
 * On vérifie aussi les mises à jour au retour de focus / online, pour qu'une
 * session longue rafraîchisse son cache sans attendre la prochaine ouverture.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const nuxtApp = useNuxtApp();
  // $pwa est injecté par @vite-pwa/nuxt (peut être absent si SW désactivé).
  const pwa = nuxtApp.$pwa as
    | {
        needRefresh?: boolean;
        updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
      }
    | undefined;
  if (!pwa) return;

  // Applique en silence dès qu'une nouvelle version attend (pas de reload).
  watch(
    () => pwa.needRefresh,
    (need) => {
      if (need) pwa.updateServiceWorker?.(false).catch(() => {});
    },
    { immediate: true },
  );
});
