import type { Profil } from '~/types/models';
import type { ApiResponse } from '~/types/api';

const PROFIL_KEY = 'apigo_profil';

export const useAuthStore = defineStore('auth', () => {
  // ---------------------------------------------------------------------------
  // State — restauration synchrone depuis localStorage (client uniquement)
  // ---------------------------------------------------------------------------
  let stored: Profil | null = null;
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(PROFIL_KEY);
      if (raw) stored = JSON.parse(raw) as Profil;
    } catch {
      localStorage.removeItem(PROFIL_KEY);
    }
  }

  const profil = ref<Profil | null>(stored);
  const loading = ref(false);

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  const isAuthenticated = computed(() => profil.value !== null);

  const isOnboarded = computed(() => profil.value?.onboardingComplete ?? false);

  const fullName = computed(() => {
    if (!profil.value) return '';
    const { prenom, nom } = profil.value;
    return [prenom, nom].filter(Boolean).join(' ') || profil.value.email;
  });

  const initials = computed(() => {
    if (!profil.value) return '';
    const p = profil.value.prenom?.[0]?.toUpperCase() ?? '';
    const n = profil.value.nom?.[0]?.toUpperCase() ?? '';
    return p + n || (profil.value.email[0]?.toUpperCase() ?? '?');
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Fetch the current user profile from the API and persist locally. */
  async function fetchProfil(): Promise<void> {
    loading.value = true;
    try {
      const { data } = await $fetch<ApiResponse<Profil>>('/api/auth/me');
      profil.value = data;
      if (import.meta.client) {
        localStorage.setItem(PROFIL_KEY, JSON.stringify(data));
      }
    } catch {
      profil.value = null;
    } finally {
      loading.value = false;
    }
  }

  /** Update the current user profile. */
  async function updateProfil(
    payload: Partial<
      Pick<
        Profil,
        | 'nom'
        | 'prenom'
        | 'telephone'
        | 'adresse'
        | 'codePostal'
        | 'ville'
        | 'siret'
        | 'napi'
        | 'optionTvaDebits'
        | 'franchiseTva'
        | 'preferences'
      >
    >,
  ): Promise<Profil> {
    loading.value = true;
    try {
      const { data } = await $fetch<ApiResponse<Profil>>('/api/profils/me', {
        method: 'PUT',
        body: payload,
      });
      profil.value = data;
      if (import.meta.client) {
        localStorage.setItem(PROFIL_KEY, JSON.stringify(data));
      }
      return data;
    } finally {
      loading.value = false;
    }
  }

  /** Mark onboarding as complete. */
  async function completeOnboarding(): Promise<void> {
    loading.value = true;
    try {
      const { data } = await $fetch<ApiResponse<Profil>>('/api/profils/onboarding', {
        method: 'PUT',
        body: { complete: true },
      });
      profil.value = data;
      if (import.meta.client) {
        localStorage.setItem(PROFIL_KEY, JSON.stringify(data));
      }
    } finally {
      loading.value = false;
    }
  }

  /** Clear all auth state (used on logout). */
  function reset(): void {
    profil.value = null;
    loading.value = false;
    if (import.meta.client) {
      localStorage.removeItem(PROFIL_KEY);
    }
  }

  return {
    profil,
    loading,
    isAuthenticated,
    isOnboarded,
    fullName,
    initials,
    fetchProfil,
    updateProfil,
    completeOnboarding,
    reset,
  };
});
