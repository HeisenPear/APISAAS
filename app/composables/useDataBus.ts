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
    const abonnes = listeners.get(event);
    if (!abonnes) return;

    /**
     * ⚠️ CHAQUE ABONNÉ EST ISOLÉ, ET CE N'EST PAS DE LA PRUDENCE DÉCORATIVE.
     *
     * `ruche:created` a une quinzaine d'abonnés : la barre latérale, le tableau
     * de bord, la page ouverte, le pont PostHog, le traceur d'activité. Sans ce
     * `try`, le PREMIER qui lève emporte tous les suivants — et bien plus loin
     * que le bus : `emit` est appelé depuis la boucle SSE de `useCopilote`,
     * elle-même sous un `catch` qui affiche « Connexion interrompue » et RETIRE
     * la question du fil.
     *
     * Conséquence mesurée : une ruche parfaitement écrite côté serveur, un
     * tableau de bord jamais rafraîchi, un faux message d'erreur réseau, le
     * bouton « Annuler » perdu — donc une écriture qui n'est plus défaisable —
     * et le quota jamais reçu. Un `posthog.capture` bloqué par un bloqueur de
     * publicité suffit à déclencher toute la séquence.
     *
     * ⚠️ ET ON ITÈRE SUR UNE COPIE. Un abonné qui se désabonne pendant la
     * diffusion (`onUnmounted` déclenché par une navigation que l'événement
     * vient de provoquer) modifierait le `Set` en cours de parcours.
     */
    for (const abonne of [...abonnes]) {
      try {
        abonne(payload);
      } catch (err) {
        console.error(`[bus] un abonné à « ${event} » a levé — les autres continuent :`, err);
      }
    }
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
