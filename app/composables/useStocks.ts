import type { Stock, MouvementStock } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface CreateStockPayload {
  nom: string;
  categorie: string;
  categorieVente?: string;
  tauxTva?: number;
  quantite?: number;
  unite?: string;
  seuilAlerte?: number;
  prixUnitaire?: number;
  fournisseur?: string;
  emplacement?: string;
  notes?: string;
}

export type UpdateStockPayload = Partial<Omit<CreateStockPayload, 'quantite'>>;

export interface StockWithMouvements extends Stock {
  mouvements: MouvementStock[];
}

export interface CreateMouvementPayload {
  stockId: string;
  type: 'entree' | 'sortie' | 'ajustement';
  quantite: number;
  motif?: string;
}

export function useStocks(filters?: { categorie?: Ref<string | undefined> }) {
  const { emit, on } = useDataBus();

  const query = computed(() => {
    const params: Record<string, string | number> = { limit: 100 };
    if (filters?.categorie?.value) params.categorie = filters.categorie.value;
    return params;
  });

  const {
    data: stocksData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
    key: 'stocks-list',
    query,
    lazy: true,
    dedupe: 'defer',
  });

  // Auto-refresh sur changements de stocks, ventes et achats (mouvements auto)
  on(
    [
      'stock:created',
      'stock:updated',
      'stock:deleted',
      'stock:mouvement',
      'vente:created',
      'achat:created',
    ],
    () => {
      refresh();
    },
  );

  const stocks = computed(() => stocksData.value?.data ?? []);
  const pagination = computed(() => stocksData.value?.pagination);

  async function createStock(payload: CreateStockPayload): Promise<Stock> {
    const res = await $fetch<ApiResponse<Stock>>('/api/stocks', {
      method: 'POST',
      body: payload,
    });
    emit('stock:created', { id: res.data?.id });
    return res.data;
  }

  async function getStock(id: string): Promise<StockWithMouvements> {
    const res = await $fetch<ApiResponse<StockWithMouvements>>(`/api/stocks/${id}`);
    return res.data;
  }

  async function updateStock(id: string, payload: UpdateStockPayload): Promise<Stock> {
    const res = await $fetch<ApiResponse<Stock>>(`/api/stocks/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('stock:updated', { id });
    return res.data;
  }

  async function deleteStock(id: string): Promise<void> {
    await $fetch(`/api/stocks/${id}`, { method: 'DELETE' });
    emit('stock:deleted', { id });
  }

  async function createMouvement(payload: CreateMouvementPayload): Promise<MouvementStock> {
    const res = await $fetch<ApiResponse<MouvementStock>>('/api/stocks/mouvements', {
      method: 'POST',
      body: payload,
    });
    emit('stock:mouvement', { id: payload.stockId });
    return res.data;
  }

  async function getAlertes(): Promise<Stock[]> {
    const res = await $fetch<{ data: Stock[]; total: number }>('/api/stocks/alertes');
    return res.data;
  }

  return {
    stocks,
    pagination,
    pending,
    error,
    refresh,
    createStock,
    getStock,
    updateStock,
    deleteStock,
    createMouvement,
    getAlertes,
  };
}
