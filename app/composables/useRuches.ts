import type { Ruche } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

interface CreateRuchePayload {
  rucherId: string;
  numero: string;
  type: string;
  statut?: string;
  raceAbeille?: string;
  dateInstallation?: string;
}

export function useRuches(rucherId?: Ref<string | undefined>) {
  const query = computed(() => {
    const params: Record<string, string> = {};
    if (rucherId?.value) params.rucherId = rucherId.value;
    return params;
  });

  const {
    data: ruchesData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<Ruche>>('/api/ruches', {
    query,
    lazy: true,
  });

  const ruches = computed(() => ruchesData.value?.data ?? []);

  async function createRuche(payload: CreateRuchePayload): Promise<Ruche> {
    const res = await $fetch<ApiResponse<Ruche>>('/api/ruches', {
      method: 'POST',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function createRuchesBatch(ruchesList: CreateRuchePayload[]): Promise<Ruche[]> {
    const res = await $fetch<ApiResponse<Ruche[]>>('/api/ruches', {
      method: 'POST',
      body: { ruches: ruchesList },
    });
    await refresh();
    return res.data;
  }

  return { ruches, pending, error, refresh, createRuche, createRuchesBatch };
}
