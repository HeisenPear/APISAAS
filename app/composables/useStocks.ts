import type { Stock, MouvementStock } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface CreateStockPayload {
  nom: string;
  type?: 'materiel' | 'produit_vente';
  categorie: string;
  categorieVente?: string;
  tauxTva?: number;
  quantite?: number;
  unite?: string;
  modePrix?: 'format' | 'poids';
  /** null = effacer la contenance en DB (PUT nullish) — undefined = ne pas toucher */
  contenance?: number | null;
  uniteContenance?: string | null;
  seuilAlerte?: number;
  prixUnitaire?: number;
  fournisseur?: string;
  emplacement?: string;
  notes?: string;
  // Champs spécifiques miel
  typeMiel?: string;
  presentation?: string;
  conditionnementMiel?: string;
  anneeRecolte?: number;
  numLot?: string;
  origineGeo?: string;
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

  /**
   * La `query` de `useFetch` n'existe pas sur `useAsyncData` : on la sérialise
   * ici, et le handler la relit à chaque appel — d'où le `watch` ci-dessous,
   * qui rejoue exactement le rafraîchissement automatique que `useFetch`
   * faisait sur une query réactive.
   */
  function urlStocks(): string {
    const params = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(query.value)) params.set(cle, String(valeur));
    return `/api/stocks?${params.toString()}`;
  }

  /**
   * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
   * Typer ce chemin contre l'union des 213 routes oblige TypeScript à déplier le
   * type de retour réel de chaque handler ; le type est donné ici, donc toujours
   * vérifié chez l'appelant.
   */
  const {
    data: stocksData,
    pending,
    error,
    refresh,
  } = useAsyncData<ApiListResponse<Stock>>(
    'stocks-list',
    () => appelApi<ApiListResponse<Stock>>(urlStocks()),
    { lazy: true, dedupe: 'defer', watch: [query] },
  );

  // Auto-refresh sur changements de stocks, ventes et achats (mouvements auto)
  on(
    [
      'stock:created',
      'stock:updated',
      'stock:deleted',
      'stock:mouvement',
      'vente:created',
      'vente:updated',
      'vente:deleted',
      'achat:created',
    ],
    () => {
      refresh();
    },
  );

  const stocks = computed(() => stocksData.value?.data ?? []);
  const pagination = computed(() => stocksData.value?.pagination);

  /**
   * ⚠️ Les appels directs qui suivent passent tous par `appelApi`, pas par
   * `$fetch` — même cause que la liste ci-dessus, cf. `app/utils/appelApi.ts`.
   */
  async function createStock(payload: CreateStockPayload): Promise<Stock> {
    const res = await appelApi<ApiResponse<Stock>>('/api/stocks', {
      method: 'POST',
      body: payload,
    });
    emit('stock:created', { id: res.data?.id });
    return res.data;
  }

  async function getStock(id: string): Promise<StockWithMouvements> {
    const res = await appelApi<ApiResponse<StockWithMouvements>>(`/api/stocks/${id}`);
    return res.data;
  }

  async function updateStock(id: string, payload: UpdateStockPayload): Promise<Stock> {
    const res = await appelApi<ApiResponse<Stock>>(`/api/stocks/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('stock:updated', { id });
    return res.data;
  }

  async function deleteStock(id: string): Promise<void> {
    await appelApi<unknown>(`/api/stocks/${id}`, { method: 'DELETE' });
    emit('stock:deleted', { id });
  }

  async function createMouvement(payload: CreateMouvementPayload): Promise<MouvementStock> {
    const res = await appelApi<ApiResponse<MouvementStock>>('/api/stocks/mouvements', {
      method: 'POST',
      body: payload,
    });
    emit('stock:mouvement', { id: payload.stockId });
    return res.data;
  }

  async function getAlertes(): Promise<Stock[]> {
    const res = await appelApi<{ data: Stock[]; total: number }>('/api/stocks/alertes');
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
