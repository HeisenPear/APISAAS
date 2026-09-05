import type { Client } from '~/types/models';
import type { ApiResponse } from '~/types/api';

interface CreateClientInput {
  type?: 'particulier' | 'professionnel' | 'revendeur';
  nom: string;
  prenom?: string;
  entreprise?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siret?: string;
  siren?: string;
  adresseLivraison?: string;
  codePostalLivraison?: string;
  villeLivraison?: string;
  notes?: string;
}

export function useClients() {
  const { emit } = useDataBus();

  async function createClient(input: CreateClientInput) {
    const { data } = await appelApi<ApiResponse<Client>>('/api/clients', {
      method: 'POST',
      body: input,
    });
    emit('client:created', { id: data?.id });
    return data;
  }

  async function updateClient(id: string, input: Partial<CreateClientInput>) {
    const { data } = await appelApi<ApiResponse<Client>>(`/api/clients/${id}`, {
      method: 'PUT',
      body: input,
    });
    emit('client:updated', { id });
    return data;
  }

  async function deleteClient(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/clients/${id}`, {
      method: 'DELETE',
    });
    emit('client:deleted', { id });
  }

  return { createClient, updateClient, deleteClient };
}
