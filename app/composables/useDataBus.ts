// Bus d'événements réactif pour invalidation de cache cross-module

/**
 * ⚠️ L'UNION A DÉMÉNAGÉ DANS `app/config/evenements-donnees.ts`, ET CE N'EST PAS
 * UN RANGEMENT.
 *
 * Elle vivait ici, dans un COMPOSABLE CLIENT. Le serveur ne pouvait donc pas la
 * lire — et Maya, qui écrit côté serveur, était le seul producteur d'écritures
 * du dépôt à ne pas pouvoir nommer ce qu'elle venait d'invalider.
 *
 * Elle n'est pas RÉEXPORTÉE d'ici : l'auto-import de Nuxt résout par NOM, et un
 * réexport fabriquerait un second chemin pour `DataEvent` — exactement ce que
 * `collisionsAutoImport` refuse, après l'avoir attrapé quatre fois.
 */
import type { DataEvent } from '~/config/evenements-donnees';

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
