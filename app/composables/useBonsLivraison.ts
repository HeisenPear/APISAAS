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
  /**
   * Le nom du réceptionnaire. La DATE n'est pas envoyée : le serveur horodate,
   * sans quoi on pourrait antidater une preuve de livraison — précisément ce
   * qu'un bon signé sert à empêcher.
   */
  signatureNom?: string | null;
};

export function useBonsLivraison(filters?: { statut?: Ref<string | undefined> }) {
  const { emit, on } = useDataBus();

  const query = computed(() => {
    const params: Record<string, string | number> = { limit: 100 };
    if (filters?.statut?.value) params.statut = filters.statut.value;
    return params;
  });

  /** La `query` de `useFetch` n'existe pas sur `useAsyncData` : on la sérialise. */
  function urlCourante(): string {
    const params = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(query.value)) params.set(cle, String(valeur));
    return `/api/bons-livraison?${params.toString()}`;
  }

  /**
   * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
   * Typer ce chemin contre l'union des 213 routes fait déplier à TypeScript le
   * type de retour réel de chaque handler. Le `watch: [query]` rejoue ce que
   * `useFetch` faisait tout seul avec une `query` réactive.
   */
  const {
    data: blData,
    pending,
    error,
    refresh,
  } = useAsyncData<ApiListResponse<BonLivraisonWithClient>>(
    'bons-livraison-list',
    () => appelApi<ApiListResponse<BonLivraisonWithClient>>(urlCourante()),
    { lazy: true, dedupe: 'defer', watch: [query] },
  );

  on(['bl:created', 'bl:updated', 'bl:deleted', 'bl:converti'], () => refresh());

  const bonsLivraison = computed<BonLivraisonWithClient[]>(() => blData.value?.data ?? []);
  const pagination = computed(() => blData.value?.pagination);

  /**
   * ⚠️ LES MUTATIONS QUI SUIVENT PASSENT PAR `appelApi`, PAS PAR `$fetch` —
   * cf. `app/utils/appelApi.ts` : résoudre le chemin contre l'union des 213
   * routes déplie le type de retour réel de chaque handler, et le projet est
   * au-delà de la limite d'instanciation de TypeScript. Le type est donné, donc
   * toujours vérifié chez l'appelant.
   */
  async function createBL(payload: CreateBLPayload): Promise<BonLivraison> {
    const res = await appelApi<ApiResponse<BonLivraison>>('/api/bons-livraison', {
      method: 'POST',
      body: payload,
    });
    emit('bl:created', { id: res.data?.id });
    emit('stock:mouvement', {});
    return res.data;
  }

  async function updateBL(id: string, payload: UpdateBLPayload): Promise<BonLivraison> {
    const res = await appelApi<ApiResponse<BonLivraison>>(`/api/bons-livraison/${id}`, {
      method: 'PUT',
      body: payload,
    });
    emit('bl:updated', { id });
    /**
     * ⚠️ L'ANNULATION N'EST PLUS LE SEUL GESTE QUI BOUGE LE STOCK. Depuis que
     * les quatre portes passent par la même mécanique, ÉDITER LES LIGNES et
     * RÉ-OUVRIR un bon annulé en déplacent aussi. Ne prévenir que sur
     * `'annule'`, c'était laisser les écrans de stock afficher un chiffre
     * périmé après une correction de quantité — un mouvement réel dont
     * personne n'était averti.
     *
     * On prévient donc dès que le geste a PU en produire un : un rafraîchissement
     * de trop ne coûte rien, un manquant se voit des jours plus tard.
     */
    if (payload.statut !== undefined || payload.lignes !== undefined) {
      emit('stock:mouvement', {});
    }
    return res.data;
  }

  async function deleteBL(id: string): Promise<void> {
    await appelApi<unknown>(`/api/bons-livraison/${id}`, { method: 'DELETE' });
    emit('bl:deleted', { id });
    emit('stock:mouvement', {});
  }

  async function convertirEnFacture(
    id: string,
  ): Promise<{ bl: BonLivraison; transaction: Record<string, unknown> }> {
    const res = await appelApi<
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
    const res = await appelApi<
      ApiResponse<{ transaction: Record<string, unknown>; count: number }>
    >('/api/bons-livraison/facturer-groupe', { method: 'POST', body: { blIds } });
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
