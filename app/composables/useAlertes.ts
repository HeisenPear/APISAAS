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
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Préférences de notifications par CATÉGORIE (6 interrupteurs).
 * Chaque catégorie regroupe plusieurs types d'alertes — voir
 * server/utils/alertesCategories.ts (source de vérité du mapping type → catégorie).
 */
export interface NotifPrefs {
  sante: boolean;
  production: boolean;
  stock: boolean;
  saison: boolean;
  gestion: boolean;
  reglementaire: boolean;
  /** Résumé du jour poussé le matin — consolidé (tous les plans). */
  resume_quotidien: boolean;
  /** Heure d'envoi du résumé (heure locale Paris, 5-12). */
  heure_resume: number;
  /** Emails d'alerte urgente (météo dangereuse, sanitaire critique) — canal de secours. */
  email_urgent: boolean;
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
      sort?: 'date_desc' | 'date_asc' | 'priorite';
    } = {},
  ): Promise<ApiListResponse<Alerte>> {
    return appelApi('/api/alertes', { query: params });
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

  /** Suppression groupée : 'resolues' | 'lues' | 'toutes'. Renvoie le nombre supprimé. */
  async function removeMany(scope: 'resolues' | 'lues' | 'toutes'): Promise<number> {
    const res = await appelApi<{ data: { deleted: number } }>('/api/alertes/supprimer', {
      method: 'POST',
      body: { scope },
    });
    emit('alerte:deleted');
    return res.data.deleted;
  }

  async function generate(): Promise<number> {
    const res = await appelApi<{ data: { created: number } }>('/api/alertes/generate', {
      method: 'POST',
    });
    return res.data.created;
  }

  async function markAllRead(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => markRead(id)));
  }

  async function getNotifPrefs(): Promise<NotifPrefs> {
    const res = await appelApi<{ data: NotifPrefs }>('/api/alertes/notif-prefs');
    return res.data;
  }

  async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
    await appelApi('/api/alertes/notif-prefs', { method: 'PUT', body: prefs });
  }

  return {
    list,
    markRead,
    remove,
    removeMany,
    generate,
    markAllRead,
    getNotifPrefs,
    saveNotifPrefs,
    notifications,
  };
}
