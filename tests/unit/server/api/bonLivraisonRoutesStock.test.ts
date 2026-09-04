// ═══════════════════════════════════════════════════════════════════════════
// LES QUATRE PORTES BOUGENT LE STOCK, ET ELLES LAISSENT UNE TRACE.
//
// `bonLivraisonStock.test.ts` mesure la RÈGLE (les fonctions pures). Celui-ci
// mesure que les routes s'en servent — et c'est une question distincte : le
// défaut d'origine n'était pas une mauvaise formule, c'était QUATRE routes qui
// calculaient chacune la leur, dont une qui ne calculait rien.
//
// ─── CE QUE CE BANC AURAIT ATTRAPÉ ─────────────────────────────────────────
//   · la création décrémentait le stock sans écrire AUCUN mouvement ;
//   · l'édition des lignes ne bougeait rien — huit pots sur dix disparaissaient
//     entre une correction et l'annulation qui suivait ;
//   · l'annulation écrivait une trace sans `referenceType` ni `referenceId` :
//     impossible de remonter au bon.
//
// ─── CE QUI EST DOUBLÉ, ET CE QUI NE L'EST PAS ─────────────────────────────
// La base est doublée — elle n'interprète pas le SQL, elle ENREGISTRE ce qu'on
// lui demande d'écrire. Tout le reste est RÉEL : les routes, la mécanique de
// stock, le schéma Zod, le calcul des totaux. C'est là que vivaient les
// défauts.
//
// ⚠️ LE DOUBLE REFUSE CE QUE LE VRAI REFUSERAIT. Une écriture dans `stocks`
// sans condition de propriétaire lève : la RLS ne protège rien côté serveur
// (`db.ts` ouvre une connexion service-role qui la contourne), c'est ce
// `eq(stocks.userId, ownerId)` et lui seul qui empêche un bon d'une
// exploitation de bouger le stock d'une autre. Un double plus permissif que le
// réel laisserait passer exactement le défaut qu'on veut interdire.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer l'appel à `appliquerStockBonLivraison` de n'importe quelle route ;
//   · retirer `referenceType` / `referenceId` du mouvement écrit ;
//   · retirer `eq(stocks.userId, ownerId)` de la mise à jour du stock.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { bonsLivraison, mouvementsStock, stocks } from '~~/server/database/schema';
import { valeursLiees } from '../../../helpers/fauxDb';

const OWNER = '00000000-0000-4000-8000-00000000000a';
const AUTRE = '00000000-0000-4000-8000-00000000000b';
const POTS = '11111111-1111-4111-8111-111111111111';
const BON = '33333333-3333-4333-8333-333333333333';

/** Ce que la base contient AVANT l'appel, par table. */
let lignesEnBase: Record<string, Array<Record<string, unknown>>>;
/** Ce qui part réellement en écriture. */
let inserts: Array<{ table: string; valeurs: Record<string, unknown> }>;
let updates: Array<{ table: string; valeurs: Record<string, unknown>; valeursOu: string[] }>;
let corps: Record<string, unknown>;

function faireDb() {
  return {
    select: (_cols?: unknown) => ({
      from: (t: PgTable) => {
        const nom = getTableName(t);
        const rendu = () => lignesEnBase[nom] ?? [];
        // La création lit le dernier numéro : `.where().orderBy().limit()`.
        const fin = { limit: async () => rendu() };
        const chaine = {
          leftJoin: () => chaine,
          where: () => ({ ...fin, orderBy: () => fin }),
        };
        return chaine;
      },
    }),
    insert: (t: PgTable) => ({
      values: (valeurs: Record<string, unknown>) => {
        inserts.push({ table: getTableName(t), valeurs });
        const ligne = { id: BON, numero: 'BL-2026-0007', statut: 'brouillon', ...valeurs };
        const p = Promise.resolve([ligne]);
        return Object.assign(p, { returning: async () => [ligne] });
      },
    }),
    update: (t: PgTable) => ({
      set: (valeursEcrites: Record<string, unknown>) => ({
        where: (cond: unknown) => {
          const valeurs = valeursLiees(cond);
          const nom = getTableName(t);
          if (nom === getTableName(stocks) && !valeurs.includes(OWNER)) {
            throw new Error(
              `[double] écriture dans « ${nom} » sans condition de propriétaire : ` +
                "c'est le seul rempart entre deux exploitations, la RLS étant contournée.",
            );
          }
          updates.push({ table: nom, valeurs: valeursEcrites, valeursOu: valeurs });
          const ligne = { id: BON, ...valeursEcrites };
          const p = Promise.resolve([ligne]);
          return Object.assign(p, { returning: async () => [ligne] });
        },
      }),
    }),
    delete: () => ({ where: async () => [] }),
  };
}

beforeEach(() => {
  inserts = [];
  updates = [];
  corps = {};
  lignesEnBase = {};
  vi.resetModules();
  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireAuth: async () => ({ id: OWNER }),
    assertCanWrite: async () => ({ ownerId: OWNER }),
    resolveOwnerId: async () => OWNER,
    readValidatedBody: async (_e: unknown, parse: (v: unknown) => unknown) => parse(corps),
    getRouterParam: () => BON,
    setResponseStatus: () => {},
    createError: (o: { statusCode: number; message: string }) =>
      Object.assign(new Error(o.message), o),
    badRequest: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 400 });
    },
    db: faireDb(),
  });
});

async function appeler(chemin: string) {
  const mod = await import(/* @vite-ignore */ chemin);
  return (mod.default as (e: unknown) => Promise<unknown>)({ context: {} });
}

/** Les mouvements de stock écrits, sous une forme lisible. */
function mouvements() {
  return inserts
    .filter((i) => i.table === getTableName(mouvementsStock))
    .map((i) => ({
      type: i.valeurs.type,
      quantite: Number(i.valeurs.quantite),
      stockId: i.valeurs.stockId,
      origine: i.valeurs.referenceType,
      reference: i.valeurs.referenceId,
    }));
}

const LIGNE_STOCK = {
  description: 'Pot 500 g',
  quantite: 10,
  prixUnitaire: 9.9,
  stockId: POTS,
};

describe('la création d’un bon de livraison', () => {
  beforeEach(() => {
    lignesEnBase[getTableName(bonsLivraison)] = [];
  });

  it('GARDE-FOU : elle crée bien le bon', async () => {
    // Sans ce cas, une route qui lèverait avant toute écriture rendrait les
    // autres verts par vacuité.
    corps = { dateCreation: '2026-09-04', lignes: [LIGNE_STOCK] };
    await appeler('~~/server/api/bons-livraison/index.post');
    expect(inserts.some((i) => i.table === getTableName(bonsLivraison))).toBe(true);
  });

  it('LA RÈGLE : elle écrit la SORTIE de stock, avec de quoi remonter au bon', async () => {
    corps = { dateCreation: '2026-09-04', lignes: [LIGNE_STOCK] };
    await appeler('~~/server/api/bons-livraison/index.post');

    expect(
      mouvements(),
      'La déduction ne laissait AUCUNE trace : `mouvements_stock` ne portait que ' +
        'l’entrée « Annulation BL », un mouvement annulant quelque chose qui n’avait ' +
        'jamais été écrit. Le stock ne pouvait pas se rapprocher de son historique.',
    ).toEqual([
      { type: 'sortie', quantite: 10, stockId: POTS, origine: 'bon_livraison', reference: BON },
    ]);
  });

  it('une ligne LIBRE ne bouge aucun stock', async () => {
    corps = { dateCreation: '2026-09-04', lignes: [{ description: 'Palette', quantite: 2 }] };
    await appeler('~~/server/api/bons-livraison/index.post');
    expect(mouvements()).toEqual([]);
  });
});

describe('l’édition d’un bon de livraison', () => {
  beforeEach(() => {
    lignesEnBase[getTableName(bonsLivraison)] = [
      { statut: 'brouillon', numero: 'BL-2026-0007', lignes: [{ ...LIGNE_STOCK, total: 99 }] },
    ];
  });

  it('LA RÈGLE : corriger dix pots en deux REND huit au stock', async () => {
    /**
     * LE DÉFAUT PRINCIPAL, ET IL FAISAIT DISPARAÎTRE DE LA MARCHANDISE.
     * L'édition ne bougeait rien : les huit pots restaient déduits, et
     * l'annulation qui suivait n'en rendait que deux — la quantité alors
     * stockée. Huit pots évaporés, sans mouvement pour l'expliquer.
     */
    corps = { lignes: [{ ...LIGNE_STOCK, quantite: 2 }] };
    await appeler('~~/server/api/bons-livraison/[id].put');

    expect(mouvements()).toEqual([
      { type: 'entree', quantite: 8, stockId: POTS, origine: 'bon_livraison', reference: BON },
    ]);
  });

  it('LA RÈGLE : annuler rend TOUT', async () => {
    corps = { statut: 'annule' };
    await appeler('~~/server/api/bons-livraison/[id].put');
    expect(mouvements()).toEqual([
      { type: 'entree', quantite: 10, stockId: POTS, origine: 'bon_livraison', reference: BON },
    ]);
  });

  it('changer une NOTE ne touche pas au stock', async () => {
    // Un mouvement de zéro polluerait l'historique — et l'historique est
    // précisément ce que ce chantier répare.
    corps = { notes: 'Livré au portail' };
    await appeler('~~/server/api/bons-livraison/[id].put');
    expect(mouvements()).toEqual([]);
  });
});

describe('l’annulation puis la RÉ-OUVERTURE', () => {
  it('LA RÈGLE : ré-ouvrir un bon annulé redéduit le stock', async () => {
    /**
     * Le cas que personne n'avait vu. Le schéma d'édition accepte
     * `statut: 'brouillon'` sur un bon annulé ; le stock rendu à l'annulation
     * restait rendu, et la marchandise pouvait partir deux fois.
     */
    lignesEnBase[getTableName(bonsLivraison)] = [
      { statut: 'annule', numero: 'BL-2026-0007', lignes: [{ ...LIGNE_STOCK, total: 99 }] },
    ];
    corps = { statut: 'brouillon' };
    await appeler('~~/server/api/bons-livraison/[id].put');

    expect(mouvements()).toEqual([
      { type: 'sortie', quantite: 10, stockId: POTS, origine: 'bon_livraison', reference: BON },
    ]);
  });
});

describe('la suppression d’un bon', () => {
  it('LA RÈGLE : elle rend le stock, et le dit', async () => {
    lignesEnBase[getTableName(bonsLivraison)] = [
      { statut: 'brouillon', numero: 'BL-2026-0007', lignes: [{ ...LIGNE_STOCK, total: 99 }] },
    ];
    await appeler('~~/server/api/bons-livraison/[id].delete');
    expect(mouvements()).toEqual([
      { type: 'entree', quantite: 10, stockId: POTS, origine: 'bon_livraison', reference: BON },
    ]);
  });
});

describe('le cloisonnement entre exploitations', () => {
  it('toute écriture de stock porte l’identifiant du propriétaire', async () => {
    lignesEnBase[getTableName(bonsLivraison)] = [];
    corps = { dateCreation: '2026-09-04', lignes: [LIGNE_STOCK] };
    await appeler('~~/server/api/bons-livraison/index.post');

    const surStocks = updates.filter((u) => u.table === getTableName(stocks));
    expect(surStocks.length, 'le stock doit bien avoir été mis à jour').toBeGreaterThan(0);
    for (const u of surStocks) {
      expect(
        u.valeursOu,
        'sans `eq(stocks.userId, ownerId)`, un bon d’une exploitation bougerait le ' +
          'stock d’une autre : la RLS ne protège rien côté serveur.',
      ).toContain(OWNER);
      expect(u.valeursOu).not.toContain(AUTRE);
    }
  });
});
