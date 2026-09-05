import type { ApiListResponse, ApiResponse } from '~/types/api';
import type {
  InterventionWithContext,
  BulkInterventionPayload,
  BulkGroupInterventionPayload,
} from '~/types/interventions';

export function useInterventions(filters?: {
  rucheId?: Ref<string | undefined>;
  rucherId?: Ref<string | undefined>;
  type?: Ref<string | undefined>;
}) {
  const { emit, on } = useDataBus();

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
  } = useCachedFetch<ApiListResponse<InterventionWithContext>>('/api/interventions', {
    key: 'interventions-list',
    query,
    lazy: true,
    dedupe: 'defer',
  });

  // Auto-refresh sur changements d'interventions
  on(['intervention:created', 'intervention:updated', 'intervention:deleted'], () => {
    refresh();
  });

  const interventions = computed(() => interventionsData.value?.data ?? []);
  const pagination = computed(() => interventionsData.value?.pagination);

  /**
   * Phase 2 — Bulk intervention (multi-catégories, transaction unique)
   */
  async function createBulkIntervention(payload: BulkInterventionPayload) {
    const { isOnline, queueMutation } = useOfflineSync();

    // Hors-ligne : on met l'intervention en file d'attente (IndexedDB).
    // Elle sera rejouée automatiquement au retour du réseau (useOfflineSync).
    if (!isOnline.value) {
      const queued = await queueMutation(
        '/api/interventions/bulk',
        'POST',
        payload as unknown as Record<string, unknown>,
      );
      if (!queued) throw new Error('Erreur lors de la mise en file hors-ligne');
      emit('intervention:created', {});
      // Retour optimiste — l'id réel sera attribué à la synchro
      return { id: '', categoriesActivees: [] };
    }

    const res = await appelApi<ApiResponse<{ id: string; categoriesActivees: string[] }>>(
      '/api/interventions/bulk',
      {
        method: 'POST',
        body: payload,
      },
    );
    emit('intervention:created', { id: res.data?.id });
    return res.data;
  }

  /**
   * Legacy — Création simple (Phase 1, maintenu pour compatibilité)
   */
  async function createIntervention(payload: {
    rucheId: string;
    type: string;
    donnees: Record<string, unknown>;
    commentaire?: string;
    photos?: string[];
    dureeMinutes?: number;
    offlineId?: string;
  }) {
    const { isOnline, queueMutation } = useOfflineSync();

    if (!isOnline.value) {
      const offlinePayload = {
        ...payload,
        offlineId: payload.offlineId ?? crypto.randomUUID(),
      };
      const queued = await queueMutation(
        '/api/interventions',
        'POST',
        offlinePayload as unknown as Record<string, unknown>,
      );
      if (!queued) throw new Error('Erreur lors de la mise en file');
      return offlinePayload as unknown as InterventionWithContext;
    }

    const res = await appelApi<ApiResponse<InterventionWithContext>>('/api/interventions', {
      method: 'POST',
      body: payload,
    });
    emit('intervention:created', { id: res.data?.id });
    return res.data;
  }

  /**
   * Phase 3 — Bulk group intervention (multi-ruches, mêmes catégories)
   */
  async function createBulkGroupIntervention(payload: BulkGroupInterventionPayload) {
    const res = await appelApi<
      ApiResponse<{ totalRuches: number; categories: string[]; dateVisite: string }>
    >('/api/interventions/bulk-group', {
      method: 'POST',
      body: payload,
    });
    emit('intervention:created');
    return res.data;
  }

  async function getIntervention(id: string) {
    const res = await appelApi<ApiResponse<InterventionWithContext>>(`/api/interventions/${id}`);
    return res.data;
  }

  async function deleteIntervention(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/interventions/${id}`, {
      method: 'DELETE',
    });
    emit('intervention:deleted', { id });
  }

  return {
    interventions,
    pagination,
    pending,
    error,
    refresh,
    createBulkIntervention,
    createBulkGroupIntervention,
    createIntervention,
    getIntervention,
    deleteIntervention,
  };
}
