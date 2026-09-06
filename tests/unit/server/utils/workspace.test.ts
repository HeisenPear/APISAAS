// ═══════════════════════════════════════════════════════════════════════════
// WORKSPACE — la source de vérité des droits, côté serveur. Zéro banc jusqu'ici.
//
// C'est le module qui répond à trois questions dont dépend TOUT le reste :
//   · de quel espace de travail les données proviennent-elles (`ownerId`) ;
//   · l'utilisateur a-t-il le droit d'y écrire, et dans quel domaine ;
//   · la ressource qu'il désigne lui appartient-elle vraiment.
//
// Il mérite un banc pour une raison précise, écrite dans son propre en-tête :
// « l'isolation locataire passe par le scoping `userId` côté code (le client
// Drizzle utilise une connexion service-role qui bypasse la RLS) ». Autrement
// dit, les politiques Supabase ne protègent RIEN ici. Ce fichier EST la
// protection. S'il se trompe d'`ownerId`, un apiculteur lit l'exploitation d'un
// autre, et aucune couche en dessous ne le rattrapera.
//
// `app/config/roles.ts` a déjà son banc : la décision pure y est couverte. Ce
// qui ne l'était pas, c'est la couche au-dessus — résolution en base,
// mémoïsation, levée du 403, et le garde-fou de clé étrangère inter-locataires.
//
// ─── AUTO-IMPORTS ─────────────────────────────────────────────────────────
// `db`, `requireAuth` et `createError` sont des auto-imports Nuxt : le module
// les utilise sans les importer. Un `vi.mock('~~/server/utils/db')` n'aurait
// donc AUCUN effet — la leçon a déjà coûté un banc décoratif dans ce dépôt.
// On les pose sur `globalThis`, seul endroit où le code de production ira
// vraiment les chercher.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it } from 'vitest';
import { createError } from 'h3';
import { creerFauxDb, type FauxDb } from '../../../helpers/fauxDb';
import type { WorkspaceRole } from '~/config/roles';

const PROPRIETAIRE = '11111111-1111-1111-1111-111111111111';
const MEMBRE = '22222222-2222-2222-2222-222222222222';
const ETRANGER = '99999999-9999-9999-9999-999999999999';

let faux: FauxDb;
let utilisateurCourant: { id: string };

function poserEnvironnement(lignes: Record<string, unknown[]> = {}) {
  faux = creerFauxDb(lignes);
  Object.assign(globalThis, {
    db: faux.db,
    createError,
    requireAuth: async () => utilisateurCourant,
  });
}

/** Un `H3Event` réduit à ce que le module lit vraiment : son `context`. */
function faireEvent() {
  return { context: {} } as never;
}

beforeEach(() => {
  utilisateurCourant = { id: PROPRIETAIRE };
  poserEnvironnement();
});

describe('resolveWorkspace — de quel espace parle-t-on', () => {
  it('sans invitation acceptée, l’utilisateur est chez lui', async () => {
    const { resolveWorkspace } = await import('~~/server/utils/workspace');
    const ws = await resolveWorkspace(faireEvent());

    expect(ws).toEqual({
      ownerId: PROPRIETAIRE,
      userId: PROPRIETAIRE,
      role: 'owner',
      isMember: false,
    });
  });

  it('avec une invitation acceptée, il opère dans l’espace du propriétaire', async () => {
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'technicien' }] });
    const { resolveWorkspace } = await import('~~/server/utils/workspace');

    const ws = await resolveWorkspace(faireEvent());

    // LE point : les données servies seront celles du PROPRIÉTAIRE, alors que
    // l'utilisateur authentifié est le membre. Confondre les deux, c'est soit
    // priver le membre de tout, soit lui ouvrir un espace qui n'est pas le sien.
    expect(ws.ownerId).toBe(PROPRIETAIRE);
    expect(ws.userId).toBe(MEMBRE);
    expect(ws.role).toBe('technicien');
    expect(ws.isMember).toBe(true);
  });

  it('ne cherche l’appartenance que pour l’utilisateur authentifié', async () => {
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'admin' }] });
    const { resolveWorkspace } = await import('~~/server/utils/workspace');

    await resolveWorkspace(faireEvent());

    // La requête doit filtrer sur l'identifiant de CELUI QUI DEMANDE, et sur le
    // statut « acceptee ». Sans le second, une invitation en attente — ou
    // refusée — ouvrirait l'espace.
    //
    // On vérifie la COLONNE autant que la valeur : une assertion portant
    // seulement sur « acceptee » restait vraie même après retrait du filtre,
    // la chaîne étant atteignable dans les métadonnées de la colonne. Le test
    // de mutation l'a démontré ; c'est pourquoi `aFiltreLaColonne` existe.
    expect(faux.aFiltreLaColonne('user_id')).toBe(true);
    expect(faux.aFiltreSur(MEMBRE)).toBe(true);
    expect(faux.aFiltreLaColonne('statut')).toBe(true);
    expect(faux.aFiltreSur('acceptee')).toBe(true);
    expect(faux.aFiltreSur(PROPRIETAIRE)).toBe(false);
  });

  it('mémoïse : deux appels dans la même requête HTTP, une seule requête SQL', async () => {
    const { resolveWorkspace } = await import('~~/server/utils/workspace');
    const event = faireEvent();

    const a = await resolveWorkspace(event);
    const b = await resolveWorkspace(event);

    expect(b).toBe(a);
    expect(faux.requetes).toHaveLength(1);
  });

  it('ne mémoïse pas d’une requête HTTP à l’autre', async () => {
    // Deux apiculteurs différents sur la même instance serverless : un cache
    // qui déborderait d'un événement à l'autre servirait l'espace du premier
    // au second.
    const { resolveWorkspace } = await import('~~/server/utils/workspace');

    const premier = await resolveWorkspace(faireEvent());
    utilisateurCourant = { id: ETRANGER };
    const second = await resolveWorkspace(faireEvent());

    expect(premier.ownerId).toBe(PROPRIETAIRE);
    expect(second.ownerId).toBe(ETRANGER);
  });
});

describe('resolveOwnerId — le raccourci qu’appellent les routes', () => {
  it('rend l’espace du propriétaire, pas l’utilisateur connecté', async () => {
    // Une ligne, mais c'est elle que les routes de lecture utilisent pour
    // scoper leurs requêtes. Si elle rendait `userId`, un membre verrait une
    // exploitation vide au lieu de celle qu'il gère.
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'comptable' }] });
    const { resolveOwnerId } = await import('~~/server/utils/workspace');

    expect(await resolveOwnerId(faireEvent())).toBe(PROPRIETAIRE);
  });
});

describe('assertCanWrite — qui écrit quoi', () => {
  /** Matrice complète : chaque rôle, chaque domaine, l'attendu. */
  const MATRICE: { role: WorkspaceRole; terrain: boolean; commerce: boolean }[] = [
    { role: 'owner', terrain: true, commerce: true },
    { role: 'admin', terrain: true, commerce: true },
    { role: 'apiculteur', terrain: true, commerce: true },
    { role: 'technicien', terrain: true, commerce: false },
    { role: 'comptable', terrain: false, commerce: true },
    { role: 'lecture', terrain: false, commerce: false },
  ];

  for (const { role, terrain, commerce } of MATRICE) {
    it(`${role} : terrain ${terrain ? 'autorisé' : 'refusé'}, commerce ${commerce ? 'autorisé' : 'refusé'}`, async () => {
      for (const [domaine, permis] of [
        ['terrain', terrain],
        ['commerce', commerce],
      ] as const) {
        utilisateurCourant = { id: MEMBRE };
        poserEnvironnement(role === 'owner' ? {} : { membres: [{ ownerId: PROPRIETAIRE, role }] });
        const { assertCanWrite } = await import('~~/server/utils/workspace');

        const appel = assertCanWrite(faireEvent(), domaine);
        if (permis) {
          await expect(appel).resolves.toBeDefined();
        } else {
          await expect(appel).rejects.toMatchObject({ statusCode: 403 });
        }
      }
    });
  }

  it('écrit sur le terrain par défaut, sans domaine explicite', async () => {
    // 156 routes d'écriture appellent ce garde-fou ; la plupart sans argument.
    // Si le défaut basculait sur `commerce`, un technicien perdrait le rucher
    // et un comptable gagnerait les ruches — en silence.
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'comptable' }] });
    const { assertCanWrite } = await import('~~/server/utils/workspace');

    await expect(assertCanWrite(faireEvent())).rejects.toMatchObject({ statusCode: 403 });
  });

  it('le refus NOMME la raison — jamais un mur muet', async () => {
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'technicien' }] });
    const { assertCanWrite } = await import('~~/server/utils/workspace');

    await expect(assertCanWrite(faireEvent(), 'commerce')).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('technicien'),
    });
  });

  it('rend l’espace quand il autorise, pour enchaîner sur ownerId', async () => {
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'apiculteur' }] });
    const { assertCanWrite } = await import('~~/server/utils/workspace');

    const ws = await assertCanWrite(faireEvent(), 'commerce');

    // Les routes écrivent sur `ws.ownerId`. S'il rendait `userId`, un membre
    // créerait ses données dans un espace fantôme, invisible du propriétaire.
    expect(ws.ownerId).toBe(PROPRIETAIRE);
  });
});

describe('assertFkBelongsToOwner — la clé étrangère d’un autre locataire', () => {
  it('laisse passer une référence absente : une FK optionnelle reste optionnelle', async () => {
    const { assertFkBelongsToOwner } = await import('~~/server/utils/workspace');
    const { ruches } = await import('~~/server/database/schema');

    await expect(
      assertFkBelongsToOwner(PROPRIETAIRE, ruches, ruches.id, ruches.userId, null),
    ).resolves.toBeUndefined();
    // Aucune requête ne doit partir pour un identifiant nul.
    expect(faux.requetes).toHaveLength(0);
  });

  it('accepte une référence de l’espace courant', async () => {
    poserEnvironnement({ ruches: [{ ok: 'r1' }] });
    const { assertFkBelongsToOwner } = await import('~~/server/utils/workspace');
    const { ruches } = await import('~~/server/database/schema');

    await expect(
      assertFkBelongsToOwner(PROPRIETAIRE, ruches, ruches.id, ruches.userId, 'r1'),
    ).resolves.toBeUndefined();
  });

  it('REFUSE une référence introuvable dans l’espace — le cœur du cloisonnement', async () => {
    // La ruche existe peut-être, mais pas chez ce propriétaire. Sans ce
    // contrôle, un compte rattache sa récolte à la ruche d'un autre : la RLS
    // ne le verrait pas, la connexion serveur la contourne.
    poserEnvironnement({ ruches: [] });
    const { assertFkBelongsToOwner } = await import('~~/server/utils/workspace');
    const { ruches } = await import('~~/server/database/schema');

    await expect(
      assertFkBelongsToOwner(PROPRIETAIRE, ruches, ruches.id, ruches.userId, 'ruche-du-voisin'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('filtre sur l’identifiant ET sur le propriétaire', async () => {
    // Un contrôle qui ne filtrerait que sur l'identifiant validerait
    // n'importe quelle ruche de n'importe quel compte.
    poserEnvironnement({ ruches: [{ ok: 'r1' }] });
    const { assertFkBelongsToOwner } = await import('~~/server/utils/workspace');
    const { ruches } = await import('~~/server/database/schema');

    await assertFkBelongsToOwner(PROPRIETAIRE, ruches, ruches.id, ruches.userId, 'r1');

    expect(faux.aFiltreLaColonne('id')).toBe(true);
    expect(faux.aFiltreSur('r1')).toBe(true);
    // La seconde moitié est celle qui cloisonne : sans elle, on validerait
    // n'importe quelle ruche de n'importe quel compte.
    expect(faux.aFiltreLaColonne('user_id')).toBe(true);
    expect(faux.aFiltreSur(PROPRIETAIRE)).toBe(true);
  });

  it('le message nomme la ressource, pour que l’apiculteur sache quoi corriger', async () => {
    poserEnvironnement({ ruches: [] });
    const { assertFkBelongsToOwner } = await import('~~/server/utils/workspace');
    const { ruches } = await import('~~/server/database/schema');

    await expect(
      assertFkBelongsToOwner(PROPRIETAIRE, ruches, ruches.id, ruches.userId, 'x', 'Ruche'),
    ).rejects.toMatchObject({ message: expect.stringContaining('Ruche') });
  });
});

describe('plan du propriétaire — c’est SON abonnement qui compte', () => {
  it('lit le plan du propriétaire de l’espace, pas celui du membre', async () => {
    // Un membre en Découverte invité dans un espace Expert doit disposer des
    // capacités de l'espace. L'inverse — facturer les capacités au membre —
    // priverait une équipe de ce que son propriétaire a payé.
    poserEnvironnement({ profils: [{ plan: 'expert' }] });
    const { planDuProprietaire } = await import('~~/server/utils/workspace');

    expect(await planDuProprietaire(PROPRIETAIRE)).toBe('expert');
    expect(faux.aFiltreSur(PROPRIETAIRE)).toBe(true);
  });

  it('retombe sur Découverte quand le profil est introuvable', async () => {
    poserEnvironnement({ profils: [] });
    const { planDuProprietaire } = await import('~~/server/utils/workspace');

    // Le repli doit être le plan le MOINS capable : un profil illisible ne doit
    // jamais ouvrir des fonctionnalités payantes.
    expect(await planDuProprietaire(PROPRIETAIRE)).toBe('decouverte');
  });

  it('les rôles restreints sont réservés à la formule qui les vend', async () => {
    for (const [plan, attendu] of [
      ['expert', true],
      ['pro', false],
      ['starter', false],
      ['decouverte', false],
    ] as const) {
      poserEnvironnement({ profils: [{ plan }] });
      const { peutAssignerRolesRestreints } = await import('~~/server/utils/workspace');
      expect(await peutAssignerRolesRestreints(PROPRIETAIRE), plan).toBe(attendu);
    }
  });
});

describe('requireWorkspace — la forme attendue par Maya', () => {
  it('expose le PROPRIÉTAIRE comme `id`, et l’utilisateur réel à part', async () => {
    // Le copilote écrit sur `.id`. S'il recevait l'utilisateur authentifié, un
    // membre dicterait ses visites dans un espace vide au lieu de celui de son
    // exploitation.
    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'technicien' }] });
    const { requireWorkspace } = await import('~~/server/utils/workspace');

    const u = await requireWorkspace(faireEvent());

    expect(u).toEqual({
      id: PROPRIETAIRE,
      userId: MEMBRE,
      role: 'technicien',
      isOwner: false,
    });
  });

  it('`isOwner` est vrai chez soi, faux en tant que membre', async () => {
    const { requireWorkspace } = await import('~~/server/utils/workspace');
    expect((await requireWorkspace(faireEvent())).isOwner).toBe(true);

    utilisateurCourant = { id: MEMBRE };
    poserEnvironnement({ membres: [{ ownerId: PROPRIETAIRE, role: 'admin' }] });
    const { requireWorkspace: rw } = await import('~~/server/utils/workspace');
    expect((await rw(faireEvent())).isOwner).toBe(false);
  });
});
