/**
 * Plugin pwa-reload : mise à jour silencieuse du SW.
 *
 * Le sw.js a Cache-Control: max-age=0 — le navigateur le revalide automatiquement
 * à chaque navigation. Plus besoin de reg.update() agressif.
 *
 * On supprime le doReload() automatique sur controllerchange :
 * il forçait un reload page entière sur mobile exactement quand le nouveau SW
 * s'installait (~4s après le chargement), causant un cache vide → timeout réseau
 * → navigateFallback → /offline → boucle infinie → crash iOS.
 *
 * Le nouveau SW prend le contrôle silencieusement sur la prochaine navigation.
 */
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return;

  // Vérification au retour sur l'app — laisse le navigateur détecter les mises à jour
  // sans forcer un reload destructeur. Le SW s'installe en arrière-plan.
  let lastUpdateCheck = 0;
  const UPDATE_THROTTLE = 5 * 60_000; // max une vérif toutes les 5 min

  async function checkForUpdate() {
    const now = Date.now();
    if (now - lastUpdateCheck < UPDATE_THROTTLE) return;
    lastUpdateCheck = now;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    } catch { /* réseau indisponible */ }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
});
