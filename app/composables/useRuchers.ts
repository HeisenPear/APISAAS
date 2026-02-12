import type { Rucher } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

interface CreateRucherPayload {
  nom: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  adresse?: string;
  codePostal?: string;
  commune?: string;
  departement?: string;
  environnement?: string;
  notesAcces?: string;
}

type UpdateRucherPayload = Partial<CreateRucherPayload & { actif: boolean }>;

export interface RucherStats {
  totalRuches: number;
  ruchesActives: number;
  derniereVisite: string | null;
  productionSaison: number;
}

export function useRuchers() {
  const {
    data: ruchersData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<Rucher>>('/api/ruchers', {
    key: 'ruchers-list',
    lazy: true,
    dedupe: 'defer',
  });

  const ruchers = computed(() => ruchersData.value?.data ?? []);

  async function createRucher(payload: CreateRucherPayload): Promise<Rucher> {
    const res = await $fetch<ApiResponse<Rucher>>('/api/ruchers', {
      method: 'POST',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function getRucher(id: string): Promise<Rucher & { ruchesCount: number }> {
    const res = await $fetch<ApiResponse<Rucher & { ruchesCount: number }>>(`/api/ruchers/${id}`);
    return res.data;
  }

  async function updateRucher(id: string, payload: UpdateRucherPayload): Promise<Rucher> {
    const res = await $fetch<ApiResponse<Rucher>>(`/api/ruchers/${id}`, {
      method: 'PUT',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function deleteRucher(id: string): Promise<void> {
    await $fetch(`/api/ruchers/${id}`, { method: 'DELETE' });
    await refresh();
  }

  async function getRucherStats(id: string): Promise<RucherStats> {
    const res = await $fetch<ApiResponse<RucherStats>>(`/api/ruchers/${id}/stats`);
    return res.data;
  }

  return {
    ruchers,
    pending,
    error,
    refresh,
    createRucher,
    getRucher,
    updateRucher,
    deleteRucher,
    getRucherStats,
  };
}
