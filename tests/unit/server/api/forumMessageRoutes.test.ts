// ═══════════════════════════════════════════════════════════════════════════
// LES ROUTES D'UN MESSAGE — CE QUI PART VRAIMENT DANS LE `WHERE`.
//
// `forumModeration.test.ts` mesure la RÈGLE (fonctions pures). Celui-ci mesure
// que les ROUTES s'en servent, et surtout ce qu'elles envoient à SQL — une
// question distincte, et celle où vivent les défauts de cloisonnement.
//
// ─── CE QUE CE BANC INTERDIT ───────────────────────────────────────────────
//   · modifier ou supprimer le message de QUELQU'UN D'AUTRE : `auteurId` doit
//     être dans la condition, pas seulement dans une lecture qui la précède ;
//   · RÉÉCRIRE un message MASQUÉ. Sans `statut = 'visible'` au filtre, celui
//     dont le message vient d'être masqué par trois signalements le remplace
//     par un texte anodin : l'arbitre arrive sur un contenu innocent, rétablit
//     le message, et compte un tort à CHACUN des trois signaleurs — qui
//     avaient raison. Trois comptes punis pour avoir bien signalé, et le
//     mécanisme de suspension retourné contre ceux qu'il protège ;
//   · tronquer un fil en silence : la lecture doit rendre le TOTAL réel.
//
// ⚠️ LE DOUBLE REFUSE CE QUE LE VRAI REFUSERAIT. Une lecture de messages sans
// `sujetId` lève : sans lui, la requête rend les messages de TOUT le forum
// sous le titre d'un seul sujet — page pleine, cohérente, et fausse. Un double
// plus permissif que le réel laisserait passer exactement ce défaut-là.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { messagesForum, sujetsForum } from '~~/server/database/schema';
import { readFileSync } from 'node:fs';
import { valeursLiees } from '../../../helpers/fauxDb';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

const MOI = '00000000-0000-4000-8000-00000000000a';
const AUTRE = '00000000-0000-4000-8000-00000000000b';
const MESSAGE = '11111111-1111-4111-8111-111111111111';
const SUJET = '22222222-2222-4222-8222-222222222222';

let lignesEnBase: Record<string, Array<Record<string, unknown>>>;
let updates: Array<{ table: string; ecrit: Record<string, unknown>; ou: string[] }>;
let lectures: Array<{ table: string; ou: string[]; limite: number | null; saut: number }>;
let corps: Record<string, unknown>;
let requete: Record<string, unknown>;
let parametre: string;

function faireDb() {
  return {
    select: (cols?: unknown) => {
      /**
       * ⚠️ UN `count(*)` N'EST PAS UNE LECTURE DE LIGNES, ET LE DOUBLE DOIT
       * SAVOIR LES DISTINGUER. Rendre les 250 lignes déclarées à une requête
       * d'agrégat fait lire `total?.n` sur une ligne de message : `undefined`,
       * donc `0` — et le banc du total mesurerait alors le double, pas la
       * route.
       *
       * On ne cherche PAS à interpréter le SQL (ce serait se tester soi-même) :
       * on reconnaît la FORME d'un agrégat dans la projection, et on rend le
       * nombre de lignes déclarées. Le filtre n'est pas appliqué — le double
       * n'interprète aucune condition — donc c'est un compte de la table, ce
       * qui suffit à mesurer « la route rend-elle un total, et vient-il d'une
       * requête distincte ».
       */
      const estUnCompte = estProjectionDeComptage(cols);
      let nom = '(inconnue)';
      let ou: string[] = [];
      let limite: number | null = null;
      let saut = 0;
      const chaine = {
        from: (t: PgTable) => {
          nom = getTableName(t);
          return chaine;
        },
        innerJoin: () => chaine,
        leftJoin: () => chaine,
        where: (cond: unknown) => {
          ou = valeursLiees(cond);
          return chaine;
        },
        orderBy: () => chaine,
        limit: (n: number) => {
          limite = n;
          return chaine;
        },
        offset: (n: number) => {
          saut = n;
          return chaine;
        },
        then: (ok: (v: unknown[]) => unknown, ko?: (e: unknown) => unknown) => {
          try {
            if (nom === getTableName(messagesForum) && !ou.includes(SUJET) && !ou.includes(MESSAGE))
              throw new Error(
                '[double] lecture de `messages_forum` sans `sujetId` ni identifiant : la ' +
                  'requête rendrait les messages de TOUT le forum sous le titre d’un seul fil.',
              );
            lectures.push({ table: nom, ou, limite, saut });
            if (estUnCompte) {
              return Promise.resolve([{ n: (lignesEnBase[nom] ?? []).length }]).then(ok, ko);
            }
            const toutes = (lignesEnBase[nom] ?? []).slice(saut);
            return Promise.resolve(limite == null ? toutes : toutes.slice(0, limite)).then(ok, ko);
          } catch (e) {
            return Promise.reject(e).then(ok, ko);
          }
        },
      };
      return chaine;
    },
    update: (t: PgTable) => ({
      set: (ecrit: Record<string, unknown>) => ({
        where: (cond: unknown) => {
          const ou = valeursLiees(cond);
          const nom = getTableName(t);
          updates.push({ table: nom, ecrit, ou });
          /**
           * Le double rend une ligne SI ET SEULEMENT SI la condition vise le
           * message de la personne. C'est ainsi que la vraie base se
           * comporterait : un `where` qui ne correspond à rien ne rend rien,
           * et `returning()` vide est ce qui fait répondre 404 à la route.
           */
          const trouve = ou.includes(MESSAGE) && ou.includes(MOI);
          const lignes = trouve ? [{ id: MESSAGE, modifieLe: new Date(), sujetId: SUJET }] : [];
          const p = Promise.resolve(lignes);
          return Object.assign(p, { returning: async () => lignes });
        },
      }),
    }),
  };
}

beforeEach(() => {
  updates = [];
  lectures = [];
  corps = {};
  requete = {};
  parametre = MESSAGE;
  lignesEnBase = {};
  vi.resetModules();
  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireAuth: async () => ({ id: MOI }),
    sessionFacultative: async () => ({ id: MOI }),
    getRouterParam: () => parametre,
    readValidatedBody: async (_e: unknown, parse: (v: unknown) => unknown) => parse(corps),
    getValidatedQuery: async (_e: unknown, parse: (v: unknown) => unknown) => parse(requete),
    setResponseStatus: () => {},
    createError: (o: { statusCode: number; message: string }) =>
      Object.assign(new Error(o.message), o),
    db: faireDb(),
  });
});

describe('garde-fou du harnais', () => {
  it('le double refuse une lecture de messages sans sujet', async () => {
    /**
     * Sans ce cas, on ne saurait pas si le refus du double fonctionne — et un
     * double permissif rendrait vertes toutes les règles qui suivent.
     */
    const faux = faireDb();
    await expect(faux.select().from(messagesForum).where(undefined).limit(10)).rejects.toThrow(
      /sans `sujetId`/,
    );
  });
});

describe('PUT /api/forum/messages/[id] — corriger SON message', () => {
  it('le `where` porte l’identifiant ET l’auteur', async () => {
    corps = { contenu: 'Je corrige ma faute de frappe.' };
    const { default: handler } = await import('~~/server/api/forum/messages/[id].put');
    await (handler as (e: unknown) => Promise<unknown>)({});

    const maj = updates.find((u) => u.table === getTableName(messagesForum));
    expect(maj, 'aucune écriture sur messages_forum').toBeDefined();
    expect(
      maj!.ou,
      'Le filtre ne porte pas l’auteur : n’importe qui réécrirait le message d’un autre. ' +
        'Le `where` EST le contrôle — un `select` préalable ne suffit pas, la ligne peut ' +
        'changer entre les deux.',
    ).toContain(MOI);
    expect(maj!.ou).toContain(MESSAGE);
  });

  it('le `where` exige un message VISIBLE — la porte de la modération', () => {
    /**
     * ⚠️ CETTE RÈGLE SE LIT DANS LE SOURCE, ET C'EST ASSUMÉ. `valeursLiees`
     * ne rend que les valeurs de PARAMÈTRE ; `'visible'` passe par l'énuméré
     * Postgres et n'apparaît pas toujours comme tel. Plutôt qu'une assertion
     * qui pourrait être satisfaite par autre chose, on vise la forme exacte
     * dans le corps de la route, commentaires blanchis.
     */
    expect(
      corpsDeLaRoute('server/api/forum/messages/[id].put.ts'),
      'Le filtre n’exige pas `statut = visible` : un message masqué par trois signalements ' +
        'pourrait être réécrit en texte anodin, l’arbitre le rétablirait, et les trois ' +
        'signaleurs — qui avaient raison — écoperaient chacun d’un tort.',
    ).toMatch(/eq\(\s*messagesForum\.statut\s*,\s*'visible'\s*\)/);
  });

  it('écrit `modifieLe`, et pas seulement `updatedAt`', async () => {
    /**
     * `updatedAt` est touché par `recomputerMessage` à chaque signalement : un
     * message simplement signalé s'afficherait « modifié le … ». Sur un forum,
     * cette phrase veut dire « il s'est rétracté » — c'est une insinuation.
     */
    corps = { contenu: 'Un contenu corrigé.' };
    const { default: handler } = await import('~~/server/api/forum/messages/[id].put');
    await (handler as (e: unknown) => Promise<unknown>)({});
    expect(Object.keys(updates[0]!.ecrit)).toContain('modifieLe');
  });

  it('un message qui n’est pas le sien répond 404, sans dire lequel', async () => {
    // Le double ne rend une ligne que si le filtre vise MOI : ici, il ne rend
    // rien, exactement comme la vraie base sur un `where` qui ne correspond pas.
    parametre = '99999999-9999-4999-8999-999999999999';
    corps = { contenu: 'Je réécris le message de quelqu’un d’autre.' };
    const { default: handler } = await import('~~/server/api/forum/messages/[id].put');
    await expect((handler as (e: unknown) => Promise<unknown>)({})).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('un contenu vide est refusé avant d’atteindre la base', async () => {
    corps = { contenu: ' ' };
    const { default: handler } = await import('~~/server/api/forum/messages/[id].put');
    await expect((handler as (e: unknown) => Promise<unknown>)({})).rejects.toThrow();
    expect(updates, 'une écriture est partie malgré un contenu vide').toEqual([]);
  });
});

describe('DELETE /api/forum/messages/[id] — retirer SON message', () => {
  it('change le statut au lieu de supprimer la ligne', async () => {
    /**
     * Un vrai `delete` emporterait les signalements en cascade : un message
     * insultant, signalé trois fois puis effacé par son auteur, effacerait du
     * même coup la trace de ce qui lui était reproché — et remettrait son
     * compteur de torts à zéro.
     */
    const { default: handler } = await import('~~/server/api/forum/messages/[id].delete');
    await (handler as (e: unknown) => Promise<unknown>)({});
    expect(updates[0]!.ecrit.statut).toBe('supprime');
    expect(updates[0]!.ou).toContain(MOI);
  });
});

describe('GET /api/forum/sujets/[slug] — le fil ne se tronque pas en silence', () => {
  beforeEach(() => {
    parametre = 'mon-sujet';
    lignesEnBase = {
      [getTableName(sujetsForum)]: [
        {
          id: SUJET,
          titre: 'Varroa',
          slug: 'varroa',
          statut: 'visible',
          createdAt: new Date(),
          auteurId: AUTRE,
          auteurPrenom: 'Camille',
          auteurNom: 'Dubois',
        },
      ],
      [getTableName(messagesForum)]: Array.from({ length: 250 }, (_, i) => ({
        id: `${i}`,
        contenu: `message ${i}`,
        statut: 'visible',
        createdAt: new Date(),
        modifieLe: null,
        auteurId: i === 0 ? MOI : AUTRE,
        auteurPrenom: null,
        auteurNom: null,
      })),
    };
  });

  it('rend une PAGE, pas les 250 messages d’un coup', async () => {
    const { default: handler } = await import('~~/server/api/forum/sujets/[slug].get');
    const res = (await (handler as (e: unknown) => Promise<{ data: { messages: unknown[] } }>)(
      {},
    )) as { data: { messages: unknown[]; total: number; page: number; parPage: number } };
    expect(res.data.messages.length).toBeLessThan(250);
    expect(res.data.messages.length).toBe(res.data.parPage);
  });

  it('rend le TOTAL réel — sinon l’écran ne peut pas dire ce qui manque', async () => {
    /**
     * ⚠️ LE DÉFAUT D'ORIGINE. La route portait `.limit(500)` et rien d'autre :
     * au-delà, la fin du fil disparaissait sans erreur, sans compteur, sans
     * bouton. Sur une CONVERSATION, ce qui manque à la fin est exactement ce
     * qu'on venait lire — les réponses.
     */
    const { default: handler } = await import('~~/server/api/forum/sujets/[slug].get');
    const res = (await (handler as (e: unknown) => Promise<unknown>)({})) as {
      data: { total: number; messages: unknown[] };
    };
    expect(
      res.data.total,
      'La réponse ne porte pas le total : l’écran ne peut pas savoir qu’il en reste, ' +
        'donc le fil se termine en silence au milieu de la conversation.',
    ).toBeGreaterThan(res.data.messages.length);
  });

  it('la page demandée est bien celle qui part en base', async () => {
    requete = { page: 2 };
    const { default: handler } = await import('~~/server/api/forum/sujets/[slug].get');
    await (handler as (e: unknown) => Promise<unknown>)({});
    const lecture = lectures.find((l) => l.table === getTableName(messagesForum) && l.limite);
    expect(lecture!.saut, 'la page n’est pas traduite en `offset`').toBeGreaterThan(0);
  });

  it('dit au lecteur lesquels sont SES messages, sans exposer d’identifiant', async () => {
    const { default: handler } = await import('~~/server/api/forum/sujets/[slug].get');
    const res = (await (handler as (e: unknown) => Promise<unknown>)({})) as {
      data: { messages: Array<Record<string, unknown>> };
    };
    const mien = res.data.messages.find((m) => m.estMien);
    expect(mien, 'aucun message marqué `estMien` alors que le lecteur en a un').toBeDefined();
    for (const m of res.data.messages) {
      expect(
        JSON.stringify(m),
        'un identifiant de compte est sorti par une route PUBLIQUE',
      ).not.toContain(MOI);
    }
  });
});

/**
 * La projection est-elle un agrégat de comptage ?
 *
 * On regarde les MORCEAUX de la requête SQL (`queryChunks`) — ce que Drizzle
 * expose déjà, et ce que `valeursLiees` parcourt aussi. Pas d'analyse de
 * chaîne sur du code, pas de nom de variable en dur.
 */
function estProjectionDeComptage(cols: unknown): boolean {
  if (!cols || typeof cols !== 'object') return false;
  return Object.values(cols as Record<string, unknown>).some((v) => {
    const chunks = (v as { queryChunks?: unknown[] })?.queryChunks;
    if (!Array.isArray(chunks)) return false;
    /**
     * ⚠️ UN MORCEAU N'EST PAS UNE CHAÎNE, ET LE CROIRE RENDAIT CETTE SONDE
     * TOUJOURS FAUSSE. Drizzle enveloppe le texte brut dans un `StringChunk`
     * dont `.value` est un TABLEAU de chaînes : `[['count(*)::int']]`. Un
     * `typeof c === 'string'` ne voyait donc jamais rien, et la détection
     * renvoyait `false` en silence — mesuré, pas supposé.
     */
    return chunks.some((c) => {
      const brut = (c as { value?: unknown })?.value;
      const morceaux = Array.isArray(brut) ? brut : [brut, c];
      return morceaux.some((m) => typeof m === 'string' && m.includes('count('));
    });
  });
}

/**
 * Le corps d'une route, COMMENTAIRES BLANCHIS.
 *
 * ⚠️ Sans le blanchiment, la règle serait satisfaite par la note qui l'explique
 * — le piège « le banc s'accuse lui-même », tombé six fois dans ce dépôt. Ici
 * la note du fichier PARLE de `statut = 'visible'` : c'est exactement le cas
 * où une recherche brute dans le source resterait verte après suppression du
 * prédicat.
 */
function corpsDeLaRoute(chemin: string): string {
  return sansCommentaires(readFileSync(chemin, 'utf-8'));
}
