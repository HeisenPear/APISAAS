/**
 * Plugin auth-persist : gère la persistance de session au démarrage de l'app.
 *
 * Logique :
 * - Si "Se souvenir de moi" = true  → session persiste 30j (cookie long, géré par nuxt.config)
 * - Si "Se souvenir de moi" = false → session est liée à l'onglet navigateur :
 *     sessionStorage est effacé à la fermeture du navigateur (pas d'un onglet).
 *     Si aucun marqueur sessionStorage ET rememberMe = false → on déconnecte.
 */
export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient();

  const rememberMe = localStorage.getItem('apigo_remember_me') ?? 'true';
  const isNewBrowserSession = !sessionStorage.getItem('apigo_session_active');

  if (isNewBrowserSession && rememberMe === 'false') {
    // Le navigateur a été fermé et l'utilisateur n'a pas coché "se souvenir de moi"
    await supabase.auth.signOut();
    return;
  }

  // Marque la session navigateur comme active (effacé à la fermeture du navigateur)
  sessionStorage.setItem('apigo_session_active', '1');
});
