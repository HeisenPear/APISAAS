import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { valeursLiees } from '../../../helpers/fauxDb';

// ═══════════════════════════════════════════════════════════════════════════
// TROIS CHARGES DUES LE MÊME JOUR PORTAIENT LE MÊME NUMÉRO D'ACHAT.
//
// Le cron des achats récurrents calculait le numéro DANS `processAchat` — et
// `processAchat` tourne par lots de dix EN PARALLÈLE (`processInBatches`). Les
// dix lectures du « dernier numéro » partaient donc avant que la première
// insertion n'ait eu lieu : toutes lisaient le même dernier numéro, toutes
// calculaient le même suivant.
//
// ⚠️ CE N'EST PAS UNE COURSE RARE ENTRE DEUX CLICS. C'est déterministe, et ça
// se produit tous les mois : les charges mensuelles d'un apiculteur sont
// naturellement ancrées au même jour — assurance, sucre, expert-comptable,
// abonnements — donc elles échoient ENSEMBLE.
//
// ─── POURQUOI UN BANC DE COMPORTEMENT, ET PAS UNE RÈGLE DE SOURCE ─────────
// Une règle qui lirait le fichier (« le numéro ne se calcule pas dans la
// boucle ») serait vraie et inutile : elle ne dit rien de ce qui sort. Ici on
// FAIT TOURNER le cron sur un double de base et on regarde les numéros
// réellement écrits. Le double rend la lecture AU MOMENT OÙ ELLE PART — c'est
// ce qui reproduit la concurrence : si le code lit dix fois avant d'écrire une
// fois, il obtient dix fois la même réponse, exactement comme en production.
//
// Vu ROUGE par mutation : en remettant le calcul du numéro dans `processAchat`,
// les trois achats ressortent avec « AC-2026-0043 ».
// ═══════════════════════════════════════════════════════════════════════════

/** L'état de la base pendant un tour de cron. */
interface Etat {
  transactions: Record<string, unknown>[];
  mouvements: Record<string, unknown>[];
  majStocks: Record<string, unknown>[];
}
let etat: Etat;
/** Ce que rend la requête « achats récurrents dus ». */
let dus: Record<string, unknown>[];
let compteur: number;

vi.mock('~~/server/utils/cron-helpers', async (importOriginal) => {
  // ⚠️ ON GARDE LE VRAI `processInBatches`. C'est LUI qui parallélise, donc
  // lui qui porte le défaut : le remplacer par une boucle séquentielle ferait
  // passer ce banc au vert sur du code cassé — le faux vert le plus classique.
  const reel = await importOriginal<typeof import('~~/server/utils/cron-helpers')>();
  return { ...reel, assertCronAuth: () => {} };
});

/** Le tri de `ordreNumeroDecroissant` : longueur d'abord, lexical ensuite. */
function parNumeroDecroissant(a: string, b: string): number {
  return a.length !== b.length ? b.length - a.length : b.localeCompare(a);
}

function poserLaBase() {
  Object.assign(globalThis, {
    defineEventHandler: (fn: unknown) => fn,
    db: {
      select: () => ({
        from: (_table: unknown) => ({
          where: (cond: unknown) => {
            /**
             * ⚠️ LE SNAPSHOT SE PREND ICI, À L'APPEL. Une requête part quand
             * elle part : ce qu'elle rendra ne dépend pas de ce qui sera
             * inséré plus tard. C'est cette fidélité-là qui rend la course
             * visible — un double qui résoudrait paresseusement, après les
             * insertions, effacerait le défaut qu'on mesure.
             */
            const proprietaires = valeursLiees(cond);
            const sequence = etat.transactions
              .filter((t) => proprietaires.includes(String(t.userId)) && t.numero)
              .map((t) => String(t.numero))
              .sort(parNumeroDecroissant)
              .slice(0, 1)
              .map((numero) => ({ numero }));
            const echues = dus.slice();
            return Object.assign(Promise.resolve(echues), {
              orderBy: () => ({ limit: () => Promise.resolve(sequence) }),
            });
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: (v: unknown) => {
          const nom = getTableName(table as PgTable);
          const lignes = (Array.isArray(v) ? v : [v]) as Record<string, unknown>[];
          const avecId = lignes.map((l) => ({ id: `nouveau-${++compteur}`, ...l }));
          if (nom === 'transactions') etat.transactions.push(...avecId);
          else etat.mouvements.push(...avecId);
          return Object.assign(Promise.resolve(avecId), {
            returning: () => Promise.resolve(avecId),
          });
        },
      }),
      update: () => ({
        set: (valeurs: Record<string, unknown>) => ({
          where: () => {
            etat.majStocks.push(valeurs);
            return Promise.resolve();
          },
        }),
      }),
    },
  });
}

/** Une charge récurrente due aujourd'hui. */
function charge(
  id: string,
  userId: string,
  options: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id,
    userId,
    type: 'achat',
    numero: null,
    dateTransaction: new Date('2026-01-15T00:00:00Z'),
    statut: 'payee',
    sousTotal: '100.00',
    tva: '20.00',
    total: '120.00',
    lignes: [],
    notes: null,
    categorie: 'consommables',
    isRecurring: true,
    recurringInterval: 'mensuel',
    nextRecurringDate: new Date('2026-06-15T00:00:00Z'),
    createdAt: new Date('2026-01-15T00:00:00Z'),
    ...options,
  };
}

/** Un achat déjà numéroté, en base — le point de départ de la séquence. */
function dejaEnBase(userId: string, numero: string): Record<string, unknown> {
  return { id: `ancien-${numero}`, userId, type: 'achat', numero };
}

async function lancerLeCron(): Promise<{ created: number; checked: number }> {
  vi.resetModules();
  poserLaBase();
  const module = await import('~~/server/crons/achats-recurrents');
  const handler = module.default as unknown as (event: unknown) => Promise<{
    created: number;
    checked: number;
  }>;
  return handler({});
}

/** Les numéros écrits par le tour de cron, dans l'ordre d'insertion. */
function numerosCrees(): string[] {
  return etat.transactions
    .filter((t) => String(t.id).startsWith('nouveau-'))
    .map((t) => String(t.numero));
}

beforeEach(() => {
  etat = { transactions: [], mouvements: [], majStocks: [] };
  dus = [];
  compteur = 0;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T01:00:00Z')); // l'heure réelle du cron
});

afterEach(() => {
  vi.useRealTimers();
});

// ════════════════════════════════════════════════════════════════════════════
// UNE OCCURRENCE N'EST PAS UN GABARIT
//
// ⚠️ LA CHARGE DOUBLAIT À CHAQUE ÉCHÉANCE, ET CE BANC NE POUVAIT PAS LE VOIR.
//
// La copie générée était insérée `isRecurring: true` avec son propre
// `nextRecurringDate`, pendant que l'origine voyait la sienne avancée. Or le
// balayage du cron ne filtre que sur `type='achat' AND is_recurring AND
// next_recurring_date <= now` : rien ne distingue une charge MÈRE d'une
// occurrence GÉNÉRÉE. Le nombre de lignes récurrentes doublait donc à chaque
// passage — 1, 2, 4, 8… 2 048 le même jour au bout d'un an, pour une seule
// assurance. Avec autant de mouvements de stock, un résultat et une TVA
// déductible multipliés par 2ⁿ, et un prévisionnel de trésorerie à l'avenant.
//
// ⚠️ POURQUOI CE BANC ÉTAIT AVEUGLE : il posait `dus` à la main, comme une
// fixture, et ne rejouait JAMAIS le cron sur ce que le tour précédent avait
// ÉCRIT. « La couverture qui s'arrête juste avant », appliquée au temps.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Ce que la requête du cron ramènerait au tour SUIVANT : les lignes en base
 * qui sont récurrentes et échues. C'est la vraie condition du handler,
 * recopiée nulle part — on la relit ici parce que c'est elle qui décide.
 */
function echuesApresLeTour(maintenant: Date): Record<string, unknown>[] {
  return etat.transactions.filter(
    (t) =>
      t.type === 'achat' &&
      t.isRecurring === true &&
      t.nextRecurringDate instanceof Date &&
      (t.nextRecurringDate as Date) <= maintenant,
  );
}

describe('la charge récurrente ne se duplique pas d’un mois sur l’autre', () => {
  it('garde-fou : le premier tour crée bien UN achat', async () => {
    // Sans lui, un cron qui ne ferait rien satisferait le cas suivant.
    dus = [charge('c1', 'u1')];
    const r = await lancerLeCron();
    expect(r.created).toBe(1);
  });

  it('DEUX échéances de suite donnent DEUX achats, pas trois', async () => {
    /**
     * Le second tour part de ce que le premier a réellement écrit — c'est
     * toute la différence avec une fixture posée à la main.
     */
    dus = [charge('c1', 'u1')];
    await lancerLeCron();

    // Un mois plus tard : le cron rebalaye la base.
    vi.setSystemTime(new Date('2026-07-15T01:00:00Z'));
    dus = echuesApresLeTour(new Date('2026-07-15T01:00:00Z'));
    expect(dus.length, 'la copie générée ne doit pas ressortir comme une charge à échoir').toBe(0);
  });

  it('la ligne CRÉÉE n’est pas elle-même récurrente', async () => {
    dus = [charge('c1', 'u1')];
    await lancerLeCron();
    const creee = etat.transactions.find((t) => String(t.id).startsWith('nouveau-'))!;

    expect(creee.isRecurring, 'une dépense CONSTATÉE n’est pas un gabarit').toBe(false);
    expect(creee.recurringInterval, 'et elle ne porte aucun calendrier').toBeNull();
    expect(creee.nextRecurringDate).toBeNull();
  });

  it('l’ORIGINE, elle, garde sa récurrence et voit son échéance avancer', async () => {
    /**
     * Le contre-test : sans lui, couper la récurrence des DEUX lignes
     * satisferait les cas précédents en supprimant la charge récurrente de
     * l'apiculteur — elle ne se représenterait jamais.
     */
    dus = [charge('c1', 'u1')];
    await lancerLeCron();
    const avancees = etat.majStocks.filter((v) => 'nextRecurringDate' in v);
    expect(
      avancees.length,
      'l’origine doit voir son échéance reportée, sinon la charge disparaît',
    ).toBeGreaterThan(0);
    expect(avancees[0]!.nextRecurringDate).toBeInstanceOf(Date);
  });
});

describe('le cron des achats récurrents numérote sans doublon', () => {
  it('une charge seule est bien créée (garde-fou)', async () => {
    /**
     * Sans ce cas, tout ce qui suit pourrait passer au vert sur un cron qui ne
     * fait RIEN — un double mal branché, un handler qui sort en tête. On vérifie
     * d'abord que le harnais atteint vraiment le code.
     */
    etat.transactions.push(dejaEnBase('apiculteur-1', 'AC-2026-0042'));
    dus = [charge('a', 'apiculteur-1')];

    const bilan = await lancerLeCron();

    expect(bilan.created, 'le cron n’a rien créé : le harnais n’atteint pas le code').toBe(1);
    expect(numerosCrees()).toEqual(['AC-2026-0043']);
  });

  it('TROIS charges dues le même jour reçoivent TROIS numéros distincts', async () => {
    /**
     * LE DÉFAUT, EN UNE ASSERTION. Avant correction, les trois sortaient à
     * « AC-2026-0043 » : trois lignes du journal des achats portant la même
     * référence, tous les mois, chez tous les apiculteurs ayant plus d'une
     * charge mensuelle.
     */
    etat.transactions.push(dejaEnBase('apiculteur-1', 'AC-2026-0042'));
    dus = [
      charge('assurance', 'apiculteur-1'),
      charge('sucre', 'apiculteur-1'),
      charge('comptable', 'apiculteur-1'),
    ];

    await lancerLeCron();

    const numeros = numerosCrees();
    expect(numeros.length, 'les trois charges doivent produire trois achats').toBe(3);
    expect(
      new Set(numeros).size,
      `numéros attribués : ${numeros.join(', ')} — deux achats portant la même ` +
        'référence rendent le journal et les mouvements de stock illisibles',
    ).toBe(3);
    expect([...numeros].sort()).toEqual(['AC-2026-0043', 'AC-2026-0044', 'AC-2026-0045']);
  });

  it('chaque apiculteur repart de SA propre séquence', async () => {
    /**
     * La parade au défaut inverse : un compteur global attribuerait des
     * numéros uniques… en les prenant chez le voisin. La séquence d'achats est
     * par exploitation, et deux exploitations n'ont jamais à se croiser.
     */
    etat.transactions.push(
      dejaEnBase('apiculteur-1', 'AC-2026-0007'),
      dejaEnBase('apiculteur-2', 'AC-2026-0100'),
    );
    dus = [
      charge('a', 'apiculteur-1'),
      charge('b', 'apiculteur-2'),
      charge('c', 'apiculteur-1'),
      charge('d', 'apiculteur-2'),
    ];

    await lancerLeCron();

    const parApiculteur = (userId: string) =>
      etat.transactions
        .filter((t) => String(t.id).startsWith('nouveau-') && t.userId === userId)
        .map((t) => String(t.numero))
        .sort();
    expect(parApiculteur('apiculteur-1')).toEqual(['AC-2026-0008', 'AC-2026-0009']);
    expect(parApiculteur('apiculteur-2')).toEqual(['AC-2026-0101', 'AC-2026-0102']);
  });

  it('les mouvements de stock citent des références distinctes', async () => {
    /**
     * C'est là que le doublon se VOIT : chaque ligne d'achat marquée « ajouter
     * au stock » écrit un mouvement dont le motif est la référence de l'achat.
     * Avec le même numéro partout, l'apiculteur ne peut plus dire quelle entrée
     * de stock vient de quelle facture fournisseur.
     */
    etat.transactions.push(dejaEnBase('apiculteur-1', 'AC-2026-0042'));
    const ligneStock = [
      {
        description: 'Sucre',
        quantite: 10,
        prixUnitaire: 1,
        total: 10,
        ajouterAuStock: true,
        stockId: 'stock-1',
      },
    ];
    dus = [
      charge('sucre', 'apiculteur-1', { lignes: ligneStock }),
      charge('sucre-bis', 'apiculteur-1', { lignes: ligneStock }),
    ];

    await lancerLeCron();

    const motifs = etat.mouvements.map((m) => String(m.motif));
    expect(motifs.length, 'aucun mouvement de stock écrit : le cas ne mesure rien').toBe(2);
    expect(new Set(motifs).size, `motifs : ${motifs.join(' | ')}`).toBe(2);
  });

  it('une échéance sans intervalle ne consomme pas de numéro', async () => {
    /**
     * Elle ne produira aucun achat (le garde de `processAchat` la refuse) :
     * si elle recevait quand même un numéro, la séquence sauterait un cran à
     * chaque tour. Un trou n'est pas un doublon, mais c'est la même famille —
     * une séquence à laquelle on ne peut plus se fier.
     */
    etat.transactions.push(dejaEnBase('apiculteur-1', 'AC-2026-0042'));
    dus = [
      charge('cassee', 'apiculteur-1', { recurringInterval: null }),
      charge('bonne', 'apiculteur-1'),
    ];

    await lancerLeCron();

    expect(numerosCrees()).toEqual(['AC-2026-0043']);
  });

  it('le millésime est celui de PARIS, pas celui du serveur', async () => {
    /**
     * ⚠️ Le cron tourne à 1 h UTC. Un jour de l'an, ce n'est pas la même année
     * des deux côtés de la frontière : `new Date().getFullYear()` répondait
     * dans le fuseau de la lambda. On place l'horloge à 00 h 30 à Paris le
     * 1er janvier — 23 h 30 la veille pour le serveur.
     */
    vi.setSystemTime(new Date('2026-12-31T23:30:00Z'));
    etat.transactions.push(dejaEnBase('apiculteur-1', 'AC-2026-0042'));
    dus = [charge('a', 'apiculteur-1')];

    await lancerLeCron();

    expect(numerosCrees(), 'le serveur, lui, dit encore 2026').toEqual(['AC-2027-0001']);
  });
});
