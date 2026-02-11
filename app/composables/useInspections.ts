import type { Inspection } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface CreateInspectionPayload {
  rucheId: string;
  dateVisite: string;
  type?: string;
  meteo?: { temperature?: number; vent?: string; ciel?: string };
  forceColonie?: number;
  couvain?: number;
  reserves?: number;
  comportement?: string;
  reineVue?: boolean;
  celluleRoyale?: boolean;
  signeEssaimage?: boolean;
  varroa?: number;
  traitementApplique?: string;
  maladieObservee?: string;
  actionsRealisees?: string[];
  nourrissementType?: string;
  nourrissementQuantite?: number;
  notes?: string;
  photos?: string[];
  dureeMinutes?: number;
  offlineId?: string;
}

export type UpdateInspectionPayload = Partial<CreateInspectionPayload>;

export interface InspectionWithContext extends Inspection {
  rucheNumero?: string;
  rucherNom?: string;
  ruche?: { id: string; numero: string; type: string; statut: string; rucherId: string };
  rucher?: { id: string; nom: string; commune: string | null };
}

export function useInspections(filters?: {
  rucheId?: Ref<string | undefined>;
  rucherId?: Ref<string | undefined>;
  type?: Ref<string | undefined>;
}) {
  const query = computed(() => {
    const params: Record<string, string> = {};
    if (filters?.rucheId?.value) params.rucheId = filters.rucheId.value;
    if (filters?.rucherId?.value) params.rucherId = filters.rucherId.value;
    if (filters?.type?.value) params.type = filters.type.value;
    return params;
  });

  const {
    data: inspectionsData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<InspectionWithContext>>('/api/inspections', {
    query,
    lazy: true,
  });

  const inspections = computed(() => inspectionsData.value?.data ?? []);
  const pagination = computed(() => inspectionsData.value?.pagination);

  async function createInspection(payload: CreateInspectionPayload): Promise<Inspection> {
    const res = await $fetch<ApiResponse<Inspection>>('/api/inspections', {
      method: 'POST',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function getInspection(id: string): Promise<InspectionWithContext> {
    const res = await $fetch<ApiResponse<InspectionWithContext>>(`/api/inspections/${id}`);
    return res.data;
  }

  async function updateInspection(
    id: string,
    payload: UpdateInspectionPayload,
  ): Promise<Inspection> {
    const res = await $fetch<ApiResponse<Inspection>>(`/api/inspections/${id}`, {
      method: 'PUT',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function deleteInspection(id: string): Promise<void> {
    await $fetch(`/api/inspections/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return {
    inspections,
    pagination,
    pending,
    error,
    refresh,
    createInspection,
    getInspection,
    updateInspection,
    deleteInspection,
  };
}
