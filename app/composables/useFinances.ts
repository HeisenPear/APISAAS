import type { Transaction } from '~/types/models';
import type { ApiResponse } from '~/types/api';

interface LigneInput {
  description: string;
  quantite: number;
  prixUnitaire: number;
  /**
   * ⚠️ FACULTATIF, ET IGNORÉ PAR LE SERVEUR. Aucun schéma Zod d'entrée ne
   * déclare `total` — Zod retire les clés inconnues, donc un total envoyé est
   * jeté sans bruit puis recalculé par `ligneTotalHt`. Le déclarer OBLIGATOIRE
   * ici forçait chaque appelant à en fabriquer un, et faisait croire au client
   * qu'il choisit le montant : c'est exactement ce que `pricing.ts` interdit
   * en capitales depuis le premier jour.
   *
   * Il reste toléré parce que les lignes RELUES d'une facture le portent —
   * les renvoyer telles quelles à l'édition ne doit pas exiger de les élaguer.
   */
  total?: number;
  tauxTva?: number;
  stockId?: string;
  // Tarification format/poids + traçabilité miel — préservées à l'édition
  modePrix?: 'format' | 'poids';
  contenance?: number | null;
  uniteContenance?: string;
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
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
  remise?: number | null;
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
  /**
   * ⚠️ `sent` N'EST PAS DÉCORATIF. La route ne le met à `true` qu'après un envoi
   * accepté par le service d'email ; un refus remonte en 502. L'appelant DOIT
   * le lire avant d'annoncer quoi que ce soit — c'est exactement l'étape qui
   * manquait quand l'écran affichait « Facture envoyée à … » sur un échec.
   */
  async function envoyerFactureEmail(id: string, pdfBase64: string) {
    const { data } = await $fetch<
      ApiResponse<{ sent: boolean; numero: string | null; envoyeLe: string }>
    >(`/api/finances/factures/${id}/email`, { method: 'POST', body: { pdfBase64 } });
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
