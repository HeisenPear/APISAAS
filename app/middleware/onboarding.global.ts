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
    // On mémorise la page demandée : après connexion, l'utilisateur y revient
    // au lieu d'être renvoyé sur le tableau de bord.
    if (isProtected) {
      return navigateTo({ path: redirectOptions.login, query: { redirect: to.fullPath } });
    }
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

  // Profil illisible : NE JAMAIS trancher pendant le SSR. Un aléa réseau y
  // déconnectait l'utilisateur à chaque rechargement de page (F5), alors que
  // sa session était parfaitement valide. Côté client, le profil est rechargé
  // par auth-persist ; on ne renvoie vers /login qu'en dernier recours, en
  // conservant la page en cours pour y revenir après connexion.
  if (!authStore.profil) {
    if (import.meta.server) return;
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Redirect to onboarding if not complete.
  if (!authStore.isOnboarded) {
    // Cas critique : un client qui vient de PAYER (retour Stripe sur
    // /parametres/abonnement?success=1 ou /activer-essai) mais dont l'onboarding
    // n'est pas encore marqué complet. Sans ce garde, on le renvoyait vers
    // /onboarding en PERDANT le signal de paiement → l'onboarding ne savait pas
    // qu'il venait de s'abonner et pouvait lui redemander de choisir/payer un
    // plan (erreur de redirection vécue par un client Expert payant). On préserve
    // le signal en le passant à l'onboarding, qui reprend alors au bon endroit
    // (waitForPlanActive → construction du rucher).
    const vientDePayer =
      to.query.success != null || to.query.checkout === 'success' || to.query.trial === 'activated';
    if (vientDePayer) {
      return navigateTo('/onboarding?checkout=success');
    }
    return navigateTo('/onboarding');
  }
});
