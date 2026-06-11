export interface CopiloteMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Libellés des outils utilisés pendant la génération (affichage « activité ») */
  tools?: string[];
  /** Questions de rebond proposées sous la réponse */
  suggestions?: string[];
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

  async function envoyer(question: string): Promise<void> {
    const q = question.trim();
    if (!q || streaming.value) return;

    erreur.value = null;
    suggestions.value = [];
    messages.value.push({ role: 'user', content: q });
    messages.value.push({ role: 'assistant', content: '', tools: [], suggestions: [] });
    // IMPORTANT : récupérer la version RÉACTIVE depuis le tableau (proxy Vue).
    // Muter l'objet brut poussé ne déclenche aucun re-render — le texte
    // streamé n'apparaissait qu'après un changement de page.
    const assistant = messages.value[messages.value.length - 1]!;
    streaming.value = true;
    activite.value = 'Réflexion…';

    try {
      const res = await fetch('/api/ia/copilote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Les 12 derniers tours suffisent comme contexte
          messages: messages.value
            .slice(0, -1)
            .slice(-12)
            .filter((m) => m.content)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          data?: ErreurApi;
          message?: string;
        } | null;
        erreur.value = body?.data ?? { message: body?.message ?? `Erreur ${res.status}` };
        messages.value.splice(-2, 2); // retire la question + la bulle vide
        return;
      }

      await lireStream(res, assistant);
    } catch {
      erreur.value = { message: 'Connexion interrompue. Vérifiez votre réseau et réessayez.' };
      if (!assistant.content) messages.value.splice(-2, 2);
    } finally {
      streaming.value = false;
      activite.value = null;
      persist();
    }
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
        } else if (evt.type === 'done') {
          quota.value = evt.quota ?? null;
        } else if (evt.type === 'error') {
          if (!assistant.content) assistant.content = evt.message ?? 'Erreur du Copilote.';
        }
      }
    }
  }

  return { messages, streaming, activite, quota, suggestions, erreur, envoyer, reset };
}
