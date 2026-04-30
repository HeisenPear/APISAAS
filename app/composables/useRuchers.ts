import type { Rucher, RucherWithCount } from '~/types/models';
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

export interface RuchersGlobalStats {
  totalRuchers: number;
  totalRuches: number;
  ruchesActives: number;
  productionSaison: number;
}

export function useRuchers() {
  const { emit, on } = useDataBus();

  const {
    data: ruchersData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<RucherWithCount>>('/api/ruchers', {
    key: 'ruchers-list',
    lazy: true,
    dedupe: 'defer',
  });

  // Auto-refresh sur changements de ruchers ou de ruches (compteurs)
  on(
    ['rucher:created', 'rucher:updated', 'rucher:deleted', 'ruche:created', 'ruche:deleted'],
    () => {
      refresh();
    },
  );

  const ruchers = computed(() => ruchersData.value?.data ?? ([] as RucherWithCount[]));

  async function createRucher(payload: CreateRucherPayload): Promise<Rucher> {
    const res = await $fetch<ApiResponse<Rucher>>('/api/ruchers', {
      method: 'POST',
      body: payload,
    });
    emit('rucher:created', { id: res.data?.id });
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
    emit('rucher:updated', { id });
    return res.data;
  }

  async function deleteRucher(id: string): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/ruchers/${id}`, { method: 'DELETE' });
    emit('rucher:deleted', { id });
  }

  async function getRucherStats(id: string): Promise<RucherStats> {
    const res = await $fetch<ApiResponse<RucherStats>>(`/api/ruchers/${id}/stats`);
    return res.data;
  }

  async function fetchRuchersStats(): Promise<RuchersGlobalStats> {
    const res = await $fetch<ApiResponse<RuchersGlobalStats>>('/api/ruchers/stats');
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
    fetchRuchersStats,
  };
}
