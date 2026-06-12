import type { Transaction } from '~/types/models';
import type { ApiResponse } from '~/types/api';

interface LigneInput {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva?: number;
  stockId?: string;
}

interface CreateVenteInput {
  clientId?: string;
  dateTransaction: string;
  dateEcheance?: string;
  lignes: LigneInput[];
  tauxTva?: number;
  remise?: number;
  notes?: string;
  categorie?: string;
  statut?: 'brouillon' | 'envoyee' | 'payee';
  categorieOperation?: 'livraison_biens' | 'prestation_services' | 'mixte';
}

interface CreateAchatInput {
  dateTransaction: string;
  lignes: LigneInput[];
  tauxTva?: number;
  notes?: string;
  categorie?: string;
  statut?: 'brouillon' | 'payee';
  isRecurring?: boolean;
  recurringInterval?: 'mensuel' | 'annuel';
}

interface UpdateFactureInput {
  clientId?: string | null;
  dateTransaction?: string;
  dateEcheance?: string | null;
  statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  lignes?: LigneInput[];
  tauxTva?: number;
  notes?: string | null;
  categorie?: string | null;
}

export function useFinances() {
  const { emit } = useDataBus();

  async function createVente(input: CreateVenteInput) {
    const { data } = await $fetch<ApiResponse<Transaction>>('/api/finances/ventes', {
      method: 'POST',
      body: input,
    });
    emit('vente:created', { id: data?.id });
    return data;
  }

  async function createAchat(input: CreateAchatInput) {
    const { data } = await $fetch<ApiResponse<Transaction>>('/api/finances/achats', {
      method: 'POST',
      body: input,
    });
    emit('achat:created', { id: data?.id });
    return data;
  }

  async function updateFacture(id: string, input: UpdateFactureInput) {
    const { data } = await $fetch<ApiResponse<Transaction>>(`/api/finances/factures/${id}`, {
      method: 'PUT',
      body: input,
    });
    emit('vente:updated', { id });
    return data;
  }

  async function deleteFacture(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/finances/factures/${id}`, {
      method: 'DELETE',
    });
    emit('vente:deleted', { id });
  }

  async function updateStatut(
    id: string,
    statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee',
  ) {
    return updateFacture(id, { statut });
  }

  /** Envoie la facture (PDF base64) au client par email. L'émet si brouillon. */
  async function envoyerFactureEmail(id: string, pdfBase64: string) {
    const { data } = await $fetch<ApiResponse<{ sent: boolean; numero: string | null }>>(
      `/api/finances/factures/${id}/email`,
      { method: 'POST', body: { pdfBase64 } },
    );
    emit('vente:updated', { id });
    return data;
  }

  return {
    createVente,
    createAchat,
    updateFacture,
    deleteFacture,
    updateStatut,
    envoyerFactureEmail,
  };
}
