import type { MotifAbus } from '~/config/forum';

export interface SujetForum {
  id: string;
  titre: string;
  slug: string;
  messages: number;
  dernierMessageLe: string | null;
  createdAt: string;
  /** Un PSEUDONYME, jamais un nom complet ni un e-mail — voir `forumPseudonyme.ts`. */
  auteur: string;
}

export interface MessageForum {
  id: string;
  /** Masqué = le contenu reçu est déjà `TEXTE_MESSAGE_MASQUE`, pas le vrai texte. */
  masque: boolean;
  contenu: string;
  createdAt: string;
  auteur: string;
}

export interface FilForum {
  id: string;
  titre: string;
  slug: string;
  createdAt: string;
  auteur: string;
  messages: MessageForum[];
}

/**
 * Le forum, côté écran.
 *
 * ⚠️ LES DEUX LECTURES PASSENT PAR `appelApi`, ET C'EST NÉCESSAIRE ICI PLUS
 * QU'AILLEURS. Le forum se rend côté SERVEUR pour être indexable : sans le
 * `useRequestFetch()` que porte `appelApi`, une page rendue en SSR partirait
 * sans les en-têtes de la requête entrante. Ces deux routes-ci sont publiques,
 * donc ça marcherait quand même — c'est précisément le piège : la page
 * paraîtrait juste, et la première route authentifiée ajoutée à ce composable
 * se rendrait VIDE puis se remplirait à l'hydratation, sans erreur nulle part.
 */
export function useForum() {
  async function listerSujets(params: { page?: number; limite?: number } = {}) {
    return appelApi<{ data: SujetForum[]; total: number }>('/api/forum/sujets', {
      query: params,
    });
  }

  async function lireFil(slug: string) {
    return appelApi<{ data: FilForum }>(`/api/forum/sujets/${encodeURIComponent(slug)}`);
  }

  async function ouvrirSujet(titre: string, message: string) {
    const res = await ($fetch as typeof $fetch<{ data: { id: string; slug: string } }, string>)(
      '/api/forum/sujets',
      { method: 'POST', body: { titre, message } },
    );
    return res.data;
  }

  async function repondre(sujetId: string, contenu: string) {
    await ($fetch as typeof $fetch<unknown, string>)('/api/forum/messages', {
      method: 'POST',
      body: { sujetId, contenu },
    });
  }

  async function supprimerMessage(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(
      `/api/forum/messages/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  }

  /** Rend le nombre de signalements RETENUS après recompte — mesuré, pas promis. */
  async function signaler(messageId: string, motif: MotifAbus, precision?: string) {
    const res = await ($fetch as typeof $fetch<{ data: { signalements: number } }, string>)(
      `/api/forum/messages/${encodeURIComponent(messageId)}/signaler`,
      { method: 'POST', body: { motif, precision } },
    );
    return res.data.signalements;
  }

  return { listerSujets, lireFil, ouvrirSujet, repondre, supprimerMessage, signaler };
}
