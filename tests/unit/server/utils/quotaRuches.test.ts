import { describe, expect, it } from 'vitest';
import { assertQuotaRuches, consommeDuQuota } from '~~/server/utils/quotaRuches';
import { handleDivision } from '~~/server/services/interventions/division';
import { ruches, divisions, divisionsRuches } from '~~/server/database/schema';
import type { DrizzleTransaction, InterventionContext } from '~~/server/types/interventions';

/**
 * Régression : 03/08/2026, trois comptes du plan Découverte (plafond 1 ruche)
 * portaient 12, 35 et 80 ruches en production. Toutes créées en un seul INSERT,
 * `origine_essaim` NULL, 1 à 3 minutes après l'inscription, sans le moindre
 * essai (`trial_started_at` NULL, aucun abonnement Stripe).
 *
 * Cause : le middleware `04.subscription` ne teste que `current >= max`. Il
 * ignore COMBIEN de ruches la requête va créer, donc sur un compte neuf
 * (0 ruche, plafond 1) `0 >= 1` est faux et le lot passe entier.
 *
 * Ces bancs tiennent les deux portes de création de ruches : la route batch
 * `POST /api/ruches` et le handler `division` (atteignable par
 * `POST /api/interventions/bulk`, qui n'a AUCUN gate).
 */

type Ligne = Record<string, unknown>;

/** Maillon chaînable et « thenable » — imite juste ce que Drizzle expose ici. */
function maillon(resultat: Ligne[]) {
  const p: Record<string, unknown> = {};
  const self = () => p;
  Object.assign(p, {
    from: self,
    where: self,
    limit: self,
    values: self,
    returning: self,
    then: (ok: (v: Ligne[]) => unknown, ko?: (e: unknown) => unknown) =>
      Promise.resolve(resultat).then(ok, ko),
  });
  return p;
}

/** Exécuteur factice : sert les SELECT dans l'ordre, trace les tables insérées. */
function faireExecuteur(selects: Ligne[][]) {
  let i = 0;
  const inserees: unknown[] = [];
  return {
    tx: {
      select: () => maillon(selects[i++] ?? []),
      insert: (table: unknown) => {
        inserees.push(table);
        return maillon([{ id: `id-${inserees.length}` }]);
      },
    } as unknown as DrizzleTransaction,
    inserees,
  };
}

const compte = (n: number): Ligne[][] => [[{ count: n }]];

describe('assertQuotaRuches — plafond de ruches par plan', () => {
  it('REFUSE le lot de 80 ruches sur un compte Découverte neuf (le bug réel)', async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'decouverte', 80)).rejects.toMatchObject({
      statusCode: 402,
      data: { code: 'LIMIT_REACHED', limit: 'ruches', current: 0, max: 1 },
    });
  });

  it("laisse passer la 1re ruche d'un compte Découverte", async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'decouverte', 1)).resolves.toBeUndefined();
  });

  it("refuse la 2e ruche d'un compte Découverte", async () => {
    const { tx } = faireExecuteur(compte(1));
    await expect(assertQuotaRuches(tx, 'u-1', 'decouverte', 1)).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  // 20 ruches × 10 divisions via POST /api/interventions/bulk-group, sur un
  // Starter plafonné à 10 : la feature `interventionsGroupees` est vraie dès
  // Starter, donc seul ce compteur peut arrêter le lot.
  it('refuse 200 ruches sur un compte Starter (plafond 10)', async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'starter', 200)).rejects.toMatchObject({
      statusCode: 402,
      data: { max: 10 },
    });
  });

  it('compte le lot ENTIER, pas seulement la 1re unité', async () => {
    // 8 ruches + 3 à créer = 11 > 10 : c'est tout l'intérêt d'un contrôle
    // batch-aware. `current >= max` seul (8 >= 10 = faux) laisserait passer.
    const { tx } = faireExecuteur(compte(8));
    await expect(assertQuotaRuches(tx, 'u-1', 'starter', 3)).rejects.toMatchObject({
      statusCode: 402,
      data: { current: 8, max: 10 },
    });
  });

  it('propose le plan minimum réellement suffisant', async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'decouverte', 80)).rejects.toMatchObject({
      data: { requiredPlan: 'pro' },
    });
  });

  it('ne requête même pas la base quand le plan est illimité', async () => {
    let requetes = 0;
    const tx = {
      select: () => {
        requetes++;
        return maillon([{ count: 9999 }]);
      },
    } as unknown as DrizzleTransaction;
    await expect(assertQuotaRuches(tx, 'u-1', 'pro', 500)).resolves.toBeUndefined();
    expect(requetes).toBe(0);
  });

  // Convention des appelants : un admin est traité comme 'expert' (illimité).
  it('laisse passer un admin normalisé en expert', async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'expert', 2000)).resolves.toBeUndefined();
  });

  it('ignore un lot vide', async () => {
    const { tx } = faireExecuteur(compte(0));
    await expect(assertQuotaRuches(tx, 'u-1', 'decouverte', 0)).resolves.toBeUndefined();
  });
});

describe('consommeDuQuota — doit rester aligné sur le middleware', () => {
  it('exclut morte / vendue / fusionnee', () => {
    expect(consommeDuQuota('morte')).toBe(false);
    expect(consommeDuQuota('vendue')).toBe(false);
    expect(consommeDuQuota('fusionnee')).toBe(false);
  });

  it('compte les statuts vivants', () => {
    for (const s of ['active', 'faible', 'orpheline', 'essaimee']) {
      expect(consommeDuQuota(s)).toBe(true);
    }
  });
});

describe('handleDivision — le plafond est appliqué AVANT toute écriture', () => {
  const ctx = (
    plan: InterventionContext['plan'],
    nombreDivisions: number,
  ): InterventionContext => ({
    userId: 'u-1',
    inspectionId: 'i-1',
    rucheId: 'r-1',
    rucherId: 'rh-1',
    donnees: { nombreDivisions },
    plan,
  });

  it("refuse 10 divisions sur un compte Découverte et n'insère RIEN", async () => {
    const { tx, inserees } = faireExecuteur(compte(1));

    await expect(handleDivision(tx, ctx('decouverte', 10))).rejects.toMatchObject({
      statusCode: 402,
      data: { code: 'LIMIT_REACHED', limit: 'ruches' },
    });

    // La garde doit précéder l'INSERT de la division parent comme celui des
    // ruches filles : un rejet après écriture laisserait des orphelins.
    expect(inserees).toEqual([]);
  });

  it('crée bien les ruches filles quand le plan le permet', async () => {
    const { tx, inserees } = faireExecuteur([
      [{ count: 4 }], // garde de quota
      [{ rucherId: 'rh-1', type: 'dadant_10', userId: 'u-1' }], // ruche source
      [{ numero: '4' }], // numérotation existante
    ]);

    const res = await handleDivision(tx, ctx('starter', 2));

    expect(res.type).toBe('division');
    expect(inserees.filter((t) => t === ruches)).toHaveLength(2);
    expect(inserees.filter((t) => t === divisions)).toHaveLength(1);
    expect(inserees.filter((t) => t === divisionsRuches)).toHaveLength(2);
  });

  it('refuse le lot qui dépasse, même partiellement (4 + 8 > 10)', async () => {
    const { tx, inserees } = faireExecuteur(compte(4));
    await expect(handleDivision(tx, ctx('starter', 8))).rejects.toMatchObject({
      statusCode: 402,
    });
    expect(inserees).toEqual([]);
  });
});
