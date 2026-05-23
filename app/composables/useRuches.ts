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

export interface RuchesGlobalStats {
  totalRuches: number;
  actives: number;
  faibles: number;
  productionTotale: number;
  interventionsMois: number;
}

export function useRuches(rucherId?: Ref<string | undefined>) {
  const { emit, on } = useDataBus();
  const { isOnline, queueMutation } = useOfflineSync();

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

  // Auto-refresh sur changements de ruches
  on(['ruche:created', 'ruche:updated', 'ruche:deleted'], () => {
    refresh();
  });

  const ruches = computed(() => ruchesData.value?.data ?? []);

  async function createRuche(payload: CreateRuchePayload): Promise<Ruche> {
    const res = await $fetch<ApiResponse<Ruche>>('/api/ruches', {
      method: 'POST',
      body: payload,
    });
    emit('ruche:created', { id: res.data?.id, parentId: payload.rucherId });
    return res.data;
  }

  async function createRuchesBatch(ruchesList: CreateRuchePayload[]): Promise<Ruche[]> {
    const res = await $fetch<ApiResponse<Ruche[]>>('/api/ruches', {
      method: 'POST',
      body: { ruches: ruchesList },
    });
    emit('ruche:created', { parentId: ruchesList[0]?.rucherId });
    return res.data;
  }

  async function getRuche(id: string): Promise<Ruche> {
    const res = await $fetch<ApiResponse<Ruche>>(`/api/ruches/${id}`);
    return res.data;
  }

  async function updateRuche(id: string, payload: UpdateRuchePayload): Promise<Ruche> {
    if (!isOnline.value) {
      await queueMutation(`/api/ruches/${id}`, 'PUT', payload as Record<string, unknown>);
      emit('ruche:updated', { id });
      return { id, ...payload } as unknown as Ruche;
    }
    const res = await $fetch<ApiResponse<Ruche>>(`/api/ruches/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('ruche:updated', { id });
    return res.data;
  }

  async function deleteRuche(id: string): Promise<void> {
    if (!isOnline.value) {
      await queueMutation(`/api/ruches/${id}`, 'DELETE');
      emit('ruche:deleted', { id });
      return;
    }
    await ($fetch as typeof $fetch<unknown, string>)(`/api/ruches/${id}`, { method: 'DELETE' });
    emit('ruche:deleted', { id });
  }

  async function fetchRuchesStats(): Promise<RuchesGlobalStats> {
    const res = await $fetch<ApiResponse<RuchesGlobalStats>>('/api/ruches/stats');
    return res.data;
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
    fetchRuchesStats,
  };
}
