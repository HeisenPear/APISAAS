// ═══════════════════════════════════════════════════════════════════════════
// LA ROUTE DE MAYA — 326 lignes, zéro banc, et sept contrôles de rôle.
//
// `/api/ia/copilote` est la seule route d'écriture du produit qui n'écrit pas
// « une » chose : selon ce qu'on lui dicte, elle crée une intervention, un
// client, une récolte, un mouvement de stock, ou trois cents interventions d'un
// coup. Toutes ces écritures atterrissent dans les MÊMES tables que les routes
// directes — lesquelles sont gardées, une par une, par `assertCanWrite`.
//
// ─── POURQUOI CE FICHIER EXISTE ────────────────────────────────────────────
// Parce que /api/ia n'est pas gaté par domaine, le contrôle de rôle est porté
// par la route elle-même, via `mayaWriteRefusal`. Et il ne l'est pas à un
// endroit : à SEPT. Une écriture confirmée, une annulation, un plan en lot,
// l'annulation d'un lot, une écriture automatique, une proposition de
// confirmation, une proposition de plan.
//
// Sept chemins, un seul oubli suffit. Un `technicien` — à qui `POST /api/clients`
// répond 403 — créerait alors un client en le DICTANT. Ce n'est pas une
// hypothèse d'école : c'est exactement le contournement que `mayaWriteRefusal`
// a été écrit pour fermer.
//
// ─── CE QUE CE BANC VÉRIFIE, ET COMMENT ────────────────────────────────────
// Pas la matrice des rôles : elle a son propre banc, et la recopier ici ne
// prouverait que ma capacité à copier. Ce qui est vérifié, c'est l'ÉQUIVALENCE :
// pour chaque rôle et chaque action, Maya rend le même verdict que
// `rolePeutEcrire` — la source de vérité qu'appliquent les routes directes.
//
// Autrement dit : Maya n'est jamais une porte dérobée. Si la matrice change un
// jour, ce banc suit sans être touché ; s'il s'ouvre une brèche entre les deux
// chemins, il tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rolePeutEcrire, type DomaineEcriture } from '../../../../app/config/roles';
import type { WorkspaceUser } from '../../../../server/utils/workspace';

/**
 * ⚠️ CES DEUX TABLES ÉTAIENT RECOPIÉES, ET LE COMMENTAIRE D'À CÔTÉ AFFIRMAIT
 * LE CONTRAIRE : « comparées à la source de vérité plutôt qu'à une table
 * recopiée ici ». C'était vrai pour les RÔLES (`rolePeutEcrire` est bien
 * importé), faux pour les ACTIONS et pour les DOMAINES.
 *
 * Conséquence exacte : j'ajoute une sixième action, je l'inscris dans la route,
 * je ne touche pas à ce fichier — les 25 combinaisons continuent de passer, la
 * sixième n'est balayée par personne, et si son domaine est mal déclaré
 * (terrain au lieu de commerce), rien ne tombe. Un balayage exhaustif d'une
 * liste figée n'est pas exhaustif : il est figé.
 *
 * Le même fichier savait pourtant faire l'inverse — il lit la source de la
 * route pour vérifier qu'aucun événement SSE n'est ignoré. Le motif existait,
 * il n'avait simplement pas été appliqué aux actions.
 */
import {
  ACTIONS_IDS,
  ACTION_DOMAINE,
  MAYA_ACTIONS,
  type ActionId,
} from '../../../../app/config/maya-actions';
import { estEvenementDonnees } from '../../../../app/config/evenements-donnees';

type ActionMaya = ActionId;
const DOMAINE: Record<ActionMaya, DomaineEcriture> = ACTION_DOMAINE;
const ACTIONS: ActionMaya[] = ACTIONS_IDS;
/** Les rôles non propriétaires — seuls concernés : `isOwner` court-circuite tout. */
const ROLES = ['admin', 'apiculteur', 'technicien', 'comptable', 'lecture'] as const;

// ─── Ce que le moteur et les exécuteurs rendent (pilotable par cas) ─────────

interface Reponse {
  texte: string;
  manque: boolean;
  autoExecute?: { actionId: ActionMaya; params: Record<string, unknown> };
  confirmation?: { actionId: ActionMaya; params: Record<string, unknown> };
  confirmationPlan?: { plan: unknown };
  suggestions?: string[];
}
let reponseMoteur: Reponse;
/** Écritures RÉELLEMENT parties vers la base. Doit rester vide sur refus. */
let ecrituresEffectuees: string[];

vi.mock('~~/server/utils/copilote-local', () => ({
  repondreConversation: async (): Promise<Reponse> => reponseMoteur,
}));

/** Plan d'abonnement transmis aux exécuteurs — capté pour vérifier sa PROVENANCE. */
let planTransmisAuxEcritures: string | null;

vi.mock('~~/server/utils/copilote-actions', () => ({
  executerAction: async (_u: string, actionId: string, _p: unknown, planAbo: string) => {
    ecrituresEffectuees.push(`executerAction:${actionId}`);
    planTransmisAuxEcritures = planAbo;
    return { ok: true, texte: 'C’est noté.' };
  },
  annulerAction: async (_u: string, actionId: string) => {
    ecrituresEffectuees.push(`annulerAction:${actionId}`);
    return { ok: true, texte: 'Annulé.' };
  },
}));

/**
 * ⚠️ CES DOUBLES RENDENT `evenements`, ET C'EST UN PARTAGE DE RESPONSABILITÉ,
 * PAS UNE FACILITÉ. L'exécuteur DÉRIVE l'union des invalidations de ses étapes
 * (son propre banc le mesure) ; la ROUTE, elle, n'a qu'un devoir : la
 * transmettre au navigateur sans la perdre. On lui donne donc une valeur
 * reconnaissable et on vérifie qu'elle ressort telle quelle.
 */
/**
 * Les `actionId` que le lot a RÉELLEMENT journalisés — ce sur quoi le rôle doit
 * être jugé. Un lot de clients ne se défait pas avec la permission « terrain ».
 */
let ressourcesDuLot: string[] = ['intervention'];

vi.mock('~~/server/utils/copilote-executeur', () => ({
  executerPlan: async (_u: string, _plan: unknown, planAbo: string) => {
    ecrituresEffectuees.push('executerPlan');
    planTransmisAuxEcritures = planAbo;
    return {
      ok: true,
      texte: 'Lot appliqué.',
      planExecId: 'p1',
      evenements: ['intervention:created', 'ruche:created'],
    };
  },
  /**
   * ⚠️ LE DOUBLE REFUSE CE QUE LE VRAI REFUSERAIT. Il ignorait `refusePour` et
   * annulait toujours : la règle « le rôle se juge sur les ressources
   * RÉELLEMENT journalisées » n'était donc mesurée par rien. C'est la forme
   * « le double plus permissif que le réel » de CLAUDE.md, et elle cachait
   * précisément le défaut qu'on corrige — un technicien qui fait supprimer des
   * clients, un comptable qui ne peut pas défaire les siens.
   */
  annulerPlan: async (
    _u: string,
    _id: string,
    refusePour?: (actionId: string) => string | null,
  ) => {
    const refus = ressourcesDuLot.map((a) => refusePour?.(a)).find((m) => Boolean(m));
    if (refus) return { ok: false, texte: refus, evenements: [] };
    ecrituresEffectuees.push('annulerPlan');
    return { ok: true, texte: 'Lot annulé.', evenements: ['intervention:deleted'] };
  },
}));
vi.mock('~~/app/config/admin', () => ({
  isAdminEmail: (email: string) => email === 'admin@apigo.fr',
}));

// ─── Le harnais de requête ─────────────────────────────────────────────────

/** Événements poussés dans le flux SSE. */
let flux: Record<string, unknown>[];
/** Corps de la requête. */
let corps: unknown;
/** Utilisateur résolu par `requireWorkspace`. */
let utilisateur: WorkspaceUser;
/** E-mail de `requireAuth` (décide du statut admin). */
let emailAuthentifie: string;
/** Plan du PROPRIÉTAIRE de l'espace. */
let planProprietaire: string;
/** Un cas peut réclamer l'événement d'erreur ; sinon il fait tomber le banc. */
let erreurAttendue: boolean;

function poser() {
  flux = [];
  ecrituresEffectuees = [];
  planTransmisAuxEcritures = null;
  erreurAttendue = false;
  emailAuthentifie = 'membre@exemple.fr';
  planProprietaire = 'pro';
  utilisateur = { id: 'owner-1', userId: 'membre-1', role: 'apiculteur', isOwner: false };
  reponseMoteur = { texte: 'Bonjour.', manque: false };
  corps = { messages: [{ role: 'user', content: 'salut' }] };

  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireWorkspace: async () => utilisateur,
    requireAuth: async () => ({ email: emailAuthentifie }),
    // Le double DISTINGUE les deux identifiants. Sa première version rendait
    // `planProprietaire` quel que soit l'argument : la mutation qui remplaçait
    // `user.id` (le propriétaire) par `user.userId` (le membre) passait alors
    // inaperçue — le banc affirmait une provenance qu'il ne vérifiait pas.
    planDuProprietaire: async (id: string) =>
      id === utilisateur.id ? planProprietaire : 'decouverte',
    readBody: async () => corps,
    // La trace d'usage est « best-effort » : elle ne doit jamais rien bloquer.
    db: { insert: () => ({ values: () => ({ catch: () => {} }) }) },
    createEventStream: () => ({
      push: async (data: string) => {
        flux.push(JSON.parse(data) as Record<string, unknown>);
      },
      close: async () => {},
      send: () => 'flux',
    }),
  });
}

beforeEach(() => {
  poser();
  ressourcesDuLot = ['intervention'];
  vi.resetModules();
});

/**
 * Joue la route et attend que le flux soit clos. Le corps du handler est une
 * IIFE asynchrone détachée (`(async () => {…})()`) : `send()` rend la main
 * AVANT que le travail soit fait. On attend donc l'événement `done` — sans quoi
 * on assertirait sur un flux vide et tout passerait au vert.
 */
async function appeler(): Promise<Record<string, unknown>[]> {
  const module = await import('~~/server/api/ia/copilote.post');
  const handler = module.default as unknown as (e: unknown) => Promise<unknown>;
  await handler({ context: {}, node: { req: {}, res: {} } });
  for (let i = 0; i < 200 && !flux.some((e) => e.type === 'done' || e.type === 'error'); i++) {
    await new Promise((r) => setTimeout(r, 5));
  }

  /**
   * ⚠️ CE GARDE-FOU EST NÉ D'UN FAUX VERT QU'IL A FALLU VOIR POUR Y CROIRE.
   *
   * Le jour où la route s'est mise à appeler `evenementsDeLEcriture`, ce banc
   * est resté VERT — dix-sept cas — alors que CHAQUE écriture levait une
   * `TypeError` (la fonction manquait au double). Pourquoi : le `catch` de la
   * route rattrape, pousse un `{type:'error'}` poli, et la boucle d'attente
   * ci-dessus s'en satisfaisait. Les assertions, elles, portaient sur
   * `ecrituresEffectuees` — rempli AVANT la levée — et sur la présence d'un
   * refus. Tout concordait, et rien ne marchait.
   *
   * Une écriture qui explose n'est pas une écriture réussie. Un banc qui ne
   * sait pas faire la différence ne garde rien : il refuse donc l'événement
   * d'erreur, sauf quand un cas l'attend explicitement.
   */
  const erreur = flux.find((e) => e.type === 'error');
  if (erreur && !erreurAttendue) {
    throw new Error(
      `La route a échoué au lieu de répondre : « ${String(erreur.message)} ».\n` +
        'Regarde la sortie standard : la vraie cause y est tracée (`[ia/copilote] … échec:`). ' +
        'Une cause fréquente est un export manquant sur un `vi.mock` — le double ' +
        'doit suivre les imports de la route.',
    );
  }
  return flux;
}

/** Le flux contient-il un refus de rôle ? */
const refuse = (evts: Record<string, unknown>[]) =>
  evts.some(
    (e) =>
      e.type === 'text' && /ne permet pas|ne vous permet pas|Votre rôle/i.test(String(e.delta)),
  );

const planExemple = (actionId: ActionMaya) => ({
  type: 'lot' as const,
  titre: 'Contrôle sur 2 ruches',
  resume: ['2 ruches'],
  etapes: [
    { id: 'e1', actionId, domaine: DOMAINE[actionId], libelle: 'Ruche 1', params: {} },
    { id: 'e2', actionId, domaine: DOMAINE[actionId], libelle: 'Ruche 2', params: {} },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. Maya n'est jamais une porte dérobée
// ═══════════════════════════════════════════════════════════════════════════

describe('équivalence avec le contrôle des routes directes', () => {
  it('rend le MÊME verdict que rolePeutEcrire, pour chaque rôle et chaque action', async () => {
    // Le balayage complet : chaque rôle × chaque action, les deux listes LUES
    // à leur source (`ROLES` de la config RBAC, `ACTIONS_IDS` du catalogue
    // Maya). Un rôle OU une action ajoutés demain sont couverts sans toucher
    // ce fichier — ce que le commentaire d'origine promettait sans le tenir.
    const ecarts: string[] = [];
    /**
     * ⚠️ CE COMPTEUR GARDE LE BALAYAGE LUI-MÊME. Le dépôt étant correct,
     * retirer un CHEMIN de la table ne fait tomber aucun écart — le banc
     * mesurerait de moins en moins en affichant la même conformité, « la liste
     * qui rétrécit en silence » de CLAUDE.md. On exige donc que CHAQUE chemin
     * ait réellement vu passer une écriture ET un refus.
     */
    const vus = new Map<string, { passees: number; refusees: number }>();

    /**
     * ⚠️ LES TROIS CHEMINS D'ÉCRITURE, PAS LE SEUL `execute`. Le balayage
     * n'exerçait que l'exécution ; `undo` et `undoPlan` n'étaient testés
     * qu'avec le rôle `lecture`, qui refuse partout. C'est la forme « la
     * couverture qui s'arrête juste avant » — et derrière elle vivait un vrai
     * trou : `undoPlan` jugeait le rôle sur `'intervention'` en dur, si bien
     * qu'un TECHNICIEN faisait supprimer des clients et un COMPTABLE ne
     * pouvait pas défaire les siens.
     *
     * Défaire est une ÉCRITURE. Elle se juge sur le même domaine.
     */
    const CHEMINS = ['execute', 'undo', 'undoPlan'] as const;
    // Le schéma Zod exige un UUID : un `'x1'` fait échouer la route AVANT le RBAC,
    // et le banc mesurerait un refus qui n'a rien à voir avec le rôle.
    const UUID = '11111111-2222-4333-8444-555555555555';

    for (const role of ROLES) {
      for (const actionId of ACTIONS) {
        for (const chemin of CHEMINS) {
          poser();
          ressourcesDuLot = [actionId];
          vi.resetModules();
          utilisateur = { id: 'owner-1', userId: 'membre-1', role, isOwner: false };
          corps = {
            messages: [{ role: 'user', content: 'peu importe' }],
            action:
              chemin === 'execute'
                ? { type: 'execute', actionId, params: {} }
                : chemin === 'undo'
                  ? { type: 'undo', actionId, id: UUID }
                  : { type: 'undoPlan', id: UUID },
          };

          const evts = await appeler();
          const aEcrit = ecrituresEffectuees.length > 0;
          const devraitPouvoir = rolePeutEcrire(role, DOMAINE[actionId]);
          const compte = vus.get(chemin) ?? { passees: 0, refusees: 0 };
          if (aEcrit) compte.passees++;
          else compte.refusees++;
          vus.set(chemin, compte);

          if (aEcrit !== devraitPouvoir) {
            ecarts.push(
              `${role} × ${actionId} × ${chemin} : ${aEcrit ? 'PASSÉE' : 'refusée'}, attendu ${devraitPouvoir ? 'autorisée' : 'REFUSÉE'}`,
            );
          }
          /**
           * ⚠️ ET LE REFUS DOIT SE DIRE. « Un refus est une PHRASE » : un
           * chemin qui bloque en silence laisse l'apiculteur devant un écran
           * qui ne bouge plus, sans savoir que son rôle est en cause.
           */
          if (!devraitPouvoir && !refuse(evts)) {
            ecarts.push(`${role} × ${actionId} × ${chemin} : refusé sans le dire`);
          }
        }
      }
    }

    expect(ecarts).toEqual([]);

    for (const chemin of CHEMINS) {
      const c = vus.get(chemin);
      expect(
        c?.passees ?? 0,
        `le chemin « ${chemin} » n’a laissé passer AUCUNE écriture`,
      ).toBeGreaterThan(0);
      expect(c?.refusees ?? 0, `le chemin « ${chemin} » n’a refusé PERSONNE`).toBeGreaterThan(0);
    }
    expect(vus.size, 'un chemin d’écriture a disparu de la table').toBe(CHEMINS.length);
  });

  it('le propriétaire de l’espace n’est jamais entravé', async () => {
    // `isOwner` court-circuite `mayaWriteRefusal` : c'est SON espace. Sans ce
    // cas, un refus généralisé passerait le balayage ci-dessus au vert — il ne
    // regarde que les membres.
    utilisateur = { id: 'owner-1', userId: 'owner-1', role: 'lecture', isOwner: true };
    corps = {
      messages: [{ role: 'user', content: 'peu importe' }],
      action: { type: 'execute', actionId: 'client', params: {} },
    };

    await appeler();

    expect(ecrituresEffectuees).toContain('executerAction:client');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Les sept points de contrôle
// ═══════════════════════════════════════════════════════════════════════════

describe('les sept chemins d’écriture sont tous gardés', () => {
  // Un rôle `lecture` ne doit RIEN pouvoir écrire, par aucun des sept chemins.
  // C'est le test qui attrape un chemin ajouté plus tard sans son contrôle.
  beforeEach(() => {
    utilisateur = { id: 'owner-1', userId: 'membre-1', role: 'lecture', isOwner: false };
  });

  it('1/7 — écriture confirmée (`execute`)', async () => {
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'intervention', params: {} },
    };
    expect(refuse(await appeler())).toBe(true);
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('2/7 — annulation d’une écriture (`undo`)', async () => {
    // Annuler EST une écriture : ça modifie la base. Un rôle en lecture seule
    // ne doit pas pouvoir défaire le travail d'un autre.
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: {
        type: 'undo',
        actionId: 'intervention',
        id: '11111111-1111-1111-1111-111111111111',
      },
    };
    expect(refuse(await appeler())).toBe(true);
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('3/7 — exécution d’un plan en lot (`executePlan`)', async () => {
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'executePlan', plan: planExemple('intervention') },
    };
    expect(refuse(await appeler())).toBe(true);
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('4/7 — annulation en cascade d’un lot (`undoPlan`)', async () => {
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'undoPlan', id: '11111111-1111-1111-1111-111111111111' },
    };
    expect(refuse(await appeler())).toBe(true);
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('5/7 — écriture AUTOMATIQUE décidée par le moteur', async () => {
    // Le chemin le plus dangereux : personne ne confirme rien. Le moteur décide
    // qu'une intervention est réversible et l'écrit directement.
    reponseMoteur = {
      texte: '',
      manque: false,
      autoExecute: { actionId: 'intervention', params: {} },
    };
    expect(refuse(await appeler())).toBe(true);
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('6/7 — la confirmation n’est même pas PROPOSÉE', async () => {
    // Contrôle plus fin que les autres : il ne s'agit pas d'empêcher une
    // écriture, mais de ne pas afficher un bouton qui ne marchera pas. Proposer
    // puis refuser au clic est la pire des séquences.
    reponseMoteur = {
      texte: 'Je crée le client Jean ?',
      manque: false,
      confirmation: { actionId: 'client', params: {} },
    };
    const evts = await appeler();
    expect(evts.some((e) => e.type === 'confirm')).toBe(false);
    /**
     * ⚠️ ET IL FAUT LE DIRE. Ce cas n'assérait que l'ABSENCE du bouton, alors
     * que son jumeau 7/7 exige en plus la phrase — l'asymétrie était visible
     * dans le banc lui-même, et elle cachait un vrai silence : le texte de
     * l'aperçu venait d'être streamé (« Parfait ! J'ajoute ce client — on
     * valide ? ») et plus rien ne suivait. Ni bouton, ni refus, ni issue.
     * L'apiculteur retapait sa phrase indéfiniment sans jamais apprendre que
     * son rôle était en cause.
     */
    expect(refuse(evts), 'un refus muet laisse devant un écran qui ne bouge plus').toBe(true);
  });

  it('7/7 — le plan n’est même pas PROPOSÉ', async () => {
    reponseMoteur = {
      texte: 'On valide ?',
      manque: false,
      confirmationPlan: { plan: planExemple('intervention') },
    };
    const evts = await appeler();
    expect(evts.some((e) => e.type === 'confirmPlan')).toBe(false);
    expect(refuse(evts)).toBe(true);
  });
});

describe('un lot mixte est refusé EN ENTIER', () => {
  it('une seule étape interdite bloque tout le plan', async () => {
    // Le fan-out est transactionnel : il ne peut pas s'appliquer « en partie ».
    // Un `technicien` a le droit sur `intervention` (terrain) mais pas sur
    // `client` (commerce) — un plan mêlant les deux doit être refusé en bloc,
    // sinon la partie autorisée passerait et laisserait un lot à moitié appliqué.
    utilisateur = { id: 'owner-1', userId: 'membre-1', role: 'technicien', isOwner: false };
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: {
        type: 'executePlan',
        plan: {
          type: 'lot',
          titre: 'Mixte',
          resume: ['2 étapes'],
          etapes: [
            {
              id: 'e1',
              actionId: 'intervention',
              domaine: 'terrain',
              libelle: 'Ruche 1',
              params: {},
            },
            {
              id: 'e2',
              actionId: 'client',
              domaine: 'commerce',
              libelle: 'Client Jean',
              params: {},
            },
          ],
        },
      },
    };

    const evts = await appeler();

    expect(refuse(evts)).toBe(true);
    expect(ecrituresEffectuees, 'aucune étape ne doit passer').toEqual([]);
  });

  it('un lot entièrement dans le domaine du rôle passe', async () => {
    // Le contre-test : sans lui, un refus systématique des lots satisferait le
    // cas précédent tout en cassant la fonctionnalité.
    utilisateur = { id: 'owner-1', userId: 'membre-1', role: 'technicien', isOwner: false };
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'executePlan', plan: planExemple('intervention') },
    };

    await appeler();

    expect(ecrituresEffectuees).toContain('executerPlan');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Le plan d'abonnement appliqué est celui de l'ESPACE
// ═══════════════════════════════════════════════════════════════════════════

describe('quota et plan : c’est l’espace qui compte, pas le membre', () => {
  it('le plan transmis aux écritures est celui du PROPRIÉTAIRE', async () => {
    // Maya écrit dans les mêmes tables que les routes directes, dont le gating
    // dépend du plan. Si Maya prenait le plan du MEMBRE (souvent Découverte,
    // puisqu'il ne paie rien lui-même), un espace Expert perdrait ses modules
    // dès qu'un membre dicte au lieu de cliquer.
    planProprietaire = 'expert';
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'intervention', params: {} },
    };

    await appeler();

    expect(planTransmisAuxEcritures).toBe('expert');
  });

  it('un administrateur Apigo agit en Expert', async () => {
    // Aligné sur `POST /api/interventions/bulk`. Sans ce cas, le support ne
    // pourrait pas reproduire ce que voit un client Expert.
    emailAuthentifie = 'admin@apigo.fr';
    planProprietaire = 'decouverte';
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'intervention', params: {} },
    };

    await appeler();

    expect(planTransmisAuxEcritures).toBe('expert');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. La validation d'entrée
// ═══════════════════════════════════════════════════════════════════════════

describe('ce que la route refuse d’entrée', () => {
  it('refuse un plan plus long que le plafond partagé', async () => {
    // Le client renvoie le plan pour exécution : il est donc MODIFIABLE. Sans
    // cette borne, un plan forgé de 10 000 étapes partirait en une transaction.
    const { MAX_ETAPES_PLAN } = await import('~~/server/utils/copilote-plan');
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: {
        type: 'executePlan',
        plan: {
          type: 'lot',
          titre: 'Trop long',
          resume: [],
          etapes: Array.from({ length: MAX_ETAPES_PLAN + 1 }, (_, i) => ({
            id: `e${i}`,
            actionId: 'intervention',
            domaine: 'terrain',
            libelle: `Ruche ${i}`,
            params: {},
          })),
        },
      },
    };

    await expect(appeler()).rejects.toThrow();
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('refuse une action d’écriture inconnue', async () => {
    // L'énumération est la barrière : un `actionId` libre laisserait passer
    // n'importe quoi vers le registre d'exécution.
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'facture', params: {} },
    };

    await expect(appeler()).rejects.toThrow();
    expect(ecrituresEffectuees).toEqual([]);
  });

  it('refuse une conversation vide', async () => {
    corps = { messages: [] };
    await expect(appeler()).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Le contrat du flux : rien de calculé ne doit se perdre en route
// ═══════════════════════════════════════════════════════════════════════════

describe('flux SSE — tout ce que la route émet est reçu', () => {
  it('aucun type d’événement émis n’est ignoré par le client', () => {
    // Le mode de défaillance visé n'est pas une erreur, c'est un SILENCE : la
    // route calcule un bloc, une suggestion, un bouton d'annulation, l'envoie,
    // et le client ne sait pas quoi en faire. Rien ne casse, rien ne s'affiche,
    // et rien dans les journaux ne le dit.
    //
    // Ce n'est pas une crainte abstraite : c'est exactement ce qui s'est passé
    // ailleurs dans ce même lot (le refus `RUCHE_VERROUILLEE` que le serveur
    // préparait et que le client jetait, les états d'erreur calculés et jamais
    // rendus). Le dernier mètre est là où le travail se perd.
    const route = readFileSync('server/api/ia/copilote.post.ts', 'utf-8');
    const client = readFileSync('app/composables/useCopilote.ts', 'utf-8');

    const emis = [...route.matchAll(/push\(\{\s*type:\s*'(\w+)'/g)].map((m) => m[1]);
    expect(emis.length, 'aucun événement détecté — le motif a dû bouger').toBeGreaterThan(8);

    const ignores = [...new Set(emis)]
      .filter((t) => !new RegExp(`evt\\.type === '${t}'`).test(client))
      .sort();

    expect(ignores).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. La répercussion : ce que Maya écrit doit se voir ailleurs
//
// ⚠️ LE FAUX VERT SE CACHE ICI, ET IL A UN NOM : `runLocal`.
//
// La route a CINQ chemins d'écriture, et `runLocal` — le chemin autonome, le
// plus facile à jouer dans un banc — n'en porte qu'UN, l'intervention. Les huit
// autres actions passent par « Confirmer » (`runExecute`), le lot par
// `runExecutePlan`, et les deux annulations par la racine. Un banc qui ne
// testerait que le premier afficherait un vert complet pendant que « ajoute une
// ruche », « note ce client » et « j'ai vendu 30 pots » — l'essentiel —
// n'invalideraient rien du tout.
//
// D'où le balayage ci-dessous, DÉRIVÉ du catalogue : une dixième action y entre
// toute seule.
// ═══════════════════════════════════════════════════════════════════════════

describe('les CINQ chemins disent au navigateur ce qui a changé', () => {
  /** Les événements d'invalidation présents dans le flux. */
  const invalidations = (evts: Record<string, unknown>[]): string[] =>
    evts.filter((e) => e.type === 'invalider').flatMap((e) => e.evenements as string[]);

  beforeEach(() => {
    // Propriétaire : on mesure la répercussion, pas le RBAC (il a sa section).
    utilisateur = { id: 'owner-1', userId: 'owner-1', role: 'apiculteur', isOwner: true };
  });

  it('garde-fou : une écriture réussie produit BIEN un événement', async () => {
    // Sans ce cas, un `invalider` qui ne pousserait jamais rien rendrait tous
    // les suivants vacuement verts — « rien émis, rien de faux ».
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'client', params: {} },
    };
    expect(invalidations(await appeler()).length).toBeGreaterThan(0);
  });

  it('CHAQUE action qui écrit invalide quelque chose (chemin « Confirmer »)', async () => {
    // ⚠️ LA LISTE EST LE CATALOGUE, PAS UN EXTRAIT. C'est le point exact où ce
    // dépôt s'est déjà fait avoir : un balayage qui nommait quatre actions sur
    // cinq laissait passer la seule dont la règle était cassée.
    const muettes: string[] = [];

    for (const actionId of ACTIONS_IDS) {
      if (!MAYA_ACTIONS[actionId].ecrit) continue;
      poser();
      vi.resetModules();
      utilisateur = { id: 'owner-1', userId: 'owner-1', role: 'apiculteur', isOwner: true };
      corps = {
        messages: [{ role: 'user', content: 'x' }],
        action: { type: 'execute', actionId, params: {} },
      };
      if (invalidations(await appeler()).length === 0) muettes.push(actionId);
    }

    expect(
      muettes,
      "Ces actions écrivent en base et ne disent RIEN au navigateur. L'apiculteur dicte, " +
        "Maya répond « c'est noté », et son écran ne bouge pas — pire, la jauge de plan " +
        'peut alors refuser une action en contredisant ce qu’il a sous les yeux.',
    ).toEqual([]);
  });

  it('le chemin AUTONOME invalide aussi (`runLocal`)', async () => {
    reponseMoteur = {
      texte: 'C’est noté.',
      manque: false,
      autoExecute: { actionId: 'intervention', params: {} },
    };
    expect(invalidations(await appeler())).toContain('intervention:created');
  });

  it('le LOT transmet ce que l’exécuteur a mesuré, sans en perdre', async () => {
    // La route n'a qu'un devoir ici : transmettre. L'union des étapes est
    // dérivée par l'exécuteur, et mesurée par son propre banc.
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'executePlan', plan: planExemple('intervention') },
    };
    expect(invalidations(await appeler()).sort()).toEqual([
      'intervention:created',
      'ruche:created',
    ]);
  });

  it('l’ANNULATION d’une écriture invalide, et parle de suppression', async () => {
    // Le côté qu'on oublie. Un écran qui garde une ligne supprimée après
    // « c'est annulé » est pire que l'inaction : l'apiculteur ne sait plus
    // laquelle des deux croire.
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: {
        type: 'undo',
        actionId: 'ruche',
        id: '11111111-1111-1111-1111-111111111111',
      },
    };
    expect(invalidations(await appeler())).toContain('ruche:deleted');
  });

  it('l’annulation d’un LOT invalide aussi', async () => {
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'undoPlan', id: '11111111-1111-1111-1111-111111111111' },
    };
    expect(invalidations(await appeler())).toEqual(['intervention:deleted']);
  });

  it('un REFUS de rôle n’invalide rien', async () => {
    // Rien n'a été écrit : faire recharger des listes ferait croire le contraire.
    utilisateur = { id: 'owner-1', userId: 'membre-1', role: 'lecture', isOwner: false };
    corps = {
      messages: [{ role: 'user', content: 'x' }],
      action: { type: 'execute', actionId: 'client', params: {} },
    };
    const evts = await appeler();
    expect(refuse(evts)).toBe(true);
    expect(invalidations(evts)).toEqual([]);
  });

  it('une simple QUESTION n’invalide rien', async () => {
    reponseMoteur = { texte: 'Tu as 12 ruches.', manque: false };
    expect(invalidations(await appeler())).toEqual([]);
  });

  it('aucun nom émis n’est inconnu du bus', async () => {
    // ⚠️ `emit` sur une clé inconnue est un NO-OP PARFAIT côté navigateur :
    // pas d'erreur, pas de rafraîchissement, rien dans les journaux. Une faute
    // de frappe serait indétectable en production.
    const inconnus: string[] = [];

    for (const actionId of ACTIONS_IDS) {
      if (!MAYA_ACTIONS[actionId].ecrit) continue;
      poser();
      vi.resetModules();
      utilisateur = { id: 'owner-1', userId: 'owner-1', role: 'apiculteur', isOwner: true };
      corps = {
        messages: [{ role: 'user', content: 'x' }],
        action: { type: 'execute', actionId, params: {} },
      };
      for (const nom of invalidations(await appeler()))
        if (!estEvenementDonnees(nom)) inconnus.push(`${actionId} → ${nom}`);
    }

    expect(inconnus).toEqual([]);
  });
});
