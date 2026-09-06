/**
 * Plugin auth-persist : restaure et rafraîchit la session au démarrage de l'app.
 *
 * Politique « connecté en continu » (comme la plupart des SaaS) : la session
 * persiste tant que l'utilisateur ne clique pas explicitement sur Déconnexion
 * (cookie longue durée défini dans nuxt.config + auto-refresh du token Supabase).
 * On ne déconnecte JAMAIS à la fermeture du navigateur.
 *
 * Fix PWA/SSR : on force getSession() en premier pour que Supabase restaure et
 * rafraîchisse le token d'accès (expiré après 1h) AVANT que le middleware lise
 * useSupabaseUser(). Sans ça, le PWA flashe « déconnecté » / redirige vers /login
 * à chaque cold start après 1h d'inactivité.
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient();
  const authStore = useAuthStore();
  const router = useRouter();

  // Restaure la session depuis le stockage ; Supabase rafraîchit le token si
  // expiré — critique pour les cold starts PWA.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Refresh token invalide (révoqué, expiré, ou storage corrompu) → on nettoie
  // pour éviter les boucles de refresh côté serveur et les erreurs répétées.
  if (sessionError?.message?.includes('Refresh Token')) {
    await supabase.auth.signOut();
    return;
  }

  // Session restaurée : charge le profil maintenant (évite un aller-retour API
  // au premier chargement d'une page protégée).
  if (session && !authStore.profil) {
    authStore.fetchProfil().catch(() => {});
  }

  // Sessions révoquées/expirées côté serveur → on remet l'app à zéro et on
  // renvoie vers /login uniquement si on est sur une page protégée.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      authStore.reset();
      // Session révoquée/expirée : on purge aussi les données mises en cache.
      void purgeOfflineCache();
      const publicPaths = [
        '/',
        '/login',
        '/register',
        '/reset-password',
        '/confirm',
        '/onboarding',
        '/demo',
      ];
      if (!publicPaths.includes(router.currentRoute.value.path)) {
        // On garde la page en cours pour y revenir après reconnexion.
        router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
      }
    }
  });
});
