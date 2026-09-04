// ═══════════════════════════════════════════════════════════════════════════
// LA REQUÊTE DE LA CARTE — vérifiée EN SQL, parce que rien d'autre ne la voit.
//
// ─── POURQUOI CE BANC EXISTE ───────────────────────────────────────────────
// La péremption d'un signalement de frelon se joue dans le `where` de
// `GET /api/frelon`. Une requête Drizzle mal formée ne se voit ni au
// `typecheck` (le `sql` template accepte n'importe quel texte) ni aux bancs
// d'unité (ils doublent la base). Elle échoue à l'exécution, en production,
// devant un apiculteur — et sur une carte, l'échec le plus probable n'est même
// pas une erreur : c'est une carte VIDE, ou une carte qui n'oublie rien.
//
// Trois pièges concrets, tous présents dans cette requête :
//
//   · `votes_frelon` est DÉJÀ jointe (pour rendre `monVote`). Une sous-requête
//     corrélée sans ALIAS viserait la ligne jointe — donc le vote de
//     l'utilisateur courant — au lieu de toutes les confirmations ;
//   · l'intervalle de péremption doit être un PARAMÈTRE. Interpolé en texte,
//     il échapperait à toute vérification et se figerait dans la requête ;
//   · le filtre doit s'appliquer EN BASE. Filtrer après coup en JavaScript
//     laisserait le `limit(2000)` remplir la page de nids morts, et la carte
//     perdrait des signalements vivants sans que rien ne le signale.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · retirer l'alias de la sous-requête ;
//   · remplacer `make_interval(days => …)` par une interpolation de texte ;
//   · retirer le filtre de péremption du `where`.
// ═══════════════════════════════════════════════════════════════════════════

import { beforeAll, describe, expect, it } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { readFileSync } from 'node:fs';
import { PEREMPTION_JOURS } from '~~/app/utils/frelonFiabilite';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

/**
 * ON N'INVENTE PAS LA REQUÊTE : ON APPELLE CELLE DE LA ROUTE.
 *
 * ⚠️ UNE COPIE MESURERAIT SA PROPRE EXACTITUDE. La route exporte donc son
 * constructeur, et `toSQL()` en rend le texte sans se connecter à rien.
 * `db` est un auto-import Nitro : sous Vitest il faut le poser, et il suffit
 * qu'il sache construire (aucune requête ne part).
 */
Object.assign(globalThis, {
  db: drizzle({} as never, { dialect: new PgDialect() } as never),
  // La route appelle `defineEventHandler` dès son chargement : c'est un
  // auto-import Nitro, absent sous Vitest.
  defineEventHandler: (fn: unknown) => fn,
  requireAuth: async () => ({ id: 'u1' }),
});

const ROUTE = sansCommentaires(readFileSync('server/api/frelon/index.get.ts', 'utf8'));

/**
 * L'import est DYNAMIQUE : un `import` statique est hissé au-dessus de toute
 * instruction, donc au-dessus du dépôt des auto-imports ci-dessus — la route
 * exploserait au chargement sur `defineEventHandler is not defined`.
 */
let texte = '';
let params: unknown[] = [];

beforeAll(async () => {
  const mod = (await import('~~/server/api/frelon/index.get')) as unknown as {
    requeteCarteFrelon: (u: string) => { toSQL: () => { sql: string; params: unknown[] } };
  };
  const rendu = mod.requeteCarteFrelon('00000000-0000-0000-0000-000000000001').toSQL();
  texte = rendu.sql;
  params = rendu.params;
});

describe('la requête de la carte tient debout en SQL', () => {
  it('GARDE-FOU : le rendu produit bien du SQL', () => {
    // Sans lui, un `toSQL()` qui rendrait une chaîne vide validerait toutes les
    // règles suivantes — « le balayage vide » de CLAUDE.md.
    expect(texte.length).toBeGreaterThan(200);
    expect(texte).toContain('from "signalements_frelon"');
  });

  it('la sous-requête porte un ALIAS distinct de la jointure', () => {
    // Sans alias, `votes_frelon` désignerait la ligne JOINTE — le vote de
    // l'utilisateur courant — et le « dernier signe de vie » deviendrait
    // « la date de MON vote », ce qui est une tout autre information.
    expect(texte).toContain('"signe"');
    // ⚠️ LA TABLE **ET** L'ALIAS. Le premier jet écrivait `from ${vote}`, ce
    // que Drizzle rendait `from "signe"` — l'alias tout seul, sans la table.
    // `relation "signe" does not exist` à la première ouverture de la carte, et
    // rien pour le voir avant l'apiculteur : ni le typecheck (un gabarit `sql`
    // accepte n'importe quel texte), ni les bancs d'unité (ils doublent la
    // base). C'est ce cas-ci qui l'a attrapé.
    expect(texte).toMatch(/from "votes_frelon"\s+(as\s+)?"signe"/);
    expect(texte, "l'alias seul ne désigne aucune table").not.toMatch(/from\s+"signe"/);
    // La corrélation vise bien le signalement de la ligne courante.
    expect(texte).toMatch(/"signe"\."signalement_id" = "signalements_frelon"\."id"/);
  });

  it('le seuil de péremption est un PARAMÈTRE, pas du texte interpolé', () => {
    expect(params, 'le nombre de jours doit être lié, pas écrit dans la requête').toContain(
      PEREMPTION_JOURS,
    );
    expect(texte).toContain('make_interval(days =>');
    expect(texte, 'aucun intervalle figé en dur').not.toMatch(/interval\s+'\d+ days'/);
  });

  it('le filtre de péremption est DANS le where, avant la limite', () => {
    const whereIdx = texte.indexOf('where');
    const intervalIdx = texte.indexOf('make_interval');
    const limitIdx = texte.lastIndexOf('limit');
    expect(whereIdx).toBeGreaterThan(-1);
    expect(intervalIdx, 'la péremption doit filtrer en base').toBeGreaterThan(whereIdx);
    expect(intervalIdx, 'et avant que la limite ne tronque').toBeLessThan(limitIdx);
  });

  it('les rejetés restent exclus — la règle d’origine survit', () => {
    expect(texte).toMatch(/"statut" <> /);
  });
});

describe('la route elle-même porte bien cette requête', () => {
  it('GARDE-FOU : le balayage lit bien la route', () => {
    expect(ROUTE).toContain('signalementsFrelon');
    expect(ROUTE.length).toBeGreaterThan(500);
  });

  it('elle alias la sous-requête et paramètre l’intervalle', () => {
    // Le double ci-dessus ne prouve rien si la route, elle, fait autre chose.
    expect(ROUTE, 'la sous-requête doit être aliasée').toMatch(/alias\(\s*votesFrelon\s*,/);
    expect(ROUTE, 'l’intervalle doit être paramétré').toContain('make_interval(days =>');
    expect(ROUTE, 'le seuil vient de la règle partagée').toContain('PEREMPTION_JOURS');
  });

  it('elle renvoie le dernier signe de vie au client', () => {
    // Sans cette date, l'écran ne peut pas dire « sans nouvelles depuis deux
    // mois » — donc l'apiculteur ne voit pas venir la disparition et n'a aucune
    // raison de confirmer le nid qu'il croise pourtant chaque semaine.
    expect(ROUTE).toMatch(/dernierSigneDeVie:/);
  });
});
