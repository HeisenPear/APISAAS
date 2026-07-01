import { ensureFreshPushSubscription } from '~/composables/useWebPush';

/**
 * Re-synchronisation automatique de l'abonnement Web Push.
 *
 * Corrige la perte silencieuse des notifications après un déploiement : quand le
 * service worker est remplacé (ou que le navigateur/iOS fait tourner
 * l'abonnement), l'endpoint stocké côté serveur meurt (410) et l'utilisateur
 * cesse de recevoir ses alertes sans s'en rendre compte.
 *
 * Ici, dès qu'un utilisateur est connecté puis à chaque retour sur l'app, on
 * renvoie SILENCIEUSEMENT l'endpoint courant au serveur (seulement si la
 * permission est déjà accordée — jamais de prompt). Le serveur a donc toujours
 * un abonnement vivant : plus besoin de se reconnecter pour être prévenu.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const key = (config.public.vapidPublicKey as string) || '';
  if (!key) return;

  const auth = useAuthStore();
  const resync = () => {
    if (auth.profil?.id) void ensureFreshPushSubscription(key);
  };

  // Au login (et si déjà connecté au chargement).
  watch(
    () => auth.profil?.id,
    (id) => id && void ensureFreshPushSubscription(key),
    {
      immediate: true,
    },
  );

  // Au retour sur l'app (reprise d'onglet / PWA rouverte).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resync();
  });
});
