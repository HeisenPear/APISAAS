import type { Recolte } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface CreateRecoltePayload {
  rucherId?: string;
  rucheId?: string;
  dateRecolte: string;
  typeMiel?: string;
  quantiteKg?: number;
  humidite?: number;
  nombreHausses?: number;
  numeroLot?: string;
  notes?: string;
}

export type UpdateRecoltePayload = Partial<CreateRecoltePayload>;

export interface RecolteWithContext extends Recolte {
  rucherNom?: string;
  rucheNumero?: string;
}

export interface LotInfo {
  numeroLot: string;
  typeMiel: string;
  totalKg: string;
  nombreRecoltes: number;
  dateDebut: string;
  dateFin: string;
  rucherNom: string;
  humiditeMoyenne: string;
}

export interface ProductionStats {
  annee: number;
  saison: {
    totalKg: number;
    nombreRecoltes: number;
    nombreLots: number;
    humiditeMoyenne: number | null;
  };
  comparaison: {
    anneePrecedente: number;
    totalKgPrecedent: number;
    evolutionPourcent: number | null;
  };
  parMois: Array<{ mois: number; totalKg: number; nombreRecoltes: number }>;
  parRucher: Array<{
    rucherId: string | null;
    rucherNom: string | null;
    totalKg: number;
    nombreRecoltes: number;
  }>;
  parTypeMiel: Array<{ typeMiel: string; totalKg: number; nombreRecoltes: number }>;
}

export function useProduction() {
  const { emit, on } = useDataBus();

  /**
   * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
   * Le chemin n'est plus confronté à l'union des 213 routes ; la `query`, qui
   * n'existe pas sur `useAsyncData`, est sérialisée dans l'URL. Même clé, donc
   * même déduplication et même `refreshNuxtData('recoltes-list')`.
   */
  const {
    data: recoltesData,
    pending,
    error,
    refresh,
  } = useAsyncData<ApiListResponse<RecolteWithContext>>(
    'recoltes-list',
    () => appelApi<ApiListResponse<RecolteWithContext>>('/api/production/recoltes?limit=100'),
    { lazy: true, dedupe: 'defer' },
  );

  // Auto-refresh sur changements de récoltes
  on(['recolte:created', 'recolte:updated', 'recolte:deleted'], () => {
    refresh();
  });

  const recoltes = computed(() => recoltesData.value?.data ?? []);
  const pagination = computed(() => recoltesData.value?.pagination);

  // ⚠️ Toutes les mutations passent par `appelApi`, pas par `$fetch` : c'est la
  // même cause que ci-dessus (cf. `app/utils/appelApi.ts`). Les options — dont
  // `query` — sont transmises telles quelles, le type de retour est donné.
  async function createRecolte(payload: CreateRecoltePayload): Promise<Recolte> {
    const res = await appelApi<ApiResponse<Recolte>>('/api/production/recoltes', {
      method: 'POST',
      body: payload,
    });
    emit('recolte:created', { id: res.data?.id });
    return res.data;
  }

  async function getRecolte(id: string): Promise<RecolteWithContext> {
    const res = await appelApi<ApiResponse<RecolteWithContext>>(`/api/production/recoltes/${id}`);
    return res.data;
  }

  async function updateRecolte(id: string, payload: UpdateRecoltePayload): Promise<Recolte> {
    const res = await appelApi<ApiResponse<Recolte>>(`/api/production/recoltes/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('recolte:updated', { id });
    return res.data;
  }

  async function deleteRecolte(id: string): Promise<void> {
    await appelApi<unknown>(`/api/production/recoltes/${id}`, { method: 'DELETE' });
    emit('recolte:deleted', { id });
  }

  async function getStats(annee?: number): Promise<ProductionStats> {
    const res = await appelApi<{ data: ProductionStats }>('/api/production/stats', {
      query: annee ? { annee } : {},
    });
    return res.data;
  }

  async function getLots(params?: { page?: number; search?: string }) {
    const res = await appelApi<ApiListResponse<LotInfo>>('/api/production/lots', {
      query: params,
    });
    return res;
  }

  return {
    recoltes,
    pagination,
    pending,
    error,
    refresh,
    createRecolte,
    getRecolte,
    updateRecolte,
    deleteRecolte,
    getStats,
    getLots,
  };
}
