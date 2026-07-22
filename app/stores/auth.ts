import type { Profil } from '~/types/models';
import type { ApiResponse } from '~/types/api';
import type { Plan } from '~/config/plans';

const PROFIL_KEY = 'apigo_profil';

/**
 * Champs de contexte ajoutés par /api/auth/me au-delà du type Profil de base.
 * `effectivePlan` = plan du propriétaire de l'espace si l'utilisateur est membre
 * d'une équipe (sinon son propre plan) → source de vérité pour l'accès features.
 */
interface ProfilContexte {
  effectivePlan?: Plan;
  isMember?: boolean;
  workspaceOwnerName?: string | null;
  isAdmin?: boolean;
}

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

  // Contexte espace de travail (multi-utilisateurs) — dérivé des champs enrichis
  // par /api/auth/me. Toujours disponible dès le chargement du profil, donc le
  // gating est correct immédiatement (pas de « flash » du plan personnel).
  const ctx = () => profil.value as (Profil & ProfilContexte) | null;

  /** Plan EFFECTIF de l'espace courant : celui du propriétaire si l'utilisateur
   *  est membre d'une équipe, sinon son propre plan. Gouverne l'accès features. */
  const effectivePlan = computed<Plan>(
    () => ctx()?.effectivePlan ?? (profil.value?.plan as Plan) ?? 'decouverte',
  );
  /** L'utilisateur agit-il dans l'espace partagé d'un autre (membre) ? */
  const isWorkspaceMember = computed<boolean>(() => ctx()?.isMember ?? false);
  /** Nom du propriétaire de l'espace (si membre) — pour l'afficher dans l'UI. */
  const workspaceOwnerName = computed<string | null>(() => ctx()?.workspaceOwnerName ?? null);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user profile from the API and persist locally.
   *
   * N'efface `profil.value` QUE sur une réponse 401/403 explicite (session
   * vraiment invalide). Sur toute autre erreur (réseau, 500, pool DB
   * temporairement mort après un déploiement — cf. dbWatchdog), on GARDE le
   * profil déjà chargé plutôt que de le vider : ce fetch tourne en
   * arrière-plan à chaque retour sur l'app (auth-persist.client.ts), et le
   * vider sur un simple aléa réseau déconnectait des comptes pourtant valides
   * (l'app affichait « profil introuvable » / renvoyait vers l'onboarding
   * pour un utilisateur bien authentifié et bien onboardé).
   */
  async function fetchProfil(): Promise<void> {
    loading.value = true;
    try {
      const { data } = await $fetch<ApiResponse<Profil>>('/api/auth/me');
      profil.value = data;
      if (import.meta.client) {
        localStorage.setItem(PROFIL_KEY, JSON.stringify(data));
      }
    } catch (err) {
      const status =
        (err as { statusCode?: number; status?: number; response?: { status?: number } } | null)
          ?.statusCode ??
        (err as { status?: number } | null)?.status ??
        (err as { response?: { status?: number } } | null)?.response?.status;
      if (status === 401 || status === 403) {
        profil.value = null;
      }
      // Sinon : erreur transitoire, on garde l'état courant tel quel.
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
    effectivePlan,
    isWorkspaceMember,
    workspaceOwnerName,
    fetchProfil,
    updateProfil,
    completeOnboarding,
    reset,
  };
});
