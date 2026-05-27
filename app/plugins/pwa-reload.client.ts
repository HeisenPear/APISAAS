/**
 * Plugin pwa-reload : mise à jour automatique et silencieuse du PWA.
 *
 * Deux mécanismes complémentaires :
 *
 * 1. controllerchange — quand le nouveau SW appelle clients.claim() pendant que
 *    la page est ouverte (app au premier plan ou en background iOS).
 *
 * 2. visibilitychange + reg.update() — quand l'utilisateur revient sur l'app
 *    après l'avoir mis en arrière-plan. On force le SW à re-vérifier sa version :
 *    s'il a changé (nouveau déploiement), il s'installe, skipWaiting (autoUpdate)
 *    l'active immédiatement, controllerchange se déclenche, la page recharge.
 *
 * Résultat : aucune action manuelle de la part de l'utilisateur.
 * Le reload est transparent — déclenché avant que l'utilisateur interagisse.
 */
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return;

  let reloading = false;
  function doReload() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  }

  // Mécanisme 1 : le nouveau SW vient de prendre le contrôle
  navigator.serviceWorker.addEventListener('controllerchange', doReload);

  // Mécanisme 2 : vérification active au retour sur l'app (iOS background → foreground)
  let lastUpdateCheck = 0;
  const UPDATE_THROTTLE = 60_000; // max une vérification par minute

  async function checkForUpdate() {
    const now = Date.now();
    if (now - lastUpdateCheck < UPDATE_THROTTLE) return;
    lastUpdateCheck = now;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      // Force le navigateur à re-fetcher sw.js et comparer avec la version active.
      // Si différent → nouveau SW installe → skipWaiting → controllerchange → doReload()
      await reg.update();
    } catch { /* réseau indisponible ou SW non enregistré */ }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });

  // Vérification différée au premier chargement — attend 4s que l'app soit hydratée
  // pour éviter un reload en plein milieu de l'initialisation Vue/Pinia
  setTimeout(checkForUpdate, 4000);
});
