import type { ApiResponse } from '~/types/api';

interface Organisation {
  id: string;
  nom: string;
  type: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  email?: string;
  telephone?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrganisationInput {
  nom: string;
  type: string;
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  email?: string;
  telephone?: string;
}

export function useOrganisation() {
  const {
    data: orgData,
    status,
    refresh,
  } = useFetch<ApiResponse<Organisation | null>>('/api/organisations/mine', {
    key: 'organisation-mine',
    default: () => ({ data: null }),
  });

  const organisation = computed(() => orgData.value?.data ?? null);
  const pending = computed(() => status.value === 'pending');

  async function createOrganisation(input: CreateOrganisationInput): Promise<Organisation> {
    const { data } = await $fetch<ApiResponse<Organisation>>('/api/organisations', {
      method: 'POST',
      body: input,
    });
    await refresh();
    return data;
  }

  async function updateOrganisation(
    id: string,
    input: Partial<CreateOrganisationInput>,
  ): Promise<Organisation> {
    const { data } = await $fetch<ApiResponse<Organisation>>(`/api/organisations/${id}`, {
      method: 'PUT',
      body: input,
    });
    await refresh();
    return data;
  }

  return { organisation, pending, refresh, createOrganisation, updateOrganisation };
}
