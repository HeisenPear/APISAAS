import { z } from 'zod';
import { evenementsActivite } from '~~/server/database/schema';
import { repondreConversation } from '~~/server/utils/copilote-local';
import { cadenceFrappe, compterMots, jalonsBlocs } from '~~/server/utils/maya-cadence';
import { executerAction, annulerAction } from '~~/server/utils/copilote-actions';
/**
 * ⚠️ IMPORTÉES D'UN MODULE SANS BASE, ET PAS DE `copilote-actions`. Le banc de
 * bout en bout de cette route doit doubler `copilote-actions` (il ouvre la
 * base) ; les y laisser aurait fait mesurer au banc sa propre recopie de la
 * règle. Cf. l'en-tête de `copilote-repercussion.ts`.
 */
import {
  evenementsDeLEcriture,
  evenementsDeLAnnulation,
} from '~~/server/utils/copilote-repercussion';
import { executerPlan, annulerPlan } from '~~/server/utils/copilote-executeur';
import { MAX_ETAPES_PLAN, type PlanMaya } from '~~/server/utils/copilote-plan';
import type { WorkspaceUser } from '~~/server/utils/workspace';
import { rolePeutEcrire } from '~~/app/config/roles';
import { ACTIONS_IDS, ACTION_DOMAINE, type ActionId } from '~~/app/config/maya-actions';
import { isAdminEmail } from '~~/app/config/admin';
import type { Plan } from '~~/app/config/plans';

/**
 * ⚠️ CETTE ÉNUMÉRATION ÉTAIT RECOPIÉE, et c'était l'un des huit registres que
 * TypeScript ne surveillait pas. Une action nouvelle non inscrite ici était
 * simplement REFUSÉE par la validation — silencieusement, à l'exécution, sans
 * qu'aucun test ne le dise. Elle dérive du catalogue.
 *
 * `z.enum` exige un tuple non vide : le `as [ActionId, ...ActionId[]]` le lui
 * promet, et le catalogue garantit qu'il l'est.
 */
const actionIdEnum = z.enum(ACTIONS_IDS as [ActionId, ...ActionId[]]);

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
    .max(MAX_ETAPES_PLAN),
});

/**
 * RBAC par ACTION : Maya écrit dans plusieurs domaines (client/vente = commerce,
 * intervention/recolte/stock = terrain). Comme /api/ia n'est pas gaté par domaine,
 * on porte le contrôle de rôle sur l'action elle-même (via rolePeutEcrire, la
 * source de vérité RBAC de l'espace), sinon un membre 'technicien' — à qui
 * POST /api/clients répond 403 via assertCanWrite(event, 'commerce') — créerait
 * un client en le DICTANT à Maya. Symétriquement pour un 'comptable' sur le
 * terrain. ('apiculteur' était cité ici par erreur : il écrit dans les deux
 * domaines, sur cette route comme sur les routes directes.)
 */
const ACTION_DOMAIN = ACTION_DOMAINE;

/** Message de refus si le rôle du membre n'autorise pas cette écriture Maya, sinon null. */
function mayaWriteRefusal(user: WorkspaceUser, actionId: string): string | null {
  if (user.isOwner) return null;
  // Le `??` n'est pas atteignable : `actionIdEnum` valide l'action avant que
  // cette fonction ne la voie, et le seul appel à valeur littérale passe
  // 'intervention'. La campagne de mutations le confirme — en changer la valeur
  // ne fait rien tomber. Il est conservé comme garde-fou de typage, pas comme
  // règle métier : c'est l'énumération Zod qui protège, et c'est elle qu'il faut
  // regarder si une action est ajoutée sans être ajoutée aussi à ACTION_DOMAIN.
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
 * DIT AU NAVIGATEUR CE QUI VIENT DE CHANGER.
 *
 * ⚠️ LES CINQ CHEMINS D'ÉCRITURE, PAS LE SEUL CHEMIN AUTONOME. C'est là que se
 * cachait le faux vert : `runLocal` ne porte QU'UNE action sur neuf
 * (l'intervention, exécutée en autonomie) ; les huit autres passent par
 * « Confirmer » (`runExecute`), le lot par `runExecutePlan`, et les deux
 * annulations par la racine. Ne brancher que le premier — la tentation, parce
 * que c'est le chemin qu'on teste le plus facilement — aurait laissé « ajoute
 * une ruche », « note ce client », « j'ai vendu 30 pots » sans le moindre
 * rafraîchissement, tout en donnant l'impression que le sujet était traité.
 *
 * ⚠️ UN TABLEAU VIDE N'EST JAMAIS POUSSÉ. « Rien n'a bougé » (un lot annulé qui
 * n'avait plus rien à défaire, un refus de plan qui n'a rien écrit) ne doit pas
 * ressembler à une écriture réussie : le banc de répercussion s'appuie sur cette
 * distinction, et l'écran aussi — un rechargement gratuit fait clignoter des
 * listes pour rien.
 */
function invalidateur(push: (d: unknown) => void): (evenements: readonly string[]) => void {
  return (evenements) => {
    if (evenements.length) push({ type: 'invalider', evenements });
  };
}

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

  // Plan de l'ESPACE (celui du propriétaire, pas du membre qui parle). Maya
  // écrit dans les mêmes tables que les routes directes, qui sont gatées : le
  // dispatcher d'intervention refuse une catégorie hors plan (`recolte` →
  // `production`, `reine` → `moduleReine`) et applique le plafond de cheptel
  // sur `division`. Sans ce plan, dicter à Maya serait un contournement.
  // Admin → 'expert', comme dans `POST /api/interventions/bulk`. L'e-mail vient
  // de `requireAuth` (déjà résolu et mis en cache par `requireWorkspace`) :
  // `WorkspaceUser` ne porte que des identifiants.
  const authentifie = await requireAuth(event);
  const plan: Plan = isAdminEmail(authentifie.email) ? 'expert' : await planDuProprietaire(user.id);

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

  const invalider = invalidateur(push);

  (async () => {
    try {
      if (action?.type === 'execute') {
        // Exécution d'une action confirmée (écriture sensible).
        const refus = mayaWriteRefusal(user, action.actionId);
        if (refus) push({ type: 'text', delta: refus });
        else await runExecute(user.id, action.actionId, action.params, push, plan);
      } else if (action?.type === 'undo') {
        // Annulation d'une écriture auto exécutée (bouton « Annuler »).
        const refus = mayaWriteRefusal(user, action.actionId);
        if (refus) {
          push({ type: 'text', delta: refus });
        } else {
          const res = await annulerAction(user.id, action.actionId, action.id);
          push({ type: 'text', delta: res.texte });
          invalider(evenementsDeLAnnulation(action.actionId, res));
        }
      } else if (action?.type === 'executePlan') {
        // Exécution d'un PLAN en lot confirmé (fan-out transactionnel).
        await runExecutePlan(user, action.plan, push, plan);
      } else if (action?.type === 'undoPlan') {
        // Annulation EN CASCADE d'un lot exécuté (bouton « Tout annuler »).
        const refus = mayaWriteRefusal(user, 'intervention');
        if (refus) {
          push({ type: 'text', delta: refus });
        } else {
          const res = await annulerPlan(user.id, action.id);
          push({ type: 'text', delta: res.texte });
          invalider(res.evenements);
        }
      } else {
        await runLocal(user, messages, push, plan);
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
  planAbo: Plan,
): Promise<void> {
  const invalider = invalidateur(push);
  const rep = await repondreConversation(user.id, messages, planAbo);

  // Autonomie : action réversible → on l'exécute directement et on propose
  // « Annuler », plutôt que de demander une confirmation préalable.
  if (rep.autoExecute) {
    const refus = mayaWriteRefusal(user, rep.autoExecute.actionId);
    if (refus) {
      push({ type: 'text', delta: refus });
      return;
    }
    try {
      const res = await executerAction(
        user.id,
        rep.autoExecute.actionId,
        rep.autoExecute.params,
        planAbo,
      );
      push({ type: 'text', delta: res.texte });
      if (res.ok && res.lien) push({ type: 'navigation', label: 'Ouvrir', to: res.lien });
      if (res.ok && res.cree) push({ type: 'undo', actionId: res.cree.actionId, id: res.cree.id });
      invalider(evenementsDeLEcriture(rep.autoExecute.actionId, res));
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

  // Effet « frappe » — révélation MOT À MOT (et non plus par salves de ~2 mots) :
  // mot à mot, chaque mot apparaît distinctement, ce qui « pose » le rythme et se
  // lit mieux. `split(/(\s+)/)` alterne mot / espace : un vrai mot sur deux.
  //
  // La CADENCE elle-même vit dans `~~/server/utils/maya-cadence` : c'est de
  // l'arithmétique pure, et enfouie ici elle avait été réglée trois fois sans
  // qu'un seul banc dise ce qu'elle garantit.
  const mots = rep.texte.split(/(\s+)/);
  const nbMots = compterMots(rep.texte);
  const pasParMot = cadenceFrappe(nbMots);
  /**
   * Les blocs riches se posent AU FIL de la frappe, un par un.
   *
   * Ils partaient auparavant en un seul événement, après tout le texte : la
   * réponse s'écrivait tranquillement, puis trois figures surgissaient d'un coup.
   * Le regard vient de finir une phrase et reçoit d'un bloc ce qu'il faudrait
   * parcourir — indigeste, et c'est le mot juste.
   */
  const blocs = rep.blocs ?? [];
  const jalons = jalonsBlocs(nbMots, blocs.length);
  let motsEmis = 0;
  let prochainBloc = 0;

  let buffer = '';
  let depuisFlush = 0;
  for (const mot of mots) {
    buffer += mot;
    depuisFlush += 1;
    // 2 jetons = 1 mot + son espace → on révèle mot par mot.
    if (depuisFlush >= 2) {
      push({ type: 'text', delta: buffer });
      buffer = '';
      depuisFlush = 0;
      motsEmis += 1;
      while (prochainBloc < jalons.length && jalons[prochainBloc]! <= motsEmis) {
        push({ type: 'bloc', bloc: blocs[prochainBloc] });
        prochainBloc += 1;
      }
      await sleep(pasParMot);
    }
  }
  if (buffer) push({ type: 'text', delta: buffer });
  /**
   * FILET : un bloc calculé ne doit JAMAIS disparaître.
   *
   * Le nombre de salves réellement poussées peut différer d'une unité du compte
   * annoncé (le reliquat part dans un dernier flush hors boucle). Un jalon posé
   * sur le tout dernier mot ne serait alors jamais atteint, et la figure
   * s'évaporerait sans un bruit. On pousse donc ce qui reste.
   */
  while (prochainBloc < blocs.length) {
    push({ type: 'bloc', bloc: blocs[prochainBloc] });
    prochainBloc += 1;
  }
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
  // `planAbo` et non `plan` : ce dernier désigne déjà le plan d'exécution Maya
  // (les étapes du lot). Deux notions homonymes, à ne pas confondre.
  planAbo: Plan,
): Promise<void> {
  const invalider = invalidateur(push);
  // RBAC par étape : refus global si une seule action n'est pas autorisée au rôle.
  const refus = plan.etapes
    .map((e) => mayaWriteRefusal(user, e.actionId))
    .find((m): m is string => Boolean(m));
  if (refus) {
    push({ type: 'text', delta: refus });
    return;
  }
  try {
    const res = await executerPlan(user.id, plan, planAbo);
    push({ type: 'text', delta: res.texte });
    if (res.ok && res.planExecId) push({ type: 'undoPlan', id: res.planExecId });
    invalider(res.evenements);
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
  actionId: ActionId,
  params: Record<string, unknown>,
  push: (d: unknown) => void,
  planAbo: Plan,
): Promise<void> {
  const invalider = invalidateur(push);
  try {
    const res = await executerAction(userId, actionId, params, planAbo);
    push({ type: 'text', delta: res.texte });
    if (res.ok && res.lien) push({ type: 'navigation', label: 'Ouvrir', to: res.lien });
    invalider(evenementsDeLEcriture(actionId, res));
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
