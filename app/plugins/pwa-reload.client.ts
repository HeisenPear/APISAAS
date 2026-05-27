/**
 * Plugin pwa-reload : force le rechargement de la page quand un nouveau Service Worker
 * prend le contrôle (après mise à jour de l'app).
 *
 * Sans ça, sur iOS, le nouveau SW s'installe silencieusement mais la page continue
 * de servir les anciens fichiers JS depuis la mémoire — design obsolète visible.
 *
 * Le reload se déclenche une seule fois par mise à jour, de manière invisible pour
 * l'utilisateur (pas de prompt, pas d'interruption visible).
 */
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return;

  // 'controllerchange' se déclenche quand le nouveau SW appelle clients.claim()
  // C'est le signal fiable que le nouveau code est actif et que les assets ont changé
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
});
