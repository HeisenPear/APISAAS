export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Skip for public pages and onboarding itself
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/reset-password',
    '/confirm',
    '/onboarding',
    '/activer-essai',
    '/tarifs',
  ];
  if (publicPaths.includes(to.path)) return;

  // Pas authentifié : le module Supabase ne redirige plus lui-même pendant le
  // SSR (cf. nuxt.config.ts, redirect: false — son check faisait un aller-
  // retour réseau vers l'API Auth pendant le SSR, peu fiable : un aléa y
  // déconnectait des utilisateurs pourtant bien connectés à chaque refresh).
  // On ne force la redirection QUE côté client, une fois que
  // auth-persist.client.ts a restauré la session de façon fiable (cold-start
  // safe) — jamais pendant le SSR, où un faux négatif est trop coûteux.
  if (!user.value) {
    if (import.meta.server) return;
    const { redirectOptions } = useRuntimeConfig().public.supabase;
    const isProtected = redirectOptions.include?.some((pattern: string) =>
      new RegExp(`^${pattern.replace(/\*/g, '.*')}$`).test(to.path),
    );
    if (isProtected) return navigateTo(redirectOptions.login);
    return;
  }

  // Fetch profil if needed
  const authStore = useAuthStore();
  if (!authStore.profil) {
    try {
      await authStore.fetchProfil();
    } catch {
      return;
    }
  }

  // If profil could not be loaded, redirect to login (not onboarding)
  if (!authStore.profil) {
    return navigateTo('/login');
  }

  // Redirect to onboarding if not complete
  if (!authStore.isOnboarded) {
    return navigateTo('/onboarding');
  }
});
