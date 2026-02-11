import type { Profil } from '~/types/models';
import type { ApiResponse } from '~/types/api';

export const useAuthStore = defineStore('auth', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const profil = ref<Profil | null>(null);
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

  /** Fetch the current user profile from the API. */
  async function fetchProfil(): Promise<void> {
    loading.value = true;
    try {
      const { data } = await $fetch<ApiResponse<Profil>>('/api/auth/me');
      profil.value = data;
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
    } finally {
      loading.value = false;
    }
  }

  /** Clear all auth state (used on logout). */
  function reset(): void {
    profil.value = null;
    loading.value = false;
  }

  return {
    // State
    profil,
    loading,
    // Getters
    isAuthenticated,
    isOnboarded,
    fullName,
    initials,
    // Actions
    fetchProfil,
    updateProfil,
    completeOnboarding,
    reset,
  };
});
