export interface CopiloteMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Libellés des outils utilisés pendant la génération (affichage « activité ») */
  tools?: string[];
  /** Questions de rebond proposées sous la réponse */
  suggestions?: string[];
  /** Raccourci (deep-link) proposé sous la réponse. */
  nav?: { label: string; to: string };
  /** Action d'écriture en attente de confirmation (boutons Confirmer/Annuler). */
  pending?: { actionId: 'intervention'; params: Record<string, unknown> };
}

export interface CopiloteQuota {
  utilise: number;
  max: number | null;
}

interface ErreurApi {
  code?: string;
  message?: string;
  requiredPlan?: string;
  max?: number;
}

/**
 * Client du Copilote IA — gère l'historique, le streaming SSE (fetch +
 * ReadableStream, EventSource ne supportant pas POST) et les états d'erreur
 * plan/quota. Historique persisté en sessionStorage (léger, par onglet).
 */
export function useCopilote() {
  const messages = ref<CopiloteMessage[]>([]);
  const streaming = ref(false);
  const activite = ref<string | null>(null);
  const quota = ref<CopiloteQuota | null>(null);
  const erreur = ref<ErreurApi | null>(null);
  // Réponses rapides proposées sous la dernière réponse de l'assistant
  const suggestions = ref<string[]>([]);

  // Restaure la conversation de l'onglet
  if (import.meta.client) {
    try {
      const saved = sessionStorage.getItem('apigo_copilote');
      if (saved) messages.value = JSON.parse(saved);
    } catch {
      /* sessionStorage indisponible */
    }
  }

  function persist() {
    try {
      sessionStorage.setItem('apigo_copilote', JSON.stringify(messages.value.slice(-30)));
    } catch {
      /* plein ou indisponible */
    }
  }

  function reset() {
    messages.value = [];
    erreur.value = null;
    persist();
  }

  /** Les 12 derniers tours porteurs de contenu comme contexte d'envoi. */
  function contexte() {
    return messages.value
      .filter((m) => m.content)
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  /**
   * Tronc commun : ajoute une bulle assistant, lance la requête SSE et stream
   * la réponse. `bullesAjoutees` = nombre de bulles déjà poussées par l'appelant
   * (la question utilisateur) à retirer aussi en cas d'échec avant le stream.
   */
  async function lancer(body: object, bullesAjoutees: number): Promise<void> {
    messages.value.push({ role: 'assistant', content: '', tools: [], suggestions: [] });
    // IMPORTANT : récupérer la version RÉACTIVE depuis le tableau (proxy Vue).
    // Muter l'objet brut poussé ne déclenche aucun re-render — le texte
    // streamé n'apparaissait qu'après un changement de page.
    const assistant = messages.value[messages.value.length - 1]!;
    const total = bullesAjoutees + 1;
    streaming.value = true;
    activite.value = 'Réflexion…';

    try {
      const res = await fetch('/api/ia/copilote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          data?: ErreurApi;
          message?: string;
        } | null;
        erreur.value = errBody?.data ?? { message: errBody?.message ?? `Erreur ${res.status}` };
        messages.value.splice(-total, total); // retire la question + la bulle vide
        return;
      }

      await lireStream(res, assistant);
    } catch {
      erreur.value = { message: 'Connexion interrompue. Vérifiez votre réseau et réessayez.' };
      if (!assistant.content) messages.value.splice(-total, total);
    } finally {
      streaming.value = false;
      activite.value = null;
      persist();
    }
  }

  async function envoyer(question: string): Promise<void> {
    const q = question.trim();
    if (!q || streaming.value) return;

    erreur.value = null;
    suggestions.value = [];
    messages.value.push({ role: 'user', content: q });
    await lancer({ messages: contexte() }, 1);
  }

  /** Confirme une action d'écriture en attente → l'exécute côté serveur. */
  async function confirmerAction(msg: CopiloteMessage): Promise<void> {
    if (streaming.value || !msg.pending) return;
    const { actionId, params } = msg.pending;
    msg.pending = undefined; // retire les boutons : l'action ne peut être lancée qu'une fois
    erreur.value = null;
    suggestions.value = [];
    persist();
    // `messages` accompagne la requête (le serveur l'ignore en mode exécution),
    // car le schéma de la route l'exige toujours.
    await lancer({ messages: contexte(), action: { type: 'execute', actionId, params } }, 0);
  }

  /** Annule une action d'écriture en attente (sans rien écrire). */
  function annulerAction(msg: CopiloteMessage): void {
    if (!msg.pending) return;
    msg.pending = undefined;
    msg.content = msg.content ? `${msg.content}\n\n_(Action annulée.)_` : '_(Action annulée.)_';
    persist();
  }

  async function lireStream(res: Response, assistant: CopiloteMessage): Promise<void> {
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Pas de stream');
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Frames SSE séparées par double saut de ligne
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const line = frame.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        let evt: {
          type: string;
          delta?: string;
          label?: string;
          message?: string;
          quota?: CopiloteQuota;
          items?: string[];
          to?: string;
          actionId?: 'intervention';
          params?: Record<string, unknown>;
        };
        try {
          evt = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (evt.type === 'text' && evt.delta) {
          assistant.content += evt.delta;
          activite.value = null;
        } else if (evt.type === 'tool' && evt.label) {
          activite.value = evt.label;
          if (!assistant.tools!.includes(evt.label)) assistant.tools!.push(evt.label);
        } else if (evt.type === 'suggestions' && evt.items) {
          assistant.suggestions = evt.items;
          suggestions.value = evt.items;
        } else if (evt.type === 'navigation' && evt.to && evt.label) {
          assistant.nav = { label: evt.label, to: evt.to };
        } else if (evt.type === 'confirm' && evt.actionId && evt.params) {
          assistant.pending = { actionId: evt.actionId, params: evt.params };
        } else if (evt.type === 'done') {
          quota.value = evt.quota ?? null;
        } else if (evt.type === 'error') {
          if (!assistant.content) assistant.content = evt.message ?? 'Erreur du Copilote.';
        }
      }
    }
  }

  return {
    messages,
    streaming,
    activite,
    quota,
    suggestions,
    erreur,
    envoyer,
    confirmerAction,
    annulerAction,
    reset,
  };
}
