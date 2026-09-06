// ═══════════════════════════════════════════════════════════════════════════
// UNE COLONNE DÉCLARÉE MAIS JAMAIS CRÉÉE COUPE L'APPLICATION.
//
// ─── CE QUI EST ARRIVÉ ─────────────────────────────────────────────────────
// `nom_commercial` a été ajoutée à `schema.ts` et son DDL est parti dans un
// fichier à part, « en attente ». Or `schema-complet.sql` dit en toutes lettres
// depuis le premier jour : « Ce fichier est la référence UNIQUE à exécuter dans
// Supabase SQL Editor. NE PAS créer de nouveaux fichiers de migration — tout va
// ici. » La colonne n'était donc dans aucun fichier que l'apiculteur joue.
//
// Ce n'est pas une coquetterie d'organisation. Drizzle construit une liste de
// colonnes EXPLICITE : tout `db.query.profils.findFirst()` sans clause
// `columns` demande `"profils"."nom_commercial"` et se prend un
// `column does not exist`. Il y en a cinq — dont `/api/auth/me`, rejouée à
// chaque ouverture de l'application, et le webhook Stripe, où l'erreur coûte un
// paiement perdu.
//
// ⚠️ ET LA PRÉVERSION TAPE LA BASE DE PRODUCTION. Déployer la branche avant
// d'avoir joué le SQL ne dégrade pas une fonctionnalité : ça éteint
// l'application pour tous les comptes, sur de vrais clients.
//
// ─── MUTATION QUI DOIT FAIRE ROUGIR ────────────────────────────────────────
// Retirer `ALTER TABLE profils ADD COLUMN IF NOT EXISTS nom_commercial TEXT;`
// de `schema-complet.sql` → rouge, en nommant la colonne.
// ═══════════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '~~/server/database/schema';

/**
 * Blanchit les commentaires SQL (`-- …` jusqu'à la fin de ligne, `/* … *\/`),
 * en suivant les chaînes pour ne pas couper sur un `--` littéral.
 *
 * ⚠️ SANS ÇA, UNE COLONNE MENTIONNÉE DANS UN COMMENTAIRE ÉTAIT RÉPUTÉE
 * EXISTER. La règle centrale de ce banc cherche `\bnom_de_colonne\b` dans le
 * fichier ENTIER : une note explicative qui cite le nom suffisait donc à faire
 * croire que la colonne est créée. Le jour où quelqu'un déclare une colonne
 * dans `schema.ts`, l'oublie dans le `CREATE TABLE` et l'évoque en passant
 * dans un commentaire, ce banc l'aurait laissée passer — et TOUTE requête sur
 * la table échouerait en production, ce que ce fichier existe précisément pour
 * empêcher.
 *
 * Trouvé de la façon la plus banale : une phrase française contenant le mot
 * « message » a suffi à faire croire que `alertes.message` était au SQL.
 */
function sansCommentairesSql(src: string): string {
  let out = '';
  let chaine = false;
  let ligne = false;
  let bloc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    const deux = src.slice(i, i + 2);
    if (ligne) {
      if (c === '\n') {
        ligne = false;
        out += '\n';
      }
      continue;
    }
    if (bloc) {
      if (deux === '*/') {
        bloc = false;
        i++;
      }
      out += c === '\n' ? '\n' : ' ';
      continue;
    }
    if (chaine) {
      out += c;
      if (c === "'") chaine = false;
      continue;
    }
    if (deux === '--') {
      ligne = true;
      continue;
    }
    if (deux === '/*') {
      bloc = true;
      i++;
      out += '  ';
      continue;
    }
    if (c === "'") chaine = true;
    out += c;
  }
  return out;
}

const SQL = sansCommentairesSql(readFileSync('server/database/schema-complet.sql', 'utf8'));

/** Toutes les tables du schéma Drizzle — DÉRIVÉES du module, jamais recopiées. */
const TABLES = Object.values(schema).filter((v): v is PgTable => is(v, PgTable));

describe('le balayage voit ce qu’il doit voir', () => {
  it('GARDE-FOU : le balayage voit bien les tables et le SQL', () => {
    // « Le balayage vide » de CLAUDE.md : un filtre trop strict rendrait zéro
    // table, et la conformité serait « vérifiée » sur rien.
    expect(TABLES.length, 'le schéma Drizzle doit livrer ses tables').toBeGreaterThan(40);
    expect(SQL.length).toBeGreaterThan(10_000);
    expect(TABLES.map(getTableName)).toContain('profils');
  });

  it('GARDE-FOU : un nom cité dans un COMMENTAIRE ne compte pas', () => {
    /**
     * Contrôle positif sur des sources fabriquées : sans lui, retirer le
     * blanchiment donnerait le même vert sur un dépôt sain — et la règle
     * centrale redeviendrait satisfaisable par une phrase.
     */
    const avecCommentaire = [
      '-- la colonne fantome_xyz serait bien pratique ici',
      '/* on parle aussi de fantome_xyz dans un bloc */',
      'CREATE TABLE t (id UUID);',
    ].join('\n');
    expect(/\bfantome_xyz\b/.test(sansCommentairesSql(avecCommentaire))).toBe(false);

    const vraieColonne = 'CREATE TABLE t (\n  fantome_xyz TEXT\n);';
    expect(/\bfantome_xyz\b/.test(sansCommentairesSql(vraieColonne))).toBe(true);

    // Un `--` DANS une chaîne n'ouvre pas un commentaire.
    expect(sansCommentairesSql("SELECT 'a--b' AS x, vraie_colonne;")).toContain('vraie_colonne');
  });

  it('GARDE-FOU : le repérage d’une colonne dans le SQL fonctionne', () => {
    // Sans lui, une recherche qui trouverait TOUT (ou rien) validerait n'importe
    // quoi. `logo_url` est présente, `colonne_qui_nexiste_pas` ne l'est pas.
    expect(SQL).toMatch(/\blogo_url\b/);
    expect(SQL).not.toMatch(/\bcolonne_qui_nexiste_pas\b/);
  });
});

/**
 * ⚠️ LE SOCLE HISTORIQUE — la seule dispense, et elle porte UN motif unique.
 *
 * `schema-complet.sql` ne CRÉE aucune des tables de base : elles ont été posées
 * par `drizzle-kit push` avant que ce fichier n'existe, et il ne porte depuis
 * que les ajouts INCRÉMENTAUX (« Phase 1 + Phase 2 + … »). Trente-neuf colonnes
 * fondatrices n'y figurent donc pas — `transactions.total` comme
 * `interventions.donnees` — sans que rien ne soit cassé : elles sont en base
 * depuis le premier jour.
 *
 * Ce n'est PAS une dispense par fichier : c'est une dispense par MOTIF, et le
 * motif est daté. Toute colonne ajoutée après coup doit passer par le SQL, sans
 * exception — c'est précisément l'écart que la règle attrape.
 *
 * ⚠️ ET LA LISTE NE PEUT PAS ENFLER EN SILENCE : un cas ci-dessous exige que
 * chaque entrée soit ENCORE absente du SQL. Le jour où l'une y est ajoutée, sa
 * dispense devient morte et doit être retirée. Une liste figée qui ne se
 * vérifie pas est une porte laissée ouverte.
 */
const SOCLE_HISTORIQUE = new Set([
  /**
   * ⚠️ CES TROIS-LÀ ONT ÉTÉ RÉVÉLÉES PAR LE BLANCHIMENT DES COMMENTAIRES, ET
   * ELLES ÉTAIENT DISPENSÉES SANS LE SAVOIR. Elles appartiennent au socle au
   * même titre que les trente-neuf autres — `schema-complet.sql` ne crée pas
   * plus la table `alertes` que la table `stocks`. Mais elles n'y figuraient
   * pas, parce que la règle les trouvait AILLEURS : « lue » dans « Table
   * interne lue uniquement côté serveur », « emplacement » dans une note sur
   * la transhumance, « comportement » dans « ANALYTICS PRODUIT — comportement
   * utilisateur ». Trois phrases françaises tenaient lieu de schéma.
   *
   * Rien n'était cassé — ces colonnes SONT en base depuis le premier jour.
   * Ce qui était cassé, c'est la garantie : une colonne réellement oubliée
   * dont le nom apparaît dans une note serait passée de la même façon, et
   * TOUTE requête sur sa table aurait échoué au déploiement.
   */
  'alertes.lue',
  'stocks.emplacement',
  'interventions.comportement',
  // alertes
  'alertes.action_url',
  'alertes.message',
  'alertes.priorite',
  // clients
  'clients.entreprise',
  // interventions
  'interventions.actions_realisees',
  'interventions.cellule_royale',
  'interventions.couvain',
  'interventions.donnees',
  'interventions.force_colonie',
  'interventions.maladie_observee',
  'interventions.meteo',
  'interventions.nourrissement_quantite',
  'interventions.nourrissement_type',
  'interventions.offline_id',
  'interventions.reine_vue',
  'interventions.reserves',
  'interventions.signe_essaimage',
  'interventions.synced_at',
  'interventions.traitement_applique',
  // profils
  'profils.napi',
  'profils.onboarding_complete',
  'profils.preferences',
  // recoltes
  'recoltes.date_recolte',
  'recoltes.nombre_hausses',
  'recoltes.quantite_kg',
  // ruchers
  'ruchers.departement',
  'ruchers.environnement',
  'ruchers.notes_acces',
  // ruches
  'ruches.date_installation',
  'ruches.marquage_reine',
  'ruches.nombre_hausses',
  'ruches.qualite_reine',
  // stocks
  'stocks.seuil_alerte',
  // transactions
  'transactions.date_echeance',
  'transactions.date_transaction',
  'transactions.pdf_url',
  'transactions.sous_total',
  'transactions.total',
  'transactions.tva',
]);

describe('schema.ts et schema-complet.sql ne divergent pas', () => {
  it('LA RÈGLE : chaque colonne déclarée existe dans le SQL de référence', () => {
    const manquantes: string[] = [];
    for (const table of TABLES) {
      const nomTable = getTableName(table);
      for (const col of Object.values(getTableColumns(table))) {
        // On cherche le nom SQL de la colonne, en mot entier. Volontairement
        // souple : elle peut apparaître dans un CREATE TABLE ou dans un
        // ALTER TABLE ADD COLUMN — les deux formes coexistent dans le fichier.
        const cle = `${nomTable}.${col.name}`;
        if (SOCLE_HISTORIQUE.has(cle)) continue;
        if (!new RegExp(`\\b${col.name}\\b`).test(SQL)) manquantes.push(cle);
      }
    }
    expect(
      manquantes,
      'Ces colonnes sont déclarées dans schema.ts et absentes de\n' +
        'server/database/schema-complet.sql — la référence UNIQUE à jouer dans\n' +
        'Supabase. Drizzle liste ses colonnes explicitement : déployer sans avoir\n' +
        'joué le SQL fait échouer TOUTE requête sur ces tables, y compris\n' +
        '/api/auth/me et le webhook Stripe. Ajoutez-y un\n' +
        '`ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <colonne> <type>;`.',
    ).toEqual([]);
  });

  it('chaque dispense du socle est ENCORE nécessaire', () => {
    // Une dispense périmée masque la colonne suivante qui portera le même nom.
    const inutiles = [...SOCLE_HISTORIQUE].filter((cle) => {
      const colonne = cle.split('.')[1]!;
      return new RegExp(`\\b${colonne}\\b`).test(SQL);
    });
    expect(
      inutiles,
      'Ces colonnes sont désormais dans schema-complet.sql : retirez-les de\n' +
        'SOCLE_HISTORIQUE. Une liste figée qui ne se vérifie pas enfle en silence.',
    ).toEqual([]);
  });

  it('le socle ne couvre que des colonnes RÉELLES du schéma', () => {
    // Une entrée qui ne désigne plus rien (colonne renommée, table supprimée)
    // est un reste : elle donne l'illusion d'une couverture qu'elle n'a plus.
    const connues = new Set(
      TABLES.flatMap((t) =>
        Object.values(getTableColumns(t)).map((c) => `${getTableName(t)}.${c.name}`),
      ),
    );
    expect([...SOCLE_HISTORIQUE].filter((c) => !connues.has(c))).toEqual([]);
  });

  it('aucun fichier de migration parallèle ne réapparaît', () => {
    // L'en-tête de `schema-complet.sql` l'interdit — et le contournement s'est
    // produit : un `migrations-en-attente.sql` avait été créé à côté, si bien
    // que la colonne n'était dans aucun fichier que l'apiculteur joue.
    const sqls = readdirSync('server/database').filter((f) => f.endsWith('.sql'));
    expect(sqls.length, 'le balayage voit bien des .sql').toBeGreaterThan(0);
    const attendus = ['schema-complet.sql', 'rls.sql', 'invariants-lecture.sql'];
    const inattendus = sqls.filter((f) => !attendus.includes(f) && !f.startsWith('rattrapage-'));
    expect(
      inattendus,
      'Le DDL va dans schema-complet.sql, la référence unique. Un fichier à part\n' +
        'n’est jamais joué : la colonne existe alors dans le code et pas en base.\n' +
        '(Un script de RATTRAPAGE de DONNÉES est autre chose — préfixez-le\n' +
        '`rattrapage-`, comme rattrapage-controles-maya.sql.)',
    ).toEqual([]);
  });
});
