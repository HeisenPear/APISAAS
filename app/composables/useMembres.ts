import type { Membre } from '~/types/models';

interface MembreWithProfile extends Membre {
  userName: string | null;
  userPrenom: string | null;
}

interface InvitationReceived {
  id: string;
  ownerId: string;
  email: string;
  role: 'admin' | 'apiculteur' | 'comptable';
  statut: string;
  invitedAt: string;
  ownerNom: string | null;
  ownerPrenom: string | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useMembres() {
  const { emit } = useDataBus();

  const membresData = ref<MembreWithProfile[]>([]);
  const pagination = ref<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const loading = ref(false);

  async function fetchMembres(page = 1, limit = 20) {
    loading.value = true;
    try {
      const res = await $fetch<{ data: MembreWithProfile[]; pagination: PaginationMeta }>(
        '/api/membres',
        { query: { page, limit } },
      );
      membresData.value = res.data;
      pagination.value = res.pagination;
    } finally {
      loading.value = false;
    }
  }

  async function inviterMembre(
    email: string,
    role: 'admin' | 'apiculteur' | 'comptable' = 'apiculteur',
  ) {
    const res = await $fetch<{ data: Membre }>('/api/membres/inviter', {
      method: 'POST',
      body: { email, role },
    });
    emit('membre:invited');
    return res.data;
  }

  async function changerRole(id: string, role: 'admin' | 'apiculteur' | 'comptable') {
    const res = await $fetch<{ data: Membre }>(`/api/membres/${id}`, {
      method: 'PUT',
      body: { role },
    });
    emit('membre:updated', { id });
    return res.data;
  }

  async function revoquer(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/membres/${id}`, {
      method: 'DELETE',
    });
    emit('membre:removed', { id });
  }

  async function accepterInvitation(membreId: string) {
    const res = await $fetch<{ data: Membre }>('/api/membres/accepter', {
      method: 'POST',
      body: { membreId },
    });
    return res.data;
  }

  async function fetchInvitations() {
    const res = await $fetch<{ data: InvitationReceived[] }>('/api/membres/invitations');
    return res.data;
  }

  async function refuserInvitation(membreId: string) {
    await $fetch('/api/membres/refuser', { method: 'POST', body: { membreId } });
  }

  return {
    membresData,
    pagination,
    loading,
    fetchMembres,
    inviterMembre,
    changerRole,
    revoquer,
    accepterInvitation,
    fetchInvitations,
    refuserInvitation,
  };
}
