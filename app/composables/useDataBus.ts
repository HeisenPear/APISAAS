// Bus d'événements réactif pour invalidation de cache cross-module

type DataEvent =
  | 'rucher:created'
  | 'rucher:updated'
  | 'rucher:deleted'
  | 'ruche:created'
  | 'ruche:updated'
  | 'ruche:deleted'
  | 'intervention:created'
  | 'intervention:updated'
  | 'intervention:deleted'
  | 'recolte:created'
  | 'recolte:updated'
  | 'recolte:deleted'
  | 'stock:created'
  | 'stock:updated'
  | 'stock:deleted'
  | 'stock:mouvement'
  | 'client:created'
  | 'client:updated'
  | 'client:deleted'
  | 'vente:created'
  | 'vente:updated'
  | 'vente:deleted'
  | 'achat:created'
  | 'alerte:read'
  | 'alerte:deleted'
  | 'membre:invited'
  | 'membre:updated'
  | 'membre:removed'
  | 'bl:created'
  | 'bl:updated'
  | 'bl:deleted'
  | 'bl:converti'
  | 'visite_rucher:created'
  | 'hausse:created'
  | 'hausse:updated'
  | 'hausse:deleted'
  | 'veterinaire:created'
  | 'veterinaire:updated'
  | 'veterinaire:deleted'
  | 'emplacement:created'
  | 'emplacement:updated'
  | 'emplacement:deleted'
  | 'lignee:created'
  | 'lignee:updated'
  | 'lignee:deleted'
  | 'reine:created'
  | 'reine:updated'
  | 'reine:deleted'
  | 'reine:tested'
  | 'session_greffage:created'
  | 'session_greffage:updated'
  | 'session_greffage:deleted';

export type { DataEvent };

export interface DataEventPayload {
  id?: string;
  parentId?: string;
  extra?: Record<string, unknown>;
}

// Module-level listeners — singleton client-side
const listeners = new Map<DataEvent, Set<(payload?: DataEventPayload) => void>>();

export function useDataBus() {
  function emit(event: DataEvent, payload?: DataEventPayload) {
    if (!import.meta.client) return;
    listeners.get(event)?.forEach((fn) => fn(payload));
  }

  function on(event: DataEvent | DataEvent[], handler: (payload?: DataEventPayload) => void) {
    if (!import.meta.client) return () => {};

    const events = Array.isArray(event) ? event : [event];
    events.forEach((e) => {
      if (!listeners.has(e)) listeners.set(e, new Set());
      listeners.get(e)!.add(handler);
    });

    // Cleanup automatique au unmount du composant
    if (getCurrentInstance()) {
      onUnmounted(() => {
        events.forEach((e) => listeners.get(e)?.delete(handler));
      });
    }

    return () => {
      events.forEach((e) => listeners.get(e)?.delete(handler));
    };
  }

  return { emit, on };
}
