/**
 * Plugin auth-persist : gère la persistance de session au démarrage de l'app.
 *
 * Logique :
 * - Si "Se souvenir de moi" = true  → session persiste 30j (cookie long, géré par nuxt.config)
 * - Si "Se souvenir de moi" = false → session est liée à l'onglet navigateur :
 *     sessionStorage est effacé à la fermeture du navigateur (pas d'un onglet).
 *     Si aucun marqueur sessionStorage ET rememberMe = false → on déconnecte.
 *
 * Gère également les refresh tokens invalides/expirés : quand Supabase émet SIGNED_OUT
 * suite à un refresh token invalide, on nettoie l'état local et on redirige vers /login.
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient();
  const authStore = useAuthStore();
  const router = useRouter();

  const rememberMe = localStorage.getItem('apigo_remember_me') ?? 'true';
  const isNewBrowserSession = !sessionStorage.getItem('apigo_session_active');

  if (isNewBrowserSession && rememberMe === 'false' && navigator.onLine) {
    // Le navigateur a été fermé et l'utilisateur n'a pas coché "se souvenir de moi"
    // On ne déconnecte pas si l'utilisateur est hors-ligne — session préservée pour mode offline
    await supabase.auth.signOut();
    return;
  }

  // Marque la session navigateur comme active (effacé à la fermeture du navigateur)
  sessionStorage.setItem('apigo_session_active', '1');

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
