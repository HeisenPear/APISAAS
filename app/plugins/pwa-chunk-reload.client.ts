/**
 * Rechargement automatique sur chunk manquant après un déploiement.
 *
 * PROBLÈME résolu : le PWA installé garde en mémoire une ANCIENNE version. Après
 * un déploiement, les chunks JS hashés de cette version sont supprimés du CDN.
 * Dès que l'app tente d'en charger un (navigation SPA, composant lazy, import
 * dynamique) → `ChunkLoadError` / `Failed to fetch dynamically imported module`
 * → écran cassé. L'utilisateur croit alors devoir DÉSINSTALLER puis réinstaller
 * le PWA. En réalité il suffit de recharger en dur pour récupérer le HTML + les
 * chunks de la dernière version.
 *
 * Ici on intercepte ces erreurs et on recharge UNE fois, avec deux garde-fous :
 *  - `navigator.onLine` : hors-ligne, recharger ne sert à rien (le CDN est
 *    injoignable) et pouvait créer une BOUCLE infinie de reload (bug iOS déjà
 *    rencontré, cf. pwa-reload.client.ts). Hors-ligne → on ne touche à rien, le
 *    SW continue de servir sa version cohérente en cache.
 *  - cooldown (sessionStorage) : si on vient de recharger, on ne reboucle pas.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  const RELOAD_KEY = 'apigo_chunk_reload_at';
  const COOLDOWN_MS = 20_000;

  function hardReloadOnce(): void {
    if (!navigator.onLine) return; // hors-ligne : ne jamais boucler
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? '0');
      if (Date.now() - last < COOLDOWN_MS) return; // déjà rechargé récemment
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      /* sessionStorage indisponible (mode privé strict) : on recharge quand même */
    }
    // Recharge en dur : récupère le HTML + chunks de la dernière version déployée.
    window.location.reload();
  }

  const CHUNK_ERR_RE =
    /Loading chunk|ChunkLoadError|Loading CSS chunk|error loading dynamically imported module|Failed to fetch dynamically imported module|Importing a module script failed/i;

  // 1. Hook Nuxt : erreur de chargement d'un chunk pendant une navigation SPA.
  nuxtApp.hook('app:chunkError', () => hardReloadOnce());

  // 2. Vite : échec de préchargement d'un module (import() d'un composant lazy).
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    hardReloadOnce();
  });

  // 3. Filet : erreurs de script non catchées mentionnant un chunk manquant.
  window.addEventListener('error', (event) => {
    if (CHUNK_ERR_RE.test(event.message ?? '')) hardReloadOnce();
  });

  // 4. Filet : promesses rejetées (import dynamique échoué non catché).
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message ?? '');
    if (CHUNK_ERR_RE.test(msg)) hardReloadOnce();
  });
});
