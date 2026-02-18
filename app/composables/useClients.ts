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
  notes?: string;
}

export function useClients() {
  async function createClient(input: CreateClientInput) {
    const { data } = await $fetch<ApiResponse<Client>>('/api/clients', {
      method: 'POST',
      body: input,
    });
    return data;
  }

  async function updateClient(id: string, input: Partial<CreateClientInput>) {
    const { data } = await $fetch<ApiResponse<Client>>(`/api/clients/${id}`, {
      method: 'PUT',
      body: input,
    });
    return data;
  }

  async function deleteClient(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/clients/${id}`, {
      method: 'DELETE',
    });
  }

  return { createClient, updateClient, deleteClient };
}
