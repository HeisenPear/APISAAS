import type { ApiListResponse, ApiResponse } from '~/types/api';
import type {
  InterventionWithContext,
  TypeIntervention,
  DonneesIntervention,
} from '~/types/interventions';

export interface CreateInterventionPayload {
  rucheId: string;
  rucherId?: string;
  date?: string;
  type: TypeIntervention;
  dureeMinutes?: number;
  meteo?: {
    temperature?: number;
    vent?: string;
    ciel?: string;
    humidite?: number;
    conditions?: string;
  };
  donnees: DonneesIntervention;
  commentaire?: string;
  photos?: string[];
  offlineId?: string;
}

export function useInterventions(filters?: {
  rucheId?: Ref<string | undefined>;
  rucherId?: Ref<string | undefined>;
  type?: Ref<TypeIntervention | undefined>;
}) {
  const query = computed(() => {
    const params: Record<string, string> = {};
    if (filters?.rucheId?.value) params.rucheId = filters.rucheId.value;
    if (filters?.rucherId?.value) params.rucherId = filters.rucherId.value;
    if (filters?.type?.value) params.type = filters.type.value;
    return params;
  });

  const {
    data: interventionsData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<InterventionWithContext>>('/api/interventions', {
    key: 'interventions-list',
    query,
    lazy: true,
    dedupe: 'defer',
  });

  const interventions = computed(() => interventionsData.value?.data ?? []);
  const pagination = computed(() => interventionsData.value?.pagination);

  async function createIntervention(payload: CreateInterventionPayload) {
    const res = await $fetch<ApiResponse<InterventionWithContext>>('/api/interventions', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  }

  async function getIntervention(id: string) {
    const res = await $fetch<ApiResponse<InterventionWithContext>>(`/api/interventions/${id}`);
    return res.data;
  }

  async function deleteIntervention(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/interventions/${id}`, {
      method: 'DELETE',
    });
  }

  return {
    interventions,
    pagination,
    pending,
    error,
    refresh,
    createIntervention,
    getIntervention,
    deleteIntervention,
  };
}
