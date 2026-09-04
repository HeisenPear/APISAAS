// ═══════════════════════════════════════════════════════════════════════════
// UNE CLÉ ÉTRANGÈRE QUI VIENT DU CLIENT DOIT APPARTENIR À CELUI QUI L'ENVOIE.
//
// Zod garantit qu'un `rucherId` est un UUID. Il ne dit rien de À QUI il est.
// Une route qui le range tel quel écrit une ligne portant `userId: ownerId` —
// donc conforme au RLS — mais dont la clé étrangère pointe chez quelqu'un
// d'autre. Deux dégâts, sans jamais franchir une barrière de lecture :
//
//   · une lecture jointe par rucher fait apparaître la ligne là où elle n'a
//     rien à faire, ou fait entrer chez soi le nom d'un rucher voisin ;
//   · l'insertion réussit ou échoue selon que l'UUID existe : c'est un oracle
//     d'énumération, gratuit et silencieux.
//
// Cinq routes le faisaient, et la raison pour laquelle personne ne les voyait
// est instructive : LA RÈGLE EST ÉCRITE DE CINQ FAÇONS. Certaines appellent
// `assertFkBelongsToOwner`, d'autres écrivent leur `select … where and(eq(id),
// eq(userId))` à la main, d'autres encore filtrent en `inArray`. Aucun
// balayage textuel ne pouvait les reconnaître toutes — sauf par ce qu'elles
// ont FORCÉMENT en commun : elles nomment la colonne `<table>.userId`.
//
//   · `interventions/rdv-pro.post.ts`        — rucherId, aucune vérification
//   · `declarations/napi.post.ts`            — les rucherId de la déclaration
//     légale transmise à l'administration
//   · `elevage/sessions/index.post.ts` + `[id].put.ts` — la reine MÈRE, celle
//     dont `genealogieReines.ts` tire l'arbre de filiation
//   · `finances/factures/[id].put.ts`        — le stockId d'une ligne, alors
//     que sa jumelle `ventes.post.ts` le vérifiait
//
// ⚠️ LA CARTE COLONNE → TABLE EST DÉRIVÉE DU SCHÉMA, JAMAIS ÉCRITE ICI. Une
// clé étrangère ajoutée demain est mesurée le jour même ; une liste recopiée
// aurait laissé passer la suivante, ce qui est exactement le défaut que ce
// banc existe pour empêcher.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCHEMA = 'server/database/schema.ts';
const RACINE_API = 'server/api';

/** Colonne de clé étrangère → table(s) référencée(s), lues dans le schéma Drizzle. */
function carteDesClesEtrangeres(): Map<string, Set<string>> {
  const src = readFileSync(SCHEMA, 'utf-8');
  const carte = new Map<string, Set<string>>();
  const re = /(\w+):\s*uuid\('[^']+'\)[\s\S]{0,80}?\.references\(\(\)\s*=>\s*(\w+)\.id/g;
  for (const m of src.matchAll(re)) {
    const [, colonne, table] = m;
    if (!colonne || !table) continue;
    if (!carte.has(colonne)) carte.set(colonne, new Set());
    carte.get(colonne)!.add(table);
  }
  return carte;
}

/**
 * Les tables POSSÉDÉES : celles qui portent une colonne `userId`.
 *
 * ⚠️ C'EST LA DISPENSE, ET ELLE EST DÉRIVÉE PLUTÔT QU'ÉCRITE. Une table de
 * RÉFÉRENTIEL — le catalogue des floraisons, par exemple — est la même pour
 * tout le monde : elle n'a pas de propriétaire, donc rien à vérifier. Lister
 * ces tables à la main aurait dispensé, au premier oubli, une table qui, elle,
 * a un propriétaire. On demande au schéma.
 */
function tablesPossedees(): Set<string> {
  const src = readFileSync(SCHEMA, 'utf-8');
  /**
   * ⚠️ LE DÉCOUPAGE EST DÉLIMITÉ PAR LA DÉCLARATION SUIVANTE, PAS PAR LA
   * PREMIÈRE PARENTHÈSE FERMANTE — et cette nuance a failli coûter la règle
   * entière.
   *
   * Une première version lisait `pgTable\(([\s\S]*?)\n\);` : le motif étant
   * non gourmand, il s'arrêtait au premier `\n);` rencontré, c'est-à-dire au
   * milieu des tables qui déclarent un bloc d'index. Vingt-deux tables sur
   * soixante-deux étaient donc lues comme SANS colonne `userId`, donc
   * réputées « référentielles », donc dispensées — dont `reinesElevage`, qui
   * est tout sauf un référentiel.
   *
   * Vu à la mutation, et pas autrement : retirer un garde réel laissait le
   * banc VERT. Une dispense plus large que son motif, la forme de faux vert
   * que ce dépôt connaît le mieux.
   */
  const debuts = [...src.matchAll(/export const (\w+) = pgTable\(/g)];
  const separateurs = [...src.matchAll(/^export const /gm)].map((m) => m.index!);
  const out = new Set<string>();
  for (const m of debuts) {
    const debut = m.index!;
    const fin = separateurs.find((s) => s > debut) ?? src.length;
    if (m[1] && /\buserId:/.test(src.slice(debut, fin))) out.add(m[1]);
  }
  return out;
}

/**
 * `profils` est dispensée, et voici le motif — dispenser par RÈGLE, pas par
 * fichier : c'est la table des identités elle-même. Un `membreId` ou un
 * `auteurId` n'y désigne pas une ressource possédée mais une PERSONNE, et les
 * routes qui en acceptent un (acceptation d'invitation, commande publique par
 * jeton) prouvent le droit autrement — par le jeton reçu, pas par la
 * possession. Y appliquer la règle produirait un refus faux à chaque fois.
 */
const TABLE_DES_IDENTITES = 'profils';

function fichiersDeRoute(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiersDeRoute(p));
    else if (e.endsWith('.ts')) out.push(p);
  }
  return out;
}

/** Une route qui ÉCRIT (les lectures filtrent déjà sur l'espace côté `where`). */
function ecrit(src: string): boolean {
  return /db\s*\n?\s*\.(insert|update)\(/.test(src);
}

interface Faute {
  fichier: string;
  colonne: string;
  tables: string[];
}

/**
 * Les routes d'écriture qui acceptent une clé étrangère du client sans
 * nommer nulle part la colonne `userId` de la table visée.
 *
 * On cherche `<table>.userId` — une référence de COLONNE. C'est ce qui
 * distingue une vérification (`eq(ruchers.userId, ownerId)`, ou l'argument
 * passé à `assertFkBelongsToOwner`) d'un simple `userId: ownerId` posé dans
 * les valeurs insérées, que TOUTE route écrit.
 */
function auditer(sources: { fichier: string; src: string }[]): Faute[] {
  const carte = carteDesClesEtrangeres();
  const possedees = tablesPossedees();
  const fautes: Faute[] = [];
  for (const { fichier, src } of sources) {
    if (!ecrit(src)) continue;
    for (const [colonne, tables] of carte) {
      const cibles = [...tables].filter((t) => possedees.has(t) && t !== TABLE_DES_IDENTITES);
      if (!cibles.length) continue;
      if (!new RegExp(`\\b${colonne}:\\s*z\\.string\\(\\)\\.uuid\\(`).test(src)) continue;
      if (cibles.some((t) => new RegExp(`\\b${t}\\.userId\\b`).test(src))) continue;
      fautes.push({ fichier, colonne, tables: cibles });
    }
  }
  return fautes;
}

function toutesLesRoutes(): { fichier: string; src: string }[] {
  return fichiersDeRoute(RACINE_API).map((f) => ({ fichier: f, src: readFileSync(f, 'utf-8') }));
}

describe('garde-fou : la carte vient du schéma et le balayage voit les routes', () => {
  it('les clés étrangères sont bien lues dans le schéma Drizzle', () => {
    /**
     * Sans ce cas, un `references()` reformaté rendrait la carte vide et la
     * règle serait « vérifiée » sur zéro colonne — le balayage vide, la forme
     * de faux vert la plus banale de ce dépôt.
     */
    const carte = carteDesClesEtrangeres();
    expect(carte.size, 'aucune clé étrangère lue — la règle ne mesure plus rien').toBeGreaterThan(
      20,
    );
    expect(carte.get('rucherId'), 'la colonne témoin a disparu de la carte').toContain('ruchers');
    expect(tablesPossedees().size, 'aucune table possédée lue').toBeGreaterThan(45);
    expect(
      tablesPossedees(),
      '`reinesElevage` a un propriétaire : la voir « référentielle » dispense à tort',
    ).toContain('reinesElevage');
  });

  it('les routes d’écriture sont bien vues', () => {
    const ecrivent = toutesLesRoutes().filter((r) => ecrit(r.src));
    expect(ecrivent.length, 'aucune route d’écriture lue').toBeGreaterThan(50);
  });

  it('⚠️ CONTRÔLE POSITIF — une route fautive fabriquée est vue fautive', () => {
    /**
     * LE CAS QUI EMPÊCHE CE BANC D'ÊTRE DÉCORATIF. Une règle enfermée dans son
     * `it` ne se vérifie que sur un dépôt sale : le jour où tout est propre,
     * un `auditer` qui répondrait toujours « rien » resterait vert pour
     * toujours. On lui donne donc, ici, la route d'hier.
     */
    const fautive = `
      const schema = z.object({ rucherId: z.string().uuid().optional() });
      export default defineEventHandler(async (event) => {
        const { ownerId } = await assertCanWrite(event);
        const body = await readValidatedBody(event, schema.parse);
        const [created] = await db
          .insert(interventions)
          .values({ userId: ownerId, rucherId: body.rucherId ?? null })
          .returning();
        return { data: created };
      });`;
    const vues = auditer([{ fichier: 'fabriquee.post.ts', src: fautive }]);
    expect(
      vues.map((f) => f.colonne),
      'l’audit ne voit pas une clé étrangère non vérifiée : il ne mesure rien',
    ).toContain('rucherId');
  });

  it('⚠️ CONTRÔLE NÉGATIF — la même route, vérifiée, ne l’est plus', () => {
    /**
     * L'autre sens : sans lui, un `auditer` qui accuserait TOUTE route
     * satisferait le cas précédent tout en rendant la règle inapplicable.
     */
    const saine = `
      const schema = z.object({ rucherId: z.string().uuid().optional() });
      export default defineEventHandler(async (event) => {
        const { ownerId } = await assertCanWrite(event);
        const body = await readValidatedBody(event, schema.parse);
        await assertFkBelongsToOwner(ownerId, ruchers, ruchers.id, ruchers.userId, body.rucherId);
        const [created] = await db.insert(interventions).values({ userId: ownerId }).returning();
        return { data: created };
      });`;
    expect(auditer([{ fichier: 'saine.post.ts', src: saine }])).toEqual([]);
  });
});

describe('la RÈGLE : aucune route ne range une clé étrangère non vérifiée', () => {
  it('les cent et quelques routes d’écriture vérifient toutes ce qu’on leur donne', () => {
    const fautes = auditer(toutesLesRoutes()).map(
      (f) => `${f.fichier} :: ${f.colonne} → ${f.tables.join('/')}`,
    );

    expect(
      fautes,
      'Une clé étrangère non vérifiée laisse écrire une ligne qui pointe chez ' +
        'quelqu’un d’autre : la ligne est conforme au RLS, son lien ne l’est pas. ' +
        'Et la réussite de l’insertion dit si l’UUID existe — un oracle ' +
        'd’énumération que rien ne journalise.',
    ).toEqual([]);
  });
});
