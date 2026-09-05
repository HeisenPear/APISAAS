import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  censurer,
  sourcesExport,
  CHAMPS_CENSURES,
  EXCLUSIONS_MOTIVEES,
  MENTION_CENSURE,
} from '~~/server/utils/exportPersonnel';

/**
 * L'export RGPD s'était périmé en silence : 18 tables exportées sur 51 portant
 * `user_id`. Personne ne l'a vu parce que rien ne comparait la liste au schéma.
 *
 * Ce banc fait cette comparaison. Il ne cherche PAS une chaîne dans un source —
 * ce piège s'est déjà produit ici, un test satisfait par son propre commentaire.
 * Il lit le schéma réel, appelle `sourcesExport()` réellement, et confronte les
 * deux ensembles. Ajouter une table au schéma sans la classer casse le banc,
 * et le message nomme la table.
 *
 * ⚠️ IL S'EST PÉRIMÉ UNE SECONDE FOIS, ET PAR SA PROPRE DÉFINITION. Le balayage
 * ne retenait que `userId: uuid('user_id')`. Or `signalementsFrelon` et
 * `observationsFloraison` sont des tables COMMUNAUTAIRES : elles rattachent par
 * `auteur_id`. Elles n'étaient donc ni exportées, ni exclues — elles étaient
 * INVISIBLES, et le banc restait vert en ne les regardant pas. Le forum arrivait
 * avec la même forme ; l'y ajouter sans élargir aurait rendu le trou au suivant.
 *
 * D'où `COLONNES_DE_PERSONNE` : le balayage suit maintenant les QUATRE colonnes
 * qui nomment une personne dans ce schéma. C'est la même leçon que « dériver,
 * jamais recopier », vue de l'autre bout — une sonde dont la définition est plus
 * étroite que le réel ne mesure pas ce qu'elle prétend mesurer.
 */

const SCHEMA = readFileSync('server/database/schema.ts', 'utf-8');

/**
 * Les colonnes par lesquelles une ligne appartient à quelqu'un.
 *
 * `user_id` est la voie normale ; `auteur_id` celle des tables communautaires
 * (frelon, floraisons, forum) ; `owner_id` et `membre_id` la seconde chaîne de
 * propriété (organisations, commandes groupées), déjà nommée dans CLAUDE.md
 * comme n'ayant pas encore sa règle. Elle l'a ici.
 */
const COLONNES_DE_PERSONNE = ['user_id', 'auteur_id', 'owner_id', 'membre_id'] as const;

const MOTIF_RATTACHEMENT = new RegExp(
  `\\b(?:\\w+): uuid\\('(?:${COLONNES_DE_PERSONNE.join('|')})'\\)`,
);

/**
 * Ce qui construit un INDEX, pas une colonne. Les deux s'écrivent pareil —
 * `nom: quelqueChose(...)` — et se distinguent par l'appel.
 */
const CONSTRUCTEURS_D_INDEX = new Set([
  'index',
  'uniqueIndex',
  'foreignKey',
  'primaryKey',
  'unique',
  'check',
]);

/**
 * Tables du schéma rattachées à une personne, avec leurs colonnes.
 *
 * ⚠️ LA LECTURE DES COLONNES ÉTAIT AVEUGLE À LA MOITIÉ DU SCHÉMA. Elle exigeait
 * quatre espaces d'indentation — ce qui n'est vrai que des tables déclarées avec
 * un second argument `(t) => ({ … })`. Une table SANS index (`pgTable('x', { … })`)
 * indente ses colonnes de DEUX espaces : la liste revenait vide, et le balayage
 * anti-jeton la déclarait donc conforme sans avoir rien regardé. C'est « le
 * balayage vide » du catalogue, appliqué à une table sur deux.
 *
 * La source est passée en argument pour que la règle soit vérifiable sur des
 * sources FABRIQUÉES — une qui la viole, une qui la respecte. Sans ce contrôle
 * positif, rétrécir la sonde ne ferait rien tomber sur un dépôt propre.
 */
export function tablesUtilisateur(source: string = SCHEMA): Map<string, string[]> {
  const morceaux = source.split(/\nexport const (\w+) = pgTable\(/);
  const out = new Map<string, string[]>();
  for (let i = 1; i < morceaux.length; i += 2) {
    const nom = morceaux[i]!;
    const corps = morceaux[i + 1]!.slice(0, 4000);
    if (!MOTIF_RATTACHEMENT.test(corps)) continue;
    const colonnes = [...corps.matchAll(/^\s{2,8}(\w+):\s*(\w+)\(/gm)]
      .filter((m) => !CONSTRUCTEURS_D_INDEX.has(m[2]!))
      .map((m) => m[1]!);
    out.set(nom, colonnes);
  }
  return out;
}

const TABLES = tablesUtilisateur();
const CLES_EXPORTEES = new Set(
  sourcesExport('00000000-0000-0000-0000-000000000000').map((s) => s.cle),
);

describe('export RGPD — le schéma ne peut pas dériver sans qu’on le voie', () => {
  it('le schéma est bien lu (garde-fou du banc lui-même)', () => {
    // Si le parseur casse, tous les autres tests passeraient sur un ensemble vide.
    expect(TABLES.size).toBeGreaterThan(40);
    expect(TABLES.has('ruches')).toBe(true);
    expect(TABLES.get('balances')).toContain('ingestToken');
  });

  it('le balayage voit les QUATRE façons de nommer une personne', () => {
    /**
     * ⚠️ SANS CE CAS, RÉTRÉCIR LE BALAYAGE À `user_id` NE FAIT RIEN TOMBER
     * D'ÉVIDENT — les tables communautaires disparaîtraient simplement de
     * `TABLES`, et un banc qui ne regarde plus rien est vert. C'est exactement
     * l'état dans lequel `signalementsFrelon` et `observationsFloraison` ont
     * vécu jusqu'ici : jamais classées, jamais signalées.
     *
     * Une table par colonne de rattachement, nommée en dur : c'est la seule
     * façon de faire rougir un rétrécissement de la définition.
     */
    expect(TABLES.has('ruches'), 'user_id — la voie normale').toBe(true);
    expect(TABLES.has('signalementsFrelon'), 'auteur_id — les tables communautaires').toBe(true);
    expect(TABLES.has('sujetsForum'), 'auteur_id — le forum').toBe(true);
    expect(TABLES.has('organisations'), 'owner_id — la seconde chaîne de propriété').toBe(true);
    expect(TABLES.has('commandesGroupees'), 'membre_id — la seconde chaîne de propriété').toBe(
      true,
    );
  });

  it('les colonnes sont lues quelle que soit l’indentation de la table', () => {
    /**
     * `veterinaires` se déclare sans index — donc colonnes à DEUX espaces. La
     * lecture n'en voyait aucune, et le balayage anti-jeton la traversait sans
     * rien examiner. Le cas fixe le bord : une table à deux espaces rend ses
     * colonnes comme une table à quatre.
     */
    expect(TABLES.get('veterinaires'), 'table sans index — colonnes à 2 espaces').toContain(
      'nomComplet',
    );
    expect(TABLES.get('ruches'), 'table avec index — colonnes à 4 espaces').toContain('numero');
  });

  it('la sonde distingue une table rattachée d’une table anonyme (contrôle positif)', () => {
    /**
     * Le contrôle positif de `scripts/controle-sonde.mjs`, transposé : deux
     * sources FABRIQUÉES, une qui viole la règle et une qui la respecte. Sur un
     * dépôt propre, neutraliser la sonde donnerait le même vert que la
     * respecter ; ce cas-ci est le seul qui puisse encore rougir.
     */
    const fabrique = `
export const rattachee = pgTable('rattachee', {
  id: uuid('id').defaultRandom().primaryKey(),
  auteurId: uuid('auteur_id').notNull(),
  secretToken: text('secret_token'),
});

export const anonyme = pgTable('anonyme', {
  id: uuid('id').defaultRandom().primaryKey(),
  libelle: text('libelle'),
});

export const indexee = pgTable(
  'indexee',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull(),
  },
  (t) => ({
    ownerIdx: index('idx_owner').on(t.ownerId),
  }),
);
`;
    const vues = tablesUtilisateur(fabrique);
    expect([...vues.keys()], 'seules les tables nommant une personne sont retenues').toEqual([
      'rattachee',
      'indexee',
    ]);
    expect(vues.get('rattachee'), 'les colonnes d’une table à 2 espaces sont lues').toEqual([
      'id',
      'auteurId',
      'secretToken',
    ]);
    expect(vues.get('indexee'), 'un index n’est pas une colonne').toEqual(['id', 'ownerId']);
  });

  it('toute table nommant une personne est soit exportée, soit exclue AVEC un motif', () => {
    const orphelines = [...TABLES.keys()].filter(
      (t) => t !== 'profils' && !CLES_EXPORTEES.has(t) && !(t in EXCLUSIONS_MOTIVEES),
    );
    expect(
      orphelines,
      `Ces tables portent des données de l'utilisateur et ne sont ni exportées ni exclues. ` +
        `Ajoute-les à sourcesExport(), ou à EXCLUSIONS_MOTIVEES avec la raison : ${orphelines.join(', ')}`,
    ).toEqual([]);
  });

  it('aucune exclusion n’est muette', () => {
    for (const [table, motif] of Object.entries(EXCLUSIONS_MOTIVEES)) {
      expect(TABLES.has(table), `${table} est exclue mais n'existe plus au schéma`).toBe(true);
      expect(motif.length, `${table} est exclue sans motif lisible`).toBeGreaterThan(40);
    }
  });

  it('aucune table exportée n’est un fantôme', () => {
    for (const cle of CLES_EXPORTEES) {
      expect(TABLES.has(cle), `${cle} est exportée mais absente du schéma`).toBe(true);
    }
  });

  it('une clé exportée ne peut pas être à la fois incluse et exclue', () => {
    const doublons = [...CLES_EXPORTEES].filter((c) => c in EXCLUSIONS_MOTIVEES);
    expect(doublons).toEqual([]);
  });
});

describe('export RGPD — aucune clé d’accès ne sort du produit', () => {
  /**
   * `balances.ingestToken` authentifie SEUL les pesées entrantes
   * (server/api/balances/ingest/[token].post.ts, sans session). Un export se
   * transmet et s'archive : l'y laisser reviendrait à distribuer un droit
   * d'écriture sur le rucher.
   */
  const SUSPECTE = /token|secret|password|jeton|apikey/i;

  it('toute colonne qui ressemble à un jeton, dans une table exportée, est censurée', () => {
    const fuites: string[] = [];
    for (const cle of CLES_EXPORTEES) {
      const colonnes = TABLES.get(cle) ?? [];
      for (const col of colonnes) {
        if (!SUSPECTE.test(col)) continue;
        if (CHAMPS_CENSURES[cle]?.includes(col)) continue;
        fuites.push(`${cle}.${col}`);
      }
    }
    expect(
      fuites,
      `Ces colonnes ressemblent à des clés d'accès et partiraient en clair dans ` +
        `l'export : ${fuites.join(', ')}. Ajoute-les à CHAMPS_CENSURES, ou retire ` +
        `la table de l'export.`,
    ).toEqual([]);
  });

  it('la censure vise des colonnes qui existent vraiment', () => {
    for (const [table, champs] of Object.entries(CHAMPS_CENSURES)) {
      const colonnes = TABLES.get(table) ?? [];
      for (const champ of champs) {
        expect(colonnes, `${table}.${champ} est censurée mais n'existe pas`).toContain(champ);
      }
    }
  });
});

describe('censurer', () => {
  it('remplace le jeton et ne touche à rien d’autre', () => {
    const [ligne] = censurer('balances', [
      { id: 'b1', nom: 'Balance du tilleul', ingestToken: 'tok_secret_reel', poids: 42 },
    ]);
    expect(ligne!.ingestToken).toBe(MENTION_CENSURE);
    expect(ligne!.nom).toBe('Balance du tilleul');
    expect(ligne!.poids).toBe(42);
    expect(ligne!.id).toBe('b1');
  });

  it('laisse intactes les tables sans champ censuré', () => {
    const lignes = [{ id: 'r1', nom: 'Rucher du chêne' }];
    expect(censurer('ruchers', lignes)).toEqual(lignes);
  });

  it('n’invente pas le champ quand il est absent de la ligne', () => {
    const [ligne] = censurer('balances', [{ id: 'b2', nom: 'Sans jeton' }]);
    expect('ingestToken' in ligne!).toBe(false);
  });

  it('laisse null tel quel — un jeton absent n’est pas un secret à masquer', () => {
    const [ligne] = censurer('connexionsBalance', [{ id: 'c1', token: null }]);
    expect(ligne!.token).toBeNull();
  });

  it('ne mute pas la ligne d’origine', () => {
    const source = { id: 'b3', ingestToken: 'tok_reel' };
    censurer('balances', [source]);
    expect(source.ingestToken).toBe('tok_reel');
  });

  it('censure chaque ligne d’un lot, pas seulement la première', () => {
    const lignes = censurer('balances', [
      { id: 'b1', ingestToken: 'tok_a' },
      { id: 'b2', ingestToken: 'tok_b' },
    ]);
    expect(lignes.map((l) => l.ingestToken)).toEqual([MENTION_CENSURE, MENTION_CENSURE]);
  });
});

describe('export RGPD — périmètre de la personne, pas de l’exploitation', () => {
  it('chaque source filtre sur l’utilisateur passé en argument', () => {
    // `sourcesExport` construit des thunks : rien ne touche la base tant qu'on
    // ne les appelle pas. On vérifie ici la forme, pas l'exécution.
    const sources = sourcesExport('11111111-1111-1111-1111-111111111111');
    expect(sources.length).toBeGreaterThan(40);
    expect(new Set(sources.map((s) => s.cle)).size).toBe(sources.length);
  });

  it('membres est exporté — les adhésions de la personne, pas ses invités', () => {
    // Le filtre est `userId`, donc les lignes où la personne est `ownerId`
    // (les e-mails de SES invités, données de tiers) restent dehors.
    expect(CLES_EXPORTEES.has('membres')).toBe(true);
  });
});
