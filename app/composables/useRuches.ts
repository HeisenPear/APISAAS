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

type UpdateRuchePayload = Partial<
  CreateRuchePayload & {
    qualiteReine?: string;
    origineEssaim?: string;
    marquageReine?: string;
    nombreCadres?: number;
    nombreHausses?: number;
    notes?: string;
  }
>;

export function useRuches(rucherId?: Ref<string | undefined>) {
  const query = computed(() => {
    const params: Record<string, string> = {};
    if (rucherId?.value) params.rucherId = rucherId.value;
    return params;
  });

  // key must be a plain string — ComputedRef breaks useFetch cache/refresh
  const keyValue = rucherId?.value ? `ruches-list-${rucherId.value}` : 'ruches-list';

  const {
    data: ruchesData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<Ruche>>('/api/ruches', {
    key: keyValue,
    query,
    lazy: true,
    dedupe: 'defer',
    watch: [query],
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

  async function getRuche(id: string): Promise<Ruche> {
    const res = await $fetch<ApiResponse<Ruche>>(`/api/ruches/${id}`);
    return res.data;
  }

  async function updateRuche(id: string, payload: UpdateRuchePayload): Promise<Ruche> {
    const res = await $fetch<ApiResponse<Ruche>>(`/api/ruches/${id}`, {
      method: 'PUT',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function deleteRuche(id: string): Promise<void> {
    await $fetch(`/api/ruches/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return {
    ruches,
    pending,
    error,
    refresh,
    createRuche,
    createRuchesBatch,
    getRuche,
    updateRuche,
    deleteRuche,
  };
}
