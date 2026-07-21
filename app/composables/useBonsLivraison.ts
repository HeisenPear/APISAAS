import type { BonLivraison, BonLivraisonWithClient } from '~/types/models';
import type { ApiListResponse, ApiResponse } from '~/types/api';

export interface LigneBLPayload {
  description: string;
  quantite: number;
  prixUnitaire?: number;
  tauxTva?: number;
  stockId?: string;
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
}

export interface CreateBLPayload {
  clientId?: string;
  dateCreation: string;
  dateLivraison?: string;
  lignes: LigneBLPayload[];
  notes?: string;
  adresseLivraison?: string;
  codePostalLivraison?: string;
  villeLivraison?: string;
}

export type UpdateBLPayload = Partial<Omit<CreateBLPayload, 'lignes'>> & {
  statut?: 'brouillon' | 'livre' | 'facture' | 'annule';
  lignes?: LigneBLPayload[];
};

export function useBonsLivraison(filters?: { statut?: Ref<string | undefined> }) {
  const { emit, on } = useDataBus();

  const query = computed(() => {
    const params: Record<string, string | number> = { limit: 100 };
    if (filters?.statut?.value) params.statut = filters.statut.value;
    return params;
  });

  const {
    data: blData,
    pending,
    error,
    refresh,
  } = useFetch<ApiListResponse<BonLivraisonWithClient>>('/api/bons-livraison', {
    key: 'bons-livraison-list',
    query,
    lazy: true,
    dedupe: 'defer',
  });

  on(['bl:created', 'bl:updated', 'bl:deleted', 'bl:converti'], () => refresh());

  const bonsLivraison = computed<BonLivraisonWithClient[]>(() => blData.value?.data ?? []);
  const pagination = computed(() => blData.value?.pagination);

  async function createBL(payload: CreateBLPayload): Promise<BonLivraison> {
    const res = await $fetch<ApiResponse<BonLivraison>>('/api/bons-livraison', {
      method: 'POST',
      body: payload,
    });
    emit('bl:created', { id: res.data?.id });
    emit('stock:mouvement', {});
    return res.data;
  }

  async function updateBL(id: string, payload: UpdateBLPayload): Promise<BonLivraison> {
    const res = await $fetch<ApiResponse<BonLivraison>>(`/api/bons-livraison/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('bl:updated', { id });
    if (payload.statut === 'annule') emit('stock:mouvement', {});
    return res.data;
  }

  async function deleteBL(id: string): Promise<void> {
    await $fetch(`/api/bons-livraison/${id}`, { method: 'DELETE' });
    emit('bl:deleted', { id });
    emit('stock:mouvement', {});
  }

  async function convertirEnFacture(
    id: string,
  ): Promise<{ bl: BonLivraison; transaction: Record<string, unknown> }> {
    const res = await $fetch<
      ApiResponse<{ bl: BonLivraison; transaction: Record<string, unknown> }>
    >(`/api/bons-livraison/${id}/convertir`, { method: 'POST' });
    emit('bl:converti', { id });
    emit('vente:created', {
      id: (res.data?.transaction as Record<string, unknown>)?.id as string | undefined,
    });
    return res.data;
  }

  /** Facture groupée : N bons d'un même client → 1 facture (facturation mensuelle). */
  async function facturerGroupe(
    blIds: string[],
  ): Promise<{ transaction: Record<string, unknown>; count: number }> {
    const res = await $fetch<ApiResponse<{ transaction: Record<string, unknown>; count: number }>>(
      '/api/bons-livraison/facturer-groupe',
      { method: 'POST', body: { blIds } },
    );
    blIds.forEach((id) => emit('bl:converti', { id }));
    emit('vente:created', {
      id: (res.data?.transaction as Record<string, unknown>)?.id as string | undefined,
    });
    return res.data;
  }

  return {
    bonsLivraison,
    pagination,
    pending,
    error,
    refresh,
    createBL,
    updateBL,
    deleteBL,
    convertirEnFacture,
    facturerGroupe,
  } as const;
}
