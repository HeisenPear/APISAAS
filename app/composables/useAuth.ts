import type { ApiResponse } from '~/types/api';
import type { Profil } from '~/types/models';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterCredentials {
  email: string;
  password: string;
  nom: string;
  prenom: string;
}

export function useAuth() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const authStore = useAuthStore();
  const router = useRouter();

  const loading = ref(false);
  const error = ref<string | null>(null);

  /** Clear previous error before each action. */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Sign in with email + password.
   * On success, fetch the profile and redirect to /dashboard or /onboarding.
   */
  async function login({ email, password, rememberMe = true }: LoginCredentials): Promise<void> {
    clearError();
    loading.value = true;
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          error.value = 'Email ou mot de passe incorrect';
        } else if (authError.message.includes('Email not confirmed')) {
          error.value = 'Veuillez confirmer votre email avant de vous connecter';
        } else {
          error.value = authError.message;
        }
        return;
      }

      // Persist remember-me preference and mark browser session as active
      localStorage.setItem('apigo_remember_me', rememberMe ? 'true' : 'false');
      sessionStorage.setItem('apigo_session_active', '1');

      await authStore.fetchProfil();

      if (authStore.isOnboarded) {
        await router.push('/dashboard');
      } else {
        await router.push('/onboarding');
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Une erreur inattendue est survenue';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Register a new account via the server API,
   * then auto-login and redirect to /onboarding.
   */
  async function register({ email, password, nom, prenom }: RegisterCredentials): Promise<void> {
    clearError();
    loading.value = true;
    try {
      await $fetch<ApiResponse<Profil>>('/api/auth/register', {
        method: 'POST',
        body: { email, password, nom, prenom },
      });

      // Auto-login after registration
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // If email confirmation is required, show a success message instead
        if (authError.message.includes('Email not confirmed')) {
          error.value =
            'Compte cree avec succes ! Verifiez votre email pour confirmer votre compte.';
          return;
        }
        error.value = authError.message;
        return;
      }

      // Inscription = remember me par défaut
      localStorage.setItem('apigo_remember_me', 'true');
      sessionStorage.setItem('apigo_session_active', '1');

      await authStore.fetchProfil();
      // Rediriger vers la page d'activation de l'essai (carte requise pour trial Pro 60j)
      await router.push('/activer-essai');
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'data' in e &&
        e.data &&
        typeof e.data === 'object' &&
        'message' in e.data
      ) {
        error.value = (e.data as { message: string }).message;
      } else {
        error.value =
          e instanceof Error ? e.message : 'Une erreur est survenue lors de la creation du compte';
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * Sign out, reset stores, and redirect to /login.
   */
  async function logout(): Promise<void> {
    clearError();
    loading.value = true;
    try {
      await supabase.auth.signOut();
      authStore.reset();
      localStorage.removeItem('apigo_remember_me');
      sessionStorage.removeItem('apigo_session_active');
      await router.push('/login');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la deconnexion';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Send a password reset email.
   */
  async function resetPassword(email: string): Promise<boolean> {
    clearError();
    loading.value = true;
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirm`,
      });

      if (authError) {
        error.value = authError.message;
        return false;
      }
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Erreur lors de l'envoi de l'email";
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Send a magic link to the user's email.
   */
  async function loginWithMagicLink(email: string): Promise<boolean> {
    clearError();
    loading.value = true;
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      });

      if (authError) {
        error.value = authError.message;
        return false;
      }
      return true;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "Erreur lors de l'envoi du lien";
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    loginWithMagicLink,
    clearError,
  };
}
