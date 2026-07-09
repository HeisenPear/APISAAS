import { z } from 'zod';
import { evenementsActivite } from '~~/server/database/schema';
import { repondreConversation } from '~~/server/utils/copilote-local';
import { executerAction, annulerAction } from '~~/server/utils/copilote-actions';
import { executerPlan, annulerPlan } from '~~/server/utils/copilote-executeur';
import type { PlanMaya } from '~~/server/utils/copilote-plan';
import type { WorkspaceUser } from '~~/server/utils/workspace';
import { rolePeutEcrire, type DomaineEcriture } from '~~/app/config/roles';

const actionIdEnum = z.enum(['intervention', 'client', 'recolte', 'stock', 'vente']);

/** Schéma d'un plan (lot ou séquence) renvoyé par le client pour exécution (re-validé étape par étape). */
const planSchema = z.object({
  type: z.enum(['lot', 'sequence']),
  titre: z.string().max(200),
  resume: z.array(z.string()).max(40),
  etapes: z
    .array(
      z.object({
        id: z.string().max(20),
        actionId: actionIdEnum,
        domaine: z.enum(['terrain', 'commerce']),
        libelle: z.string().max(200),
        params: z.record(z.unknown()),
      }),
    )
    .min(1)
    .max(300),
});

/**
 * RBAC par ACTION : Maya écrit dans plusieurs domaines (client/vente = commerce,
 * intervention/recolte/stock = terrain). Comme /api/ia n'est pas gaté par domaine,
 * on porte le contrôle de rôle sur l'action elle-même (via rolePeutEcrire, la
 * source de vérité RBAC de l'espace), sinon un membre 'apiculteur' — bloqué sur
 * POST /api/clients — pourrait créer un client en le dictant à Maya.
 */
const ACTION_DOMAIN: Record<z.infer<typeof actionIdEnum>, DomaineEcriture> = {
  client: 'commerce',
  vente: 'commerce',
  intervention: 'terrain',
  recolte: 'terrain',
  stock: 'terrain',
};

/** Message de refus si le rôle du membre n'autorise pas cette écriture Maya, sinon null. */
function mayaWriteRefusal(user: WorkspaceUser, actionId: string): string | null {
  if (user.isOwner) return null;
  const domain = ACTION_DOMAIN[actionId as z.infer<typeof actionIdEnum>] ?? 'commerce';
  if (rolePeutEcrire(user.role, domain)) return null;
  return domain === 'commerce'
    ? "Votre rôle sur cet espace ne permet pas de créer ou modifier des données financières (clients, ventes). Demandez au responsable de l'espace."
    : "Votre rôle sur cet espace ne permet pas cette action. Demandez au responsable de l'espace.";
}

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    // Fenêtre large : un flux d'intervention guidé (type → champs → ruche) peut
    // dépasser 16 messages ; le moteur reconstruit l'état depuis l'historique.
    .max(40),
  // Tour d'action : confirmation d'une écriture sensible (« execute ») ou
  // annulation d'une écriture auto exécutée (« undo »).
  action: z
    .union([
      z.object({
        type: z.literal('execute'),
        actionId: actionIdEnum,
        params: z.record(z.unknown()),
      }),
      z.object({
        type: z.literal('undo'),
        actionId: actionIdEnum,
        id: z.string().uuid(),
      }),
      // Exécution / annulation d'un PLAN en lot (fan-out multi-ruches).
      z.object({ type: z.literal('executePlan'), plan: planSchema }),
      z.object({ type: z.literal('undoPlan'), id: z.string().uuid() }),
    ])
    .optional(),
});

/**
 * Copilote Maya — chat streamé (SSE).
 *
 * Moteur 100 % local (copilote-local.ts) : système expert + base de savoir
 * apicole. Embarqué, gratuit, instantané, déterministe. Aucune clé, aucun crédit,
 * aucun appel réseau tiers.
 *
 * Le gate de plan (feature copiloteIa) est appliqué en amont par le middleware
 * subscription via route-gates → Découverte reçoit un 402 propre ici. Les
 * écritures respectent le RBAC d'espace via mayaWriteRefusal().
 */
export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const { messages, action } = bodySchema.parse(await readBody(event));

  // Trace d'usage (analytics admin) — best-effort, jamais bloquant. Le moteur
  // local étant gratuit, aucun quota de coût n'est nécessaire.
  db.insert(evenementsActivite)
    .values({ userId: user.id, type: 'action', nom: 'ia:question' })
    .catch(() => {});

  const stream = createEventStream(event);
  // Fire-and-forget : l'ordre est garanti par la file interne du stream ;
  // on avale les erreurs d'écriture (client déconnecté) pour ne pas créer
  // de rejet de promesse non géré.
  const push = (data: unknown): void => {
    stream.push(JSON.stringify(data)).catch(() => {});
  };

  (async () => {
    try {
      if (action?.type === 'execute') {
        // Exécution d'une action confirmée (écriture sensible).
        const refus = mayaWriteRefusal(user, action.actionId);
        if (refus) push({ type: 'text', delta: refus });
        else await runExecute(user.id, action.actionId, action.params, push);
      } else if (action?.type === 'undo') {
        // Annulation d'une écriture auto exécutée (bouton « Annuler »).
        const refus = mayaWriteRefusal(user, action.actionId);
        if (refus) {
          push({ type: 'text', delta: refus });
        } else {
          const res = await annulerAction(user.id, action.actionId, action.id);
          push({ type: 'text', delta: res.texte });
        }
      } else if (action?.type === 'executePlan') {
        // Exécution d'un PLAN en lot confirmé (fan-out transactionnel).
        await runExecutePlan(user, action.plan, push);
      } else if (action?.type === 'undoPlan') {
        // Annulation EN CASCADE d'un lot exécuté (bouton « Tout annuler »).
        const refus = mayaWriteRefusal(user, 'intervention');
        if (refus) {
          push({ type: 'text', delta: refus });
        } else {
          const res = await annulerPlan(user.id, action.id);
          push({ type: 'text', delta: res.texte });
        }
      } else {
        await runLocal(user, messages, push);
      }
      await push({ type: 'done' });
    } catch (err) {
      console.error('[ia/copilote] échec:', err instanceof Error ? err.message : err);
      await push({
        type: 'error',
        message: 'Maya a rencontré un problème. Réessayez dans un instant.',
      });
    } finally {
      await stream.close();
    }
  })();

  return stream.send();
});

/** Moteur local : réponse instantanée, streamée par petits groupes de mots. */
async function runLocal(
  user: WorkspaceUser,
  messages: { role: 'user' | 'assistant'; content: string }[],
  push: (d: unknown) => void,
): Promise<void> {
  const rep = await repondreConversation(user.id, messages);

  // Autonomie : action réversible → on l'exécute directement et on propose
  // « Annuler », plutôt que de demander une confirmation préalable.
  if (rep.autoExecute) {
    const refus = mayaWriteRefusal(user, rep.autoExecute.actionId);
    if (refus) {
      push({ type: 'text', delta: refus });
      return;
    }
    try {
      const res = await executerAction(user.id, rep.autoExecute.actionId, rep.autoExecute.params);
      push({ type: 'text', delta: res.texte });
      if (res.ok && res.lien) push({ type: 'navigation', label: 'Ouvrir', to: res.lien });
      if (res.ok && res.cree) push({ type: 'undo', actionId: res.cree.actionId, id: res.cree.id });
    } catch (err) {
      // Trace précise (le générique masquait la vraie cause de l'échec d'écriture).
      console.error(
        '[ia/copilote] autoExecute échec:',
        rep.autoExecute.actionId,
        JSON.stringify(rep.autoExecute.params),
        err instanceof Error ? (err.stack ?? err.message) : err,
      );
      push({
        type: 'text',
        delta:
          "Je n'ai pas réussi à l'enregistrer — un détail technique m'a bloquée. Réessaie, ou ouvre le formulaire pour la saisir.",
      });
    }
    return;
  }

  if (rep.source) push({ type: 'tool', label: rep.source });

  // Effet « frappe » léger : on découpe en mots et on pousse par groupes.
  const mots = rep.texte.split(/(\s+)/);
  let buffer = '';
  let depuisFlush = 0;
  for (const mot of mots) {
    buffer += mot;
    depuisFlush += 1;
    if (depuisFlush >= 4) {
      push({ type: 'text', delta: buffer });
      buffer = '';
      depuisFlush = 0;
      await sleep(14);
    }
  }
  if (buffer) push({ type: 'text', delta: buffer });
  // Blocs riches (stats, tableaux, graphes), puis raccourci / action / rebonds.
  if (rep.blocs?.length) push({ type: 'blocs', blocs: rep.blocs });
  if (rep.navigation)
    push({
      type: 'navigation',
      label: rep.navigation.label,
      to: rep.navigation.to,
      auto: rep.navigation.auto === true,
    });
  // On ne propose une confirmation d'écriture que si le rôle l'autorise.
  if (rep.confirmation && !mayaWriteRefusal(user, rep.confirmation.actionId))
    push({ type: 'confirm', actionId: rep.confirmation.actionId, params: rep.confirmation.params });
  // Confirmation d'un PLAN en lot — refusée si une seule étape n'est pas permise.
  if (rep.confirmationPlan) {
    const refus = rep.confirmationPlan.plan.etapes
      .map((e) => mayaWriteRefusal(user, e.actionId))
      .find((m): m is string => Boolean(m));
    if (refus) push({ type: 'text', delta: refus });
    else push({ type: 'confirmPlan', plan: rep.confirmationPlan.plan });
  }
  if (rep.suggestions?.length) push({ type: 'suggestions', items: rep.suggestions });
}

/** Exécute un PLAN en lot confirmé (transactionnel), puis propose « Tout annuler ». */
async function runExecutePlan(
  user: WorkspaceUser,
  plan: PlanMaya,
  push: (d: unknown) => void,
): Promise<void> {
  // RBAC par étape : refus global si une seule action n'est pas autorisée au rôle.
  const refus = plan.etapes.map((e) => mayaWriteRefusal(user, e.actionId)).find((m): m is string => Boolean(m));
  if (refus) {
    push({ type: 'text', delta: refus });
    return;
  }
  try {
    const res = await executerPlan(user.id, plan);
    push({ type: 'text', delta: res.texte });
    if (res.ok && res.planExecId) push({ type: 'undoPlan', id: res.planExecId });
  } catch (err) {
    console.error('[ia/copilote] executePlan échec:', err instanceof Error ? err.message : err);
    push({
      type: 'text',
      delta: "Je n'ai pas pu appliquer le lot. Réessaie dans un instant — rien n'a été enregistré.",
    });
  }
}

/** Exécute une action d'écriture confirmée, puis propose le lien vers le résultat. */
async function runExecute(
  userId: string,
  actionId: 'intervention' | 'client' | 'recolte' | 'stock' | 'vente',
  params: Record<string, unknown>,
  push: (d: unknown) => void,
): Promise<void> {
  try {
    const res = await executerAction(userId, actionId, params);
    push({ type: 'text', delta: res.texte });
    if (res.ok && res.lien) push({ type: 'navigation', label: 'Ouvrir', to: res.lien });
  } catch (err) {
    console.error('[ia/copilote] execute échec:', err instanceof Error ? err.message : err);
    push({
      type: 'text',
      delta:
        "Je n'ai pas pu finaliser (informations incomplètes ou invalides). Réessayez, ou ouvrez le formulaire pour la saisir à la main.",
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
