// ═══════════════════════════════════════════════════════════════════════════
// INVARIANTS SUR DONNÉES RÉELLES — lecture seule, aucune écriture.
//
// Ces bancs n'écrivent RIEN. Ils sont donc sûrs contre n'importe quelle base,
// production comprise, et c'est précisément leur intérêt : ils vérifient sur
// les VRAIES données ce que les bancs unitaires ne vérifient que sur des cas
// fabriqués.
//
// C'est cette catégorie qui aurait vu l'incident du 3 août : trois comptes
// Découverte portant 12, 35 et 80 colonies. Aucun test unitaire ne pouvait le
// voir — la règle était juste, c'est la RÉALITÉ qui la contredisait.
//
// Un invariant rouge ici n'est pas forcément un bug de code : c'est parfois de
// la donnée héritée d'un défaut déjà corrigé. Le message doit donc dire quoi
// regarder, pas seulement « échec ».
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { baseDeTest, baseDisponible, decrireCible } from './harnais';
import { PLAN_CONFIGS, type Plan } from '~/config/plans';

const siBase = baseDisponible() ? describe : describe.skip;

siBase('invariants du cheptel', () => {
  it(`aucun compte ne dépasse le plafond de ruches de son plan (${decrireCible()})`, async () => {
    const db = baseDeTest();

    // Mêmes statuts hors quota que `quotaRuches.ts` et que le compteur du
    // middleware. Une liste qui divergerait ici rendrait le banc inutile.
    const lignes = await db.execute<{ plan: Plan; user_id: string; ruches: number }>(sql`
      SELECT p.plan, p.id AS user_id, count(r.id)::int AS ruches
      FROM profils p
      JOIN ruches r ON r.user_id = p.id
      WHERE r.statut NOT IN ('morte', 'vendue', 'fusionnee')
      GROUP BY p.plan, p.id
    `);

    const depassements = [...lignes].filter((l) => {
      const max = PLAN_CONFIGS[l.plan]?.limits.ruches;
      return max != null && max !== Infinity && l.ruches > max;
    });

    // On nomme les comptes : un échec doit être actionnable tout de suite.
    const detail = depassements
      .map((d) => `${d.user_id} — plan ${d.plan}, ${d.ruches} ruches`)
      .join('\n  ');

    expect(
      depassements,
      depassements.length
        ? `Comptes au-dessus de leur plafond :\n  ${detail}\n` +
            'Le verrou de cheptel les rend inaccessibles sans les supprimer — ' +
            'vérifier si ce sont des comptes rétrogradés (normal) ou une porte ouverte (bug).'
        : '',
    ).toHaveLength(0);
  });

  it('aucune ruche ne référence un rucher qui n’existe plus', async () => {
    const db = baseDeTest();
    const orphelines = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n
      FROM ruches r
      LEFT JOIN ruchers x ON x.id = r.rucher_id
      WHERE r.rucher_id IS NOT NULL AND x.id IS NULL
    `);
    expect([...orphelines][0]?.n ?? 0).toBe(0);
  });

  it('une ruche et son rucher appartiennent au même compte', async () => {
    // Le cloisonnement par locataire ne tient que si les liens le respectent :
    // une ruche rattachée au rucher d'un autre compte serait une fuite entre
    // exploitations, que les politiques RLS ne rattraperaient pas.
    const db = baseDeTest();
    const melanges = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n
      FROM ruches r
      JOIN ruchers x ON x.id = r.rucher_id
      WHERE r.user_id <> x.user_id
    `);
    expect([...melanges][0]?.n ?? 0).toBe(0);
  });
});

siBase('invariants des visites', () => {
  it('aucune visite dictée ne reste privée de ses colonnes plates', async () => {
    // Le défaut corrigé : Maya écrivait le JSONB en camelCase et laissait les
    // colonnes plates nulles, alors que le score de santé les lit. Ce banc est
    // le CONSTAT de `rattrapage-controles-maya.sql`, sous forme de test : tant
    // qu'il est rouge, le rattrapage n'a pas été joué.
    const db = baseDeTest();
    const restants = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n
      FROM interventions
      WHERE donnees IS NOT NULL
        AND jsonb_typeof(donnees -> 'forceColonie') = 'number'
        AND force_colonie IS NULL
    `);
    const n = [...restants][0]?.n ?? 0;
    expect(
      n,
      n
        ? `${n} visite(s) dictée(s) sans colonnes plates. Jouer ` +
            'server/database/rattrapage-controles-maya.sql (section CONSTAT d’abord).'
        : '',
    ).toBe(0);
  });
});

siBase('invariants de la traçabilité', () => {
  it('un numéro de lot est unique par compte', async () => {
    const db = baseDeTest();
    const doublons = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM (
        SELECT user_id, numero_lot
        FROM conditionnements
        GROUP BY user_id, numero_lot
        HAVING count(*) > 1
      ) d
    `);
    expect([...doublons][0]?.n ?? 0).toBe(0);
  });
});

siBase('invariants du harnais lui-même', () => {
  it('aucun compte de harnais ne traîne d’une campagne précédente', async () => {
    // Un compte oublié fausserait les invariants ci-dessus — « un Découverte
    // avec 40 ruches » qui serait le nôtre. Le harnais nettoie en `finally`,
    // mais un processus tué n'exécute pas de `finally`.
    const db = baseDeTest();
    const restes = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM profils WHERE email LIKE 'harnais+%@example.invalid'
    `);
    const n = [...restes][0]?.n ?? 0;
    expect(
      n,
      n ? `${n} compte(s) de harnais orphelin(s) — appeler balayerComptesOrphelins().` : '',
    ).toBe(0);
  });
});
