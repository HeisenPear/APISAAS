// ═══════════════════════════════════════════════════════════════════════════
// SUPPRIMER UNE FACTURE NE DOIT PAS FIGER LE BON QUI L'A PRODUITE.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Une chaîne de quatre maillons, tous corrects pris un à un :
//
//   1. `convertir.post.ts` pose `statut: 'facture'` sur le bon ;
//   2. la facture créée est un BROUILLON, sans numéro — c'est la règle, un
//      numéro se grave à l'émission pour ne pas trouer la séquence légale ;
//   3. `refusDeSuppression` autorise donc explicitement sa suppression :
//      « une vente qui n'a jamais été émise n'a rien troué » ;
//   4. `bons_livraison.transaction_id` est en `ON DELETE SET NULL`.
//
// Résultat : le bon restait « facturé » sans transaction. Or l'écran ne propose
// « Convertir » que sur un bon `livre`, ne permet de supprimer qu'un
// `brouillon`, et masque « Annuler » sur un `facture`. Plus facturable, plus
// annulable, plus supprimable — et la marchandise, elle, était bien partie. Le
// seul recours était un appel direct à l'API.
//
// C'est la forme la plus coûteuse de duplication décrite par CLAUDE.md : des
// gardes justes, posées chacune sans regarder l'autre, qui s'enferment
// mutuellement. Le dépôt l'a déjà payée entre le `DELETE` de facture et la
// numérotation des conversions.
//
// ─── CE QUE CE BANC TIENT ──────────────────────────────────────────────────
//   · les bons rattachés reviennent à « livré » et perdent leur lien ;
//   · l'écriture précède la suppression — après, la clé étrangère est nulle et
//     plus rien ne permet de les retrouver ;
//   · elle porte le prédicat de propriétaire, comme le contrôle qui la précède ;
//   · LE STOCK NE BOUGE PAS : `livre` et `facture` tiennent tous deux la
//     marchandise, la livraison a bien eu lieu.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer l'`update` des bons ;
//   · le placer APRÈS le `delete` ;
//   · lui retirer `eq(bonsLivraison.userId, ownerId)` ;
//   · remettre le bon à « brouillon » au lieu de « livré » (le stock mentirait).
// ═══════════════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { bonsLivraison, mouvementsStock, transactions } from '~~/server/database/schema';
import { valeursLiees } from '../../../helpers/fauxDb';

const OWNER = '00000000-0000-4000-8000-00000000000a';
const FACTURE = '44444444-4444-4444-8444-444444444444';

/** L'ordre des opérations, dans l'ordre où elles partent. */
let journal: Array<{ geste: 'update' | 'delete'; table: string }>;
let updates: Array<{ table: string; valeurs: Record<string, unknown>; valeursOu: string[] }>;
let inserts: Array<{ table: string }>;
let ligneEnBase: Record<string, unknown>;

function faireDb() {
  return {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [ligneEnBase] }) }),
    }),
    insert: (t: PgTable) => ({
      values: async (_v: unknown) => {
        inserts.push({ table: getTableName(t) });
        return [];
      },
    }),
    update: (t: PgTable) => ({
      set: (valeurs: Record<string, unknown>) => ({
        where: async (cond: unknown) => {
          journal.push({ geste: 'update', table: getTableName(t) });
          updates.push({
            table: getTableName(t),
            valeurs,
            valeursOu: valeursLiees(cond),
          });
          return [];
        },
      }),
    }),
    delete: (t: PgTable) => ({
      where: async () => {
        journal.push({ geste: 'delete', table: getTableName(t) });
        return [];
      },
    }),
  };
}

beforeEach(() => {
  journal = [];
  updates = [];
  inserts = [];
  // Une facture de VENTE, brouillon, SANS numéro : le cas exact que
  // `refusDeSuppression` autorise, et donc celui qui produisait le cul-de-sac.
  ligneEnBase = {
    id: FACTURE,
    type: 'vente',
    statut: 'brouillon',
    numero: null,
  };
  vi.resetModules();
  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    requireAuth: async () => ({ id: OWNER }),
    assertCanWrite: async () => ({ ownerId: OWNER }),
    getRouterParam: () => FACTURE,
    uuidSchema: { parse: (v: unknown) => v },
    notFound: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 404 });
    },
    badRequest: (m: string) => {
      throw Object.assign(new Error(m), { statusCode: 400 });
    },
    db: faireDb(),
  });
});

async function supprimerLaFacture() {
  const mod = await import('~~/server/api/finances/factures/[id].delete');
  return (mod.default as (e: unknown) => Promise<unknown>)({ context: {} });
}

describe('supprimer une facture issue d’un bon de livraison', () => {
  it('GARDE-FOU : la suppression a bien lieu', async () => {
    // Sans ce cas, une route qui refuserait tout rendrait les autres verts par
    // vacuité — le bon ne serait jamais figé, faute de suppression.
    await supprimerLaFacture();
    expect(
      journal.some((j) => j.geste === 'delete' && j.table === getTableName(transactions)),
    ).toBe(true);
  });

  it('LA RÈGLE : les bons rattachés redeviennent « livré », et se détachent', async () => {
    await supprimerLaFacture();
    const surLesBons = updates.find((u) => u.table === getTableName(bonsLivraison));

    expect(
      surLesBons,
      'Sans cette écriture, le bon reste « facturé » sans transaction : l’écran ne propose ' +
        'plus « Convertir » (il exige `livre`), ni « Supprimer » (il exige `brouillon`), ni ' +
        '« Annuler » (masqué sur `facture`). Le bon devient inatteignable.',
    ).toBeTruthy();
    expect(surLesBons!.valeurs.statut).toBe('livre');
    expect(surLesBons!.valeurs.transactionId).toBeNull();
  });

  it('LA RÈGLE : elle précède la suppression', async () => {
    /**
     * Après le `DELETE`, `bons_livraison.transaction_id` est remis à `null` par
     * la clé étrangère (`ON DELETE SET NULL`) : plus rien ne permet de
     * retrouver les bons concernés. L'ordre n'est donc pas un détail de style.
     */
    await supprimerLaFacture();
    const rangUpdate = journal.findIndex(
      (j) => j.geste === 'update' && j.table === getTableName(bonsLivraison),
    );
    const rangDelete = journal.findIndex((j) => j.geste === 'delete');
    expect(rangUpdate).toBeGreaterThanOrEqual(0);
    expect(
      rangUpdate,
      'placée après le DELETE, cette écriture ne trouverait plus aucun bon à réparer',
    ).toBeLessThan(rangDelete);
  });

  it('LA RÈGLE : elle porte le prédicat de propriétaire', async () => {
    // La RLS ne protège rien côté serveur — `db.ts` ouvre une connexion
    // service-role qui la contourne. Le contrôle et l'écriture doivent être le
    // MÊME ordre SQL ; le dépôt a payé cette leçon sur `membres/accepter`.
    await supprimerLaFacture();
    const surLesBons = updates.find((u) => u.table === getTableName(bonsLivraison))!;
    expect(surLesBons.valeursOu).toContain(OWNER);
  });

  it('LE STOCK NE BOUGE PAS — la livraison a bien eu lieu', async () => {
    /**
     * `livre` et `facture` tiennent tous deux la marchandise
     * (`STATUTS_QUI_TIENNENT_LE_STOCK`). Rendre le stock ici recréerait de la
     * marchandise qui est physiquement partie — et remettre le bon en
     * « brouillon » plutôt qu'en « livré » aurait le même effet le jour où la
     * politique de déduction basculera à la livraison.
     */
    await supprimerLaFacture();
    expect(inserts.some((i) => i.table === getTableName(mouvementsStock))).toBe(false);
    expect(updates.some((u) => u.table === 'stocks')).toBe(false);
  });
});
