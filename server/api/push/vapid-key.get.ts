/**
 * GET /api/push/vapid-key — expose la clé publique VAPID.
 *
 * Sert au service worker pour se ré-abonner tout seul dans le handler
 * `pushsubscriptionchange` (le SW n'a pas accès à la runtime config Nuxt).
 * La clé PUBLIQUE est déjà exposée au client via la config runtime : aucun
 * secret ici. Pas d'auth requise (nécessaire quand le SW tourne sans onglet).
 */
export default defineEventHandler(() => {
  const cfg = useRuntimeConfig();
  return { key: (cfg.public?.vapidPublicKey as string) || '' };
});
