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
  const {
    data: recoltesData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<RecolteWithContext>>('/api/production/recoltes', {
    key: 'recoltes-list',
    query: { limit: 100 },
    lazy: true,
    dedupe: 'defer',
  });

  const recoltes = computed(() => recoltesData.value?.data ?? []);
  const pagination = computed(() => recoltesData.value?.pagination);

  async function createRecolte(payload: CreateRecoltePayload): Promise<Recolte> {
    const res = await $fetch<ApiResponse<Recolte>>('/api/production/recoltes', {
      method: 'POST',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function getRecolte(id: string): Promise<RecolteWithContext> {
    const res = await $fetch<ApiResponse<RecolteWithContext>>(`/api/production/recoltes/${id}`);
    return res.data;
  }

  async function updateRecolte(id: string, payload: UpdateRecoltePayload): Promise<Recolte> {
    const res = await $fetch<ApiResponse<Recolte>>(`/api/production/recoltes/${id}`, {
      method: 'PUT',
      body: payload,
    });
    await refresh();
    return res.data;
  }

  async function deleteRecolte(id: string): Promise<void> {
    await $fetch(`/api/production/recoltes/${id}`, { method: 'DELETE' });
    await refresh();
  }

  async function getStats(annee?: number): Promise<ProductionStats> {
    const res = await $fetch<{ data: ProductionStats }>('/api/production/stats', {
      query: annee ? { annee } : {},
    });
    return res.data;
  }

  async function getLots(params?: { page?: number; search?: string }) {
    const res = await $fetch<ApiListResponse<LotInfo>>('/api/production/lots', {
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
