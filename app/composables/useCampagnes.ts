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
  /**
   * ⚠️ CES DEUX CHAMPS MANQUAIENT, ET LE TOTAL ANNONCÉ ÉTAIT FAUX. La table
   * `produits_campagne` les porte, la route les renvoie, et
   * `tariferCommandeCampagne` s'en sert pour chiffrer la commande — mais le
   * type ne les déclarait pas, donc aucun écran ne pouvait les lire. Un produit
   * tarifé au poids s'affichait au vingt-cinquième de ce qui allait être
   * enregistré.
   */
  modePrix?: 'format' | 'poids' | null;
  contenance?: string | number | null;
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

/**
 * ⚠️ TOUS LES APPELS DE CE FICHIER PASSENT PAR `appelApi`, PAS PAR `$fetch` NI
 * `useFetch` — cf. `app/utils/appelApi.ts`, qui porte la mesure complète.
 *
 * Deux d'entre eux portaient déjà le contournement local
 * `($fetch as typeof $fetch<unknown, string>)`, écrit sans dire pourquoi :
 * c'est la même cause. Typer un chemin contre l'union des 213 routes oblige
 * TypeScript à déplier le type de retour réel de chaque handler (chaînes
 * Drizzle, inférences Zod) — 9,3 millions d'instanciations pour une limite de 5.
 * Les types sont donnés ici, donc toujours vérifiés chez l'appelant.
 */
export function useCampagnes() {
  const {
    data: campagnesData,
    status,
    refresh,
  } = useAsyncData<ApiListResponse<Campagne>>(
    'campagnes-list',
    // `query` n'existe pas sur `useAsyncData` : le `limit` est sérialisé dans
    // l'URL. Il est constant, donc l'URL l'est aussi.
    () => appelApi<ApiListResponse<Campagne>>('/api/campagnes?limit=100'),
    {
      // Type annoncé : sans lui, `[]` s'infère en `never[]`.
      default: (): ApiListResponse<Campagne> => ({
        data: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
      }),
    },
  );

  const campagnes = computed(() => campagnesData.value?.data ?? []);
  const pagination = computed(() => campagnesData.value?.pagination);
  const pending = computed(() => status.value === 'pending');

  async function getCampagne(id: string): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>(`/api/campagnes/${id}`);
    return data;
  }

  async function createCampagne(input: CreateCampagneInput): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>('/api/campagnes', {
      method: 'POST',
      body: input,
    });
    return data;
  }

  async function updateCampagne(
    id: string,
    input: Partial<CreateCampagneInput>,
  ): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>(`/api/campagnes/${id}`, {
      method: 'PUT',
      body: input,
    });
    return data;
  }

  async function ouvrirCampagne(id: string): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>(`/api/campagnes/${id}/ouvrir`, {
      method: 'PUT',
    });
    return data;
  }

  async function fermerCampagne(id: string): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>(`/api/campagnes/${id}/fermer`, {
      method: 'PUT',
    });
    return data;
  }

  async function deleteCampagne(id: string): Promise<void> {
    await appelApi<unknown>(`/api/campagnes/${id}`, {
      method: 'DELETE',
    });
  }

  // Produits
  async function addProduit(
    campagneId: string,
    input: CreateProduitInput,
  ): Promise<ProduitCampagne> {
    const { data } = await appelApi<ApiResponse<ProduitCampagne>>(
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
    const { data } = await appelApi<ApiResponse<ProduitCampagne>>(
      `/api/campagnes/${campagneId}/produits/${produitId}`,
      { method: 'PUT', body: input },
    );
    return data;
  }

  async function deleteProduit(campagneId: string, produitId: string): Promise<void> {
    await appelApi<unknown>(`/api/campagnes/${campagneId}/produits/${produitId}`, {
      method: 'DELETE',
    });
  }

  // Commandes
  async function getCommandes(campagneId: string): Promise<Commande[]> {
    const { data } = await appelApi<ApiListResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes`,
    );
    return data;
  }

  async function updateCommande(
    campagneId: string,
    commandeId: string,
    input: { statut: string },
  ): Promise<Commande> {
    const { data } = await appelApi<ApiResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes/${commandeId}`,
      { method: 'PUT', body: input },
    );
    return data;
  }

  async function saisieCommande(campagneId: string, input: SaisieCommandeInput): Promise<Commande> {
    const { data } = await appelApi<ApiResponse<Commande>>(
      `/api/campagnes/${campagneId}/commandes/saisie`,
      { method: 'POST', body: input },
    );
    return data;
  }

  // Public
  async function getCampagnePublique(token: string): Promise<Campagne> {
    const { data } = await appelApi<ApiResponse<Campagne>>(`/api/public/campagne/${token}`);
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
  };
}
