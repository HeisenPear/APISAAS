/**
 * Plugin auth-persist : gère la persistance de session au démarrage de l'app.
 *
 * Logique :
 * - Si "Se souvenir de moi" = true  → session persiste 30j (cookie long, géré par nuxt.config)
 * - Si "Se souvenir de moi" = false → session liée à la session navigateur :
 *     sessionStorage est effacé à la fermeture du navigateur/PWA.
 *     Si aucun marqueur sessionStorage ET rememberMe = false → on déconnecte.
 *
 * Fix PWA : on force getSession() en premier pour que Supabase restaure et rafraîchisse
 * le token d'accès (expiré après 1h) AVANT que le middleware vérifie useSupabaseUser().
 * Sans ça, le PWA redirige vers /login à chaque cold start après 1h d'inactivité.
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient();
  const authStore = useAuthStore();
  const router = useRouter();

  // Force la restauration de session depuis le stockage (localStorage/cookie).
  // Supabase auto-rafraîchit le token si expiré — critique pour les cold starts PWA.
  const { data: { session } } = await supabase.auth.getSession();

  const rememberMe = localStorage.getItem('apigo_remember_me') ?? 'true';
  const isNewBrowserSession = !sessionStorage.getItem('apigo_session_active');

  if (isNewBrowserSession && rememberMe === 'false' && navigator.onLine) {
    // Navigateur/PWA fermé et "se souvenir de moi" décoché → déconnexion
    // On préserve la session hors-ligne pour ne pas bloquer le mode offline
    if (session) await supabase.auth.signOut();
    return;
  }

  // Marque la session comme active dans ce contexte navigateur/PWA
  sessionStorage.setItem('apigo_session_active', '1');

  // Si la session existe et que le profil n'est pas encore chargé, le charger maintenant
  // (évite un aller-retour API supplémentaire au premier chargement de page protégée)
  if (session && !authStore.profil) {
    authStore.fetchProfil().catch(() => {});
  }

  // Écoute les changements d'état d'auth — gère les sessions révoquées/expirées
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      authStore.reset();
      const publicPaths = ['/', '/login', '/register', '/reset-password', '/confirm', '/onboarding'];
      if (!publicPaths.includes(router.currentRoute.value.path)) {
        router.push('/login');
      }
    }
  });
});
