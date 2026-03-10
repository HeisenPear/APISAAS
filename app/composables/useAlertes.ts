import type { ApiListResponse } from '~/types/api';

export interface Alerte {
  id: string;
  type: string;
  titre: string;
  message: string | null;
  priorite: string | null;
  lue: boolean;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export function useAlertes() {
  const { emit } = useDataBus();
  const notifications = useNotifications();

  async function list(
    params: {
      page?: number;
      limit?: number;
      lue?: 'true' | 'false' | 'all';
      priorite?: string;
    } = {},
  ): Promise<ApiListResponse<Alerte>> {
    return $fetch('/api/alertes', { query: params });
  }

  async function markRead(id: string, lue = true): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/alertes/${id}`, {
      method: 'PUT',
      body: { lue },
    });
    emit('alerte:read', { id });
  }

  async function remove(id: string): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/alertes/${id}`, {
      method: 'DELETE',
    });
    emit('alerte:deleted', { id });
  }

  async function generate(): Promise<number> {
    const res = await $fetch<{ data: { created: number } }>('/api/alertes/generate', {
      method: 'POST',
    });
    return res.data.created;
  }

  async function markAllRead(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => markRead(id)));
  }

  return { list, markRead, remove, generate, markAllRead, notifications };
}
