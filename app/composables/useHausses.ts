import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface Hausse {
  id: string;
  userId: string;
  rucheId: string | null;
  numero: string;
  type: string;
  nombreCadres: number | null;
  statut: string;
  anneeAcquisition: number | null;
  qrCodeData: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  rucheNumero?: string | null;
}

interface GenererPayload {
  nombre: number;
  type: string;
  nombreCadres?: number;
  prefixeNumero?: string;
  anneeAcquisition?: number;
}

interface UpdateHaussePayload {
  rucheId?: string | null;
  statut?: string;
  nombreCadres?: number;
  notes?: string | null;
}

interface HaussesFilters {
  statut?: Ref<string>;
  rucheId?: Ref<string>;
  type?: Ref<string>;
  search?: Ref<string>;
  page?: Ref<number>;
  limit?: Ref<number>;
}

export function useHausses(filters?: HaussesFilters) {
  const { emit, on } = useDataBus();
  const page = filters?.page ?? ref(1);
  const limit = filters?.limit ?? ref(20);

  const queryParams = computed(() => {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: limit.value,
    };
    if (filters?.statut?.value) params.statut = filters.statut.value;
    if (filters?.rucheId?.value) params.rucheId = filters.rucheId.value;
    if (filters?.type?.value) params.type = filters.type.value;
    if (filters?.search?.value) params.search = filters.search.value;
    return params;
  });

  /**
   * L'URL de la liste, filtres compris — RELUE à chaque appel. `useAsyncData`
   * n'a pas d'option `query` : la sérialisation qui était faite par `useFetch`
   * se fait ici, dans le handler, pour que le `watch` ci-dessous reparte bien
   * avec les filtres COURANTS et non ceux du montage.
   */
  function urlCourante(): string {
    const params = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(queryParams.value)) {
      params.set(cle, String(valeur));
    }
    return `/api/hausses?${params.toString()}`;
  }

  /**
   * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
   * Résoudre le chemin contre l'union des 213 routes fait déplier à TypeScript
   * le type de retour réel de chaque handler ; le type est donné ici, donc
   * toujours vérifié. `lazy`, `dedupe` et `watch` restent les mêmes.
   */
  const {
    data: haussesData,
    pending,
    error,
    refresh,
  } = useAsyncData<ApiListResponse<Hausse>>(
    'hausses-list',
    () => appelApi<ApiListResponse<Hausse>>(urlCourante()),
    { lazy: true, dedupe: 'defer', watch: [queryParams] },
  );

  const hausses = computed(() => haussesData.value?.data ?? []);
  const pagination = computed(
    () => haussesData.value?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
  );

  on(['hausse:created', 'hausse:updated', 'hausse:deleted'], () => refresh());

  /**
   * ⚠️ TOUTES LES MUTATIONS QUI SUIVENT PASSENT PAR `appelApi`, PAS PAR `$fetch`
   * — cf. `app/utils/appelApi.ts`. `deleteHausse` portait déjà le contournement
   * local `($fetch as typeof $fetch<unknown, string>)`, écrit sans dire
   * pourquoi : c'est la même cause, et c'est désormais la même parade nommée.
   */
  async function genererHausses(payload: GenererPayload): Promise<Hausse[]> {
    const res = await appelApi<ApiResponse<Hausse[]>>('/api/hausses/generer', {
      method: 'POST',
      body: payload,
    });
    emit('hausse:created');
    return res.data;
  }

  async function updateHausse(id: string, payload: UpdateHaussePayload): Promise<Hausse> {
    const res = await appelApi<ApiResponse<Hausse>>(`/api/hausses/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('hausse:updated', { id });
    return res.data;
  }

  async function deleteHausse(id: string): Promise<void> {
    await appelApi<unknown>(`/api/hausses/${id}`, { method: 'DELETE' });
    emit('hausse:deleted', { id });
  }

  async function getQrCode(id: string): Promise<string> {
    const res = await appelApi<ApiResponse<{ qrCode: string }>>(`/api/hausses/${id}/qr`);
    return res.data.qrCode;
  }

  async function exportQrCodes(
    ids: string[],
  ): Promise<Array<{ id: string; numero: string; type: string; qrCode: string }>> {
    const res = await appelApi<
      ApiResponse<{ hausses: Array<{ id: string; numero: string; type: string; qrCode: string }> }>
    >('/api/hausses/export-qr', {
      method: 'POST',
      body: { ids },
    });
    return res.data.hausses;
  }

  return {
    hausses,
    pagination,
    pending,
    error,
    refresh,
    genererHausses,
    updateHausse,
    deleteHausse,
    getQrCode,
    exportQrCodes,
  };
}
