/**
 * ⚠️ CE TYPE ÉTAIT UN MIROIR RECOPIÉ du serveur, et rien ne les tenait
 * ensemble : deux listes de cinq chaînes, dans deux fichiers, qui devaient
 * rester identiques par discipline. C'est maintenant un IMPORT — le catalogue
 * `app/config/maya-actions.ts` ne contient que des données, il traverse donc la
 * frontière client/serveur sans rien emporter du serveur avec lui.
 */
import { estEvenementDonnees } from '~/config/evenements-donnees';

export type { ActionId } from '~/config/maya-actions';

/** Bloc riche affiché sous une réponse de Maya (miroir client de BlocMaya serveur). */
export type BlocMaya =
  | {
      type: 'stats';
      items: { label: string; valeur: string; ton?: 'honey' | 'sage' | 'clay' | 'neutre' }[];
    }
  | { type: 'tableau'; titre?: string; colonnes: string[]; lignes: (string | number)[][] }
  | {
      type: 'graphe';
      titre?: string;
      forme?: 'barres' | 'ligne';
      serie: { label: string; valeur: number }[];
    }
  | {
      type: 'carte';
      titre?: string;
      texte?: string;
      actions: { label: string; to: string; icone?: string }[];
    }
  | {
      /** Aperçu consolidé d'un PLAN en lot (multi-étapes) avant confirmation. */
      type: 'plan';
      titre: string;
      resume: string[];
      etapes: { libelle: string; detail?: string }[];
    };

/** Plan (lot ou séquence) renvoyé pour exécution (miroir client de PlanMaya serveur). */
export interface PlanClient {
  type: 'lot' | 'sequence';
  titre: string;
  resume: string[];
  etapes: {
    id: string;
    actionId: ActionId;
    domaine: 'terrain' | 'commerce';
    libelle: string;
    params: Record<string, unknown>;
  }[];
}

export interface CopiloteMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Libellés des outils utilisés pendant la génération (affichage « activité ») */
  tools?: string[];
  /** Questions de rebond proposées sous la réponse */
  suggestions?: string[];
  /** Raccourci (deep-link) proposé sous la réponse. `auto` => navigation automatique. */
  nav?: { label: string; to: string; auto?: boolean };
  /** Action d'écriture en attente de confirmation (boutons Confirmer/Annuler). */
  pending?: { actionId: ActionId; params: Record<string, unknown> };
  /** PLAN en lot en attente de confirmation (Confirmer tout / Annuler). */
  pendingPlan?: { plan: PlanClient };
  /** Écriture déjà exécutée en autonomie, annulable en un clic (bouton « Annuler »). */
  undo?: { actionId: ActionId; id: string };
  /** Lot exécuté, annulable EN CASCADE en un clic (bouton « Tout annuler »). */
  undoPlan?: { planExecId: string };
  /** Blocs riches (stats, tableaux, graphes). */
  blocs?: BlocMaya[];
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
  /**
   * LE BUS D'INVALIDATION — c'est par ici que l'écriture de Maya atteint le
   * reste de l'application.
   *
   * ⚠️ MAYA ÉTAIT LE SEUL PRODUCTEUR D'ÉCRITURES DU DÉPÔT À NE RIEN ÉMETTRE.
   * Les vingt et un autres émetteurs sont des composables de domaine
   * (`useRuches`, `useClients`…) qui émettent après leur `$fetch`. Maya n'écrit
   * pas par eux : elle parle au serveur, qui écrit. Aucun `emit` n'avait donc
   * jamais lieu, et l'apiculteur voyait une carte de rucher garder son ancien
   * compte après avoir dicté « ajoute une ruche » — la jauge de plan, elle,
   * n'étant jamais démontée, ne se réparait même pas en changeant de page.
   */
  const { emit: emettreSurLeBus } = useDataBus();

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
      sessionStorage.setItem('apigo_copilote', JSON.stringify(messages.value.slice(-40)));
    } catch {
      /* plein ou indisponible */
    }
  }

  function reset() {
    messages.value = [];
    erreur.value = null;
    persist();
  }

  /**
   * Les derniers tours porteurs de contenu comme contexte d'envoi. Fenêtre LARGE
   * (40) : un flux d'intervention guidé peut faire ~16 messages (type + champs +
   * ruche), et le moteur reconstruit l'état depuis l'historique — si le message
   * « pivot » sort de la fenêtre, Maya « perd le fil » (la ruche n'est plus liée).
   */
  function contexte() {
    return messages.value
      .filter((m) => m.content)
      .slice(-40)
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

    // Maya « fait » l'action : navigation automatique vers la page demandée.
    if (assistant.nav?.auto && assistant.nav.to) {
      await navigateTo(assistant.nav.to);
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

  /** Confirme un PLAN en lot en attente → l'exécute (transactionnel) côté serveur. */
  async function confirmerPlan(msg: CopiloteMessage): Promise<void> {
    if (streaming.value || !msg.pendingPlan) return;
    const { plan } = msg.pendingPlan;
    msg.pendingPlan = undefined; // retire les boutons : exécution unique
    erreur.value = null;
    suggestions.value = [];
    persist();
    await lancer({ messages: contexte(), action: { type: 'executePlan', plan } }, 0);
  }

  /** Annule un PLAN en attente (sans rien écrire). */
  function annulerPlanProposition(msg: CopiloteMessage): void {
    if (!msg.pendingPlan) return;
    msg.pendingPlan = undefined;
    msg.content = msg.content ? `${msg.content}\n\n_(Lot annulé.)_` : '_(Lot annulé.)_';
    persist();
  }

  /** Défait EN CASCADE un lot déjà exécuté (supprime les interventions créées). */
  async function annulerLotExecute(msg: CopiloteMessage): Promise<void> {
    if (streaming.value || !msg.undoPlan) return;
    const { planExecId } = msg.undoPlan;
    msg.undoPlan = undefined; // annulation unique
    msg.nav = undefined;
    erreur.value = null;
    persist();
    await lancer({ messages: contexte(), action: { type: 'undoPlan', id: planExecId } }, 0);
  }

  /** Défait une écriture déjà exécutée en autonomie (supprime côté serveur). */
  async function annulerEcriture(msg: CopiloteMessage): Promise<void> {
    if (streaming.value || !msg.undo) return;
    const { actionId, id } = msg.undo;
    msg.undo = undefined; // retire le bouton : annulation unique
    msg.nav = undefined; // le lien « Ouvrir » n'a plus de sens après suppression
    erreur.value = null;
    persist();
    await lancer({ messages: contexte(), action: { type: 'undo', actionId, id } }, 0);
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
          auto?: boolean;
          actionId?: ActionId;
          params?: Record<string, unknown>;
          id?: string;
          bloc?: BlocMaya;
          plan?: PlanClient;
          evenements?: string[];
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
          assistant.nav = { label: evt.label, to: evt.to, auto: evt.auto };
        } else if (evt.type === 'confirm' && evt.actionId && evt.params) {
          assistant.pending = { actionId: evt.actionId, params: evt.params };
        } else if (evt.type === 'confirmPlan' && evt.plan) {
          assistant.pendingPlan = { plan: evt.plan };
        } else if (evt.type === 'undo' && evt.actionId && evt.id) {
          assistant.undo = { actionId: evt.actionId, id: evt.id };
        } else if (evt.type === 'undoPlan' && evt.id) {
          assistant.undoPlan = { planExecId: evt.id };
        } else if (evt.type === 'bloc' && evt.bloc) {
          /**
           * Un bloc À LA FOIS, et on ACCUMULE.
           *
           * L'ancien événement `blocs` livrait le tableau entier et l'affectait
           * d'un coup : les figures surgissaient toutes ensemble à la fin de la
           * frappe. Le serveur les intercale maintenant dans la révélation du
           * texte ; remplacer au lieu d'ajouter ne garderait que la dernière.
           */
          // ⚠️ `(assistant.blocs ??= []).push(...)` serait FAUX : l'opérateur
          // renvoie le tableau BRUT qu'on vient d'assigner, pas le proxy relu
          // depuis l'objet réactif. Muter le brut ne déclenche aucun rendu —
          // c'est exactement le piège déjà documenté plus haut pour la bulle
          // assistante, et le premier bloc n'apparaîtrait jamais.
          if (!assistant.blocs) assistant.blocs = [];
          assistant.blocs.push(evt.bloc);
        } else if (evt.type === 'invalider' && evt.evenements?.length) {
          /**
           * L'ÉCRITURE DE MAYA SE RÉPERCUTE SUR TOUT LE RESTE.
           *
           * ⚠️ ON FILTRE, ON NE FAIT PAS CONFIANCE À LA CHAÎNE. Le serveur
           * dérive ces noms du même fichier de config que le client, donc ils
           * concordent — mais `emit` sur un nom inconnu est un NO-OP PARFAIT :
           * aucune erreur, aucun rafraîchissement, rien à voir dans les
           * journaux. Une faute de frappe serait donc indétectable en
           * production. On rejette explicitement, et on le dit.
           */
          for (const nom of evt.evenements) {
            if (estEvenementDonnees(nom)) emettreSurLeBus(nom);
            else console.warn('[maya] événement de bus inconnu, ignoré :', nom);
          }
        } else if (evt.type === 'done') {
          quota.value = evt.quota ?? null;
        } else if (evt.type === 'error') {
          if (!assistant.content) assistant.content = evt.message ?? 'Maya a rencontré un souci.';
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
    annulerEcriture,
    confirmerPlan,
    annulerPlanProposition,
    annulerLotExecute,
    reset,
  };
}
