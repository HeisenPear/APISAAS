import type { ApiResponse } from '~/types/api';
import type { Membre } from '~/types/models';

interface MembreWithProfile extends Membre {
  userName: string | null;
  userPrenom: string | null;
}

export function useMembres() {
  async function listMembres(): Promise<MembreWithProfile[]> {
    const res = await $fetch<{ data: MembreWithProfile[] }>('/api/membres');
    return res.data;
  }

  async function inviteMembre(email: string, role: 'apiculteur' | 'comptable' = 'apiculteur') {
    const res = await $fetch<ApiResponse<Membre>>('/api/membres', {
      method: 'POST',
      body: { email, role },
    });
    return res.data;
  }

  async function updateRole(id: string, role: 'apiculteur' | 'comptable') {
    const res = await $fetch<ApiResponse<Membre>>(`/api/membres/${id}`, {
      method: 'PUT',
      body: { role },
    });
    return res.data;
  }

  async function removeMembre(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/membres/${id}`, {
      method: 'DELETE',
    });
  }

  async function acceptInvitation(membreId: string) {
    const res = await $fetch<ApiResponse<Membre>>('/api/membres/accept', {
      method: 'POST',
      body: { membreId },
    });
    return res.data;
  }

  return {
    listMembres,
    inviteMembre,
    updateRole,
    removeMembre,
    acceptInvitation,
  };
}
