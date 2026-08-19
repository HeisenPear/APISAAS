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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rolePeutEcrire, type DomaineEcriture } from '../../../../app/config/roles';
import type { WorkspaceUser } from '../../../../server/utils/workspace';

type ActionMaya = 'intervention' | 'client' | 'recolte' | 'stock' | 'vente';

/** Domaine de chaque action, tel que la route le déclare. */
const DOMAINE: Record<ActionMaya, DomaineEcriture> = {
  intervention: 'terrain',
  recolte: 'terrain',
  stock: 'terrain',
  client: 'commerce',
  vente: 'commerce',
};

const ACTIONS: ActionMaya[] = ['intervention', 'recolte', 'stock', 'client', 'vente'];
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

vi.mock('~~/server/utils/copilote-executeur', () => ({
  executerPlan: async (_u: string, _plan: unknown, planAbo: string) => {
    ecrituresEffectuees.push('executerPlan');
    planTransmisAuxEcritures = planAbo;
    return { ok: true, texte: 'Lot appliqué.', planExecId: 'p1' };
  },
  annulerPlan: async () => {
    ecrituresEffectuees.push('annulerPlan');
    return { ok: true, texte: 'Lot annulé.' };
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

function poser() {
  flux = [];
  ecrituresEffectuees = [];
  planTransmisAuxEcritures = null;
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
    // Le balayage complet : 5 rôles × 5 actions = 25 combinaisons, comparées à
    // la source de vérité plutôt qu'à une table recopiée ici. Un rôle ajouté
    // demain est couvert sans toucher ce fichier.
    const ecarts: string[] = [];

    for (const role of ROLES) {
      for (const actionId of ACTIONS) {
        poser();
        vi.resetModules();
        utilisateur = { id: 'owner-1', userId: 'membre-1', role, isOwner: false };
        corps = {
          messages: [{ role: 'user', content: 'peu importe' }],
          action: { type: 'execute', actionId, params: {} },
        };

        const evts = await appeler();
        const aEcrit = ecrituresEffectuees.length > 0;
        const devraitPouvoir = rolePeutEcrire(role, DOMAINE[actionId]);

        if (aEcrit !== devraitPouvoir) {
          ecarts.push(
            `${role} × ${actionId} : écriture ${aEcrit ? 'PASSÉE' : 'refusée'}, attendu ${devraitPouvoir ? 'autorisée' : 'REFUSÉE'}`,
          );
        }
        if (!devraitPouvoir && !refuse(evts)) {
          ecarts.push(`${role} × ${actionId} : refusé sans le dire`);
        }
      }
    }

    expect(ecarts).toEqual([]);
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
