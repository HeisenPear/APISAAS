import type { ApiResponse, ApiListResponse } from '~/types/api';

export interface ProduitCampagne {
  id: string;
  campagneId: string;
  nom: string;
  description?: string;
  prixUnitaireHt: number;
  tauxTva: number;
  unite: string;
  stockDisponible?: number;
  categorie?: string;
  createdAt: string;
}

export interface CommandeLigne {
  produitId: string;
  produitNom: string;
  quantite: number;
  prixUnitaireHt: number;
  tauxTva: number;
  unite: string;
}

export interface Commande {
  id: string;
  campagneId: string;
  nom: string;
  email?: string;
  telephone?: string;
  statut: 'en_attente' | 'validee' | 'annulee' | 'livree';
  modePaiement?: string;
  lignes: CommandeLigne[];
  totalHt: number;
  totalTtc: number;
  notes?: string;
  createdAt: string;
}

export interface Campagne {
  id: string;
  organisationId: string;
  nom: string;
  description?: string;
  statut: 'brouillon' | 'ouverte' | 'fermee' | 'terminee';
  dateOuverture?: string;
  dateFermeture?: string;
  tokenPublic?: string;
  notes?: string;
  produits?: ProduitCampagne[];
  commandesCount?: number;
  totalHt?: number;
  totalTtc?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateCampagneInput {
  nom: string;
  description?: string;
  dateOuverture?: string;
  dateFermeture?: string;
  notes?: string;
}

interface CreateProduitInput {
  nom: string;
  description?: string;
  prixUnitaireHt: number;
  tauxTva: number;
  unite: string;
  stockDisponible?: number;
  categorie?: string;
}

interface SaisieCommandeInput {
  nom: string;
  email?: string;
  telephone?: string;
  modePaiement?: string;
  lignes: Array<{ produitId: string; quantite: number }>;
  notes?: string;
}

export function useCampagnes() {
  const {
    data: campagnesData,
    status,
    refresh,
  } = useFetch<ApiListResponse<Campagne>>('/api/campagnes', {
    key: 'campagnes-list',
    query: { limit: 100 },
    default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
  });

  const campagnes = computed(() => campagnesData.value?.data ?? []);
  const pagination = computed(() => campagnesData.value?.pagination);
  const pending = computed(() => status.value === 'pending');

  async function getCampagne(id: string): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>(`/api/campagnes/${id}`);
    return data;
  }

  async function createCampagne(input: CreateCampagneInput): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>('/api/campagnes', {
      method: 'POST',
      body: input,
    });
    return data;
  }

  async function updateCampagne(
    id: string,
    input: Partial<CreateCampagneInput>,
  ): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>(`/api/campagnes/${id}`, {
      method: 'PUT',
      body: input,
    });
    return data;
  }

  async function ouvrirCampagne(id: string): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>(`/api/campagnes/${id}/ouvrir`, {
      method: 'PUT',
    });
    return data;
  }

  async function fermerCampagne(id: string): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>(`/api/campagnes/${id}/fermer`, {
      method: 'PUT',
    });
    return data;
  }

  async function deleteCampagne(id: string): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/campagnes/${id}`, {
      method: 'DELETE',
    });
  }

  // Produits
  async function addProduit(
    campagneId: string,
    input: CreateProduitInput,
  ): Promise<ProduitCampagne> {
    const { data } = await $fetch<ApiResponse<ProduitCampagne>>(
      `/api/campagnes/${campagneId}/produits`,
      { method: 'POST', body: input },
    );
    return data;
  }

  async function updateProduit(
    campagneId: string,
    produitId: string,
    input: Partial<CreateProduitInput>,
  ): Promise<ProduitCampagne> {
    const { data } = await $fetch<ApiResponse<ProduitCampagne>>(
      `/api/campagnes/${campagneId}/produits/${produitId}`,
      { method: 'PUT', body: input },
    );
    return data;
  }

  async function deleteProduit(campagneId: string, produitId: string): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(
      `/api/campagnes/${campagneId}/produits/${produitId}`,
      { method: 'DELETE' },
    );
  }

  // Commandes
  async function getCommandes(campagneId: string): Promise<Commande[]> {
    const { data } = await $fetch<ApiListResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes`,
    );
    return data;
  }

  async function updateCommande(
    campagneId: string,
    commandeId: string,
    input: { statut: string },
  ): Promise<Commande> {
    const { data } = await $fetch<ApiResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes/${commandeId}`,
      { method: 'PUT', body: input },
    );
    return data;
  }

  async function saisieCommande(campagneId: string, input: SaisieCommandeInput): Promise<Commande> {
    const { data } = await $fetch<ApiResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes/saisie`,
      { method: 'POST', body: input },
    );
    return data;
  }

  // Public
  async function getCampagnePublique(token: string): Promise<Campagne> {
    const { data } = await $fetch<ApiResponse<Campagne>>(`/api/public/campagne/${token}`);
    return data;
  }

  async function passerCommandePublique(
    token: string,
    input: SaisieCommandeInput,
  ): Promise<Commande> {
    const { data } = await $fetch<ApiResponse<Commande>>(`/api/public/campagne/${token}/commande`, {
      method: 'POST',
      body: input,
    });
    return data;
  }

  return {
    campagnes,
    pagination,
    pending,
    refresh,
    getCampagne,
    createCampagne,
    updateCampagne,
    ouvrirCampagne,
    fermerCampagne,
    deleteCampagne,
    addProduit,
    updateProduit,
    deleteProduit,
    getCommandes,
    updateCommande,
    saisieCommande,
    getCampagnePublique,
    passerCommandePublique,
  };
}
