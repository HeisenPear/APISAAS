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

export function useRuchers() {
  const {
    data: ruchersData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<Rucher>>('/api/ruchers', { lazy: true });

  const ruchers = computed(() => ruchersData.value?.data ?? []);

  async function createRucher(payload: CreateRucherPayload): Promise<Rucher> {
    const res = await $fetch<ApiResponse<Rucher>>('/api/ruchers', {
      method: 'POST',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function getRucher(id: string): Promise<Rucher> {
    const res = await $fetch<ApiResponse<Rucher>>(`/api/ruchers/${id}`);
    return res.data;
  }

  return { ruchers, pending, error, refresh, createRucher, getRucher };
}
