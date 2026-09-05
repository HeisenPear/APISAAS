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

/**
 * ⚠️ TOUS LES APPELS DE CE FICHIER PASSENT PAR `appelApi` — cf.
 * `app/utils/appelApi.ts`. `useFetch`/`$fetch` typent leur réponse en résolvant
 * le chemin contre l'union des 213 routes, ce qui oblige TypeScript à déplier
 * le type de retour réel de chaque handler. Les types sont donnés ici, donc
 * toujours vérifiés chez l'appelant.
 */
export function useOrganisation() {
  const {
    data: orgData,
    status,
    refresh,
  } = useAsyncData<ApiResponse<Organisation | null>>(
    'organisation-mine',
    () => appelApi<ApiResponse<Organisation | null>>('/api/organisations/mine'),
    {
      lazy: true,
      default: (): ApiResponse<Organisation | null> => ({ data: null }),
    },
  );

  const organisation = computed(() => orgData.value?.data ?? null);
  const pending = computed(() => status.value === 'pending');

  async function createOrganisation(input: CreateOrganisationInput): Promise<Organisation> {
    const { data } = await appelApi<ApiResponse<Organisation>>('/api/organisations', {
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
    const { data } = await appelApi<ApiResponse<Organisation>>(`/api/organisations/${id}`, {
      method: 'PUT',
      body: input,
    });
    await refresh();
    return data;
  }

  return { organisation, pending, refresh, createOrganisation, updateOrganisation };
}
