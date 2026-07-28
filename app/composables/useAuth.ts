import type { ApiResponse } from '~/types/api';
import type { Profil } from '~/types/models';

interface LoginCredentials {
  email: string;
  password: string;
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
  const route = useRoute();
  const analytics = useAnalytics();
  const { consume: consumeCaptcha } = useCaptcha();

  const loading = ref(false);
  const error = ref<string | null>(null);

  function clearError(): void {
    error.value = null;
  }

  function identifyProfil(profil: Profil) {
    analytics.identify(profil.id, {
      plan: profil.plan,
      trial_active: profil.trialActive,
      onboarding_complete: profil.onboardingComplete,
      date_inscription: profil.createdAt?.toString(),
      departement: profil.codePostal ? profil.codePostal.slice(0, 2) : null,
      platform: import.meta.client && isPwa() ? 'pwa' : 'web',
      is_pwa_installed: import.meta.client ? isPwa() : false,
    });
    analytics.group(profil.id, { plan: profil.plan });
  }

  async function login({ email, password }: LoginCredentials): Promise<void> {
    clearError();
    loading.value = true;
    try {
      const captchaToken = consumeCaptcha();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
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

      await authStore.fetchProfil();

      if (authStore.profil) {
        identifyProfil(authStore.profil);
        analytics.capture('user_logged_in', { method: 'password' });
      }

      // Reprise d'une intention si présente : priorité au ?redirect= explicite
      // (ex. checkout d'un plan), sinon le chemin d'origine sauvegardé en cookie
      // par le module Supabase (ex. lien scanné avant d'être connecté).
      const redirect =
        safeInternalPath(route.query.redirect) ??
        safeInternalPath(useSupabaseCookieRedirect().pluck());
      if (redirect) {
        await router.push(redirect);
      } else if (authStore.isOnboarded) {
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

  async function register({ email, password, nom, prenom }: RegisterCredentials): Promise<void> {
    clearError();
    loading.value = true;
    try {
      await $fetch<ApiResponse<Profil>>('/api/auth/register', {
        method: 'POST',
        body: { email, password, nom, prenom },
      });

      const captchaToken = consumeCaptcha();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });
      if (authError) {
        error.value = authError.message;
        return;
      }

      await authStore.fetchProfil();
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

  async function logout(): Promise<void> {
    clearError();
    loading.value = true;
    try {
      analytics.capture('user_logged_out');
      analytics.reset();
      await supabase.auth.signOut();
      authStore.reset();
      // Le cache local est nominatif : on ne laisse rien du compte sur
      // l'appareil (tablette de camion, poste partagé…).
      await purgeOfflineCache();
      await router.push('/login');
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la deconnexion';
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(email: string): Promise<boolean> {
    clearError();
    loading.value = true;
    try {
      const captchaToken = consumeCaptcha();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirm`,
        ...(captchaToken ? { captchaToken } : {}),
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

  async function loginWithMagicLink(email: string): Promise<boolean> {
    clearError();
    loading.value = true;
    try {
      const captchaToken = consumeCaptcha();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
          ...(captchaToken ? { captchaToken } : {}),
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

function isPwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}
