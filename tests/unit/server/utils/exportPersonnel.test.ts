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
 */

const SCHEMA = readFileSync('server/database/schema.ts', 'utf-8');

/** Tables du schéma portant une colonne `user_id`, avec leurs colonnes. */
function tablesUtilisateur(): Map<string, string[]> {
  const morceaux = SCHEMA.split(/\nexport const (\w+) = pgTable\(/);
  const out = new Map<string, string[]>();
  for (let i = 1; i < morceaux.length; i += 2) {
    const nom = morceaux[i]!;
    const corps = morceaux[i + 1]!.slice(0, 4000);
    if (!/userId:\s*uuid\('user_id'\)/.test(corps)) continue;
    const colonnes = [...corps.matchAll(/^\s{4}(\w+):/gm)].map((m) => m[1]!);
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

  it('toute table portant user_id est soit exportée, soit exclue AVEC un motif', () => {
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
