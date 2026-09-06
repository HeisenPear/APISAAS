// ═══════════════════════════════════════════════════════════════════════════
// DOUBLE DE BASE — le fichier que `tests/setup.ts` promettait sans l'écrire.
//
// Son message d'erreur renvoyait vers `tests/helpers/fauxDb.ts` depuis le
// début ; le fichier n'a jamais existé. Un développeur qui touchait une vraie
// requête lisait donc « utilisez le double de base » et ne trouvait rien.
//
// ─── POURQUOI UN DOUBLE, ET PAS UNE VRAIE BASE ────────────────────────────
// Ce dépôt n'a pas de base de test : le `.env` de référence porte la
// PRODUCTION. Les bancs qui écrivent vraiment vivent dans `tests/integration/`
// et travaillent sur un locataire éphémère. Ici, on veut l'inverse : exercer la
// LOGIQUE (qui a le droit d'écrire, sur quel espace, avec quel plan) sans
// qu'aucune requête ne parte.
//
// ─── CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS ───────────────────────────────
// Il couvre la seule forme de requête utilisée par la couche qu'on teste :
//
//     db.select({…}).from(table).where(cond).limit(n)   → tableau de lignes
//
// Il n'INTERPRÈTE PAS la condition — écrire un moteur SQL en JavaScript serait
// se tester soi-même. Il fait deux choses, et elles suffisent :
//
//   1. il rend les lignes que le banc a déclarées pour cette table ;
//   2. il ENREGISTRE la condition, dont on extrait les valeurs littérales.
//
// Le point 2 est celui qui compte pour la sécurité. L'isolation entre
// exploitations de cette application n'est pas assurée par la RLS — `db.ts`
// ouvre une connexion directe qui la contourne — mais par les `eq(userId, …)`
// écrits à la main dans chaque requête. Vérifier QUELLES VALEURS partent dans
// le filtre, c'est vérifier exactement cette garantie-là.
// ═══════════════════════════════════════════════════════════════════════════

import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/** Une requête observée : la table visée, ses colonnes filtrées et leurs valeurs. */
export interface RequeteObservee {
  table: string;
  /** Valeurs liées de la condition — uniquement les vrais paramètres. */
  valeurs: string[];
  /** Colonnes SQL apparaissant dans la condition (`user_id`, `statut`…). */
  colonnes: string[];
  limite: number | null;
}

/**
 * Extrait ce qui est VRAIMENT filtré d'une condition Drizzle.
 *
 * ─── POURQUOI CETTE PRÉCISION EST INDISPENSABLE ───────────────────────────
 * La première version de cette fonction parcourait l'objet en entier et
 * ramassait toute chaîne rencontrée. Elle a été prise en défaut par un test de
 * mutation : en retirant `eq(membres.statut, 'acceptee')` de la requête de
 * production — c'est-à-dire en ouvrant l'espace aux invitations NON acceptÉES —
 * le banc restait vert. La chaîne « acceptee » était toujours trouvée, non pas
 * dans le filtre, mais dans les métadonnées de la colonne `statut`, atteignable
 * depuis la table que la condition référence.
 *
 * Un extracteur trop large rend l'assertion toujours vraie, donc inutile.
 * Celui-ci ne descend QUE dans `SQL.queryChunks` et ne retient que les nœuds
 * `Param` — les valeurs réellement liées — plus le nom des colonnes comparées.
 */
function analyserCondition(noeud: unknown): { valeurs: string[]; colonnes: string[] } {
  const valeurs: string[] = [];
  const colonnes: string[] = [];

  const parcourir = (n: unknown): void => {
    if (n == null || typeof n !== 'object') return;
    const genre = (n as { constructor?: { name?: string } }).constructor?.name;

    if (genre === 'Param') {
      const v = (n as { value?: unknown }).value;
      if (v != null && typeof v !== 'object') valeurs.push(String(v));
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(parcourir);
      return;
    }
    if (genre === 'SQL') {
      (n as { queryChunks?: unknown[] }).queryChunks?.forEach(parcourir);
      return;
    }
    // Colonne Drizzle (PgUUID, PgText…) : on note son nom SQL et on s'arrête —
    // descendre plus bas mènerait à la table entière, donc à tout le schéma.
    const nomColonne = (n as { name?: unknown }).name;
    if (genre?.startsWith('Pg') && typeof nomColonne === 'string') {
      colonnes.push(nomColonne);
    }
  };

  parcourir(noeud);
  return { valeurs, colonnes };
}

/**
 * Les valeurs LIÉES d'une condition Drizzle — les vrais paramètres, rien
 * d'autre. Exposée parce qu'un second double en avait besoin (le banc du cron
 * des achats récurrents doit savoir DE QUEL apiculteur on lit la séquence) :
 * recopier l'analyseur là-bas aurait été exactement la duplication que
 * `analyserCondition` a été écrite pour éviter.
 */
export function valeursLiees(condition: unknown): string[] {
  return analyserCondition(condition).valeurs;
}

export interface FauxDb {
  /** Objet à poser sur `globalThis.db` — `db` est un auto-import Nuxt. */
  db: unknown;
  /** Requêtes observées, dans l'ordre. */
  requetes: RequeteObservee[];
  /** Toutes les valeurs de filtre vues, toutes requêtes confondues. */
  toutesLesValeurs(): string[];
  /** Une valeur a-t-elle été LIÉE dans un filtre au moins une fois ? */
  aFiltreSur(valeur: string): boolean;
  /** Une colonne a-t-elle été comparée dans un filtre au moins une fois ? */
  aFiltreLaColonne(colonne: string): boolean;
}

/**
 * Construit un double de base.
 *
 * @param lignesParTable  Lignes à rendre, indexées par NOM SQL de table
 *                        (`membres`, `profils`…). Une table absente rend `[]`,
 *                        ce qui est le cas « rien trouvé » — souvent le plus
 *                        intéressant à tester.
 */
export function creerFauxDb(lignesParTable: Record<string, unknown[]> = {}): FauxDb {
  const requetes: RequeteObservee[] = [];

  const db = {
    select() {
      let table = '(inconnue)';
      let valeurs: string[] = [];
      let colonnes: string[] = [];
      let limite: number | null = null;
      let saut = 0;

      // Chaîne fluide : chaque maillon se renvoie lui-même, et le tout est
      // « thenable » pour qu'un `await` sans `.limit()` fonctionne aussi.
      const maillon = {
        from(t: PgTable) {
          table = getTableName(t);
          return maillon;
        },
        where(cond: unknown) {
          ({ valeurs, colonnes } = analyserCondition(cond));
          return maillon;
        },
        orderBy() {
          return maillon;
        },
        /**
         * ⚠️ LA JOINTURE NE CHANGE PAS LA TABLE OBSERVÉE, ET C'EST VOULU. Une
         * requête part `from(messagesForum)` et joint `profils` pour le
         * pseudonyme : ce qu'on veut mesurer reste « quelles lignes de
         * messages » — la table de départ. Écraser `table` à chaque jointure
         * ferait croire que la requête porte sur `profils`, et les assertions
         * de cloisonnement viseraient la mauvaise table.
         *
         * La CONDITION de jointure n'est pas non plus versée dans `valeurs` :
         * elle relie deux colonnes, elle ne filtre sur aucune valeur. L'y
         * mettre diluerait ce que `aFiltreSur` garantit.
         */
        innerJoin() {
          return maillon;
        },
        leftJoin() {
          return maillon;
        },
        limit(n: number) {
          limite = n;
          return maillon;
        },
        offset(n: number) {
          saut = n;
          return maillon;
        },
        then(resoudre: (v: unknown[]) => unknown, rejeter?: (e: unknown) => unknown) {
          try {
            requetes.push({ table, valeurs, colonnes, limite });
            const toutes = (lignesParTable[table] ?? []).slice(saut);
            return Promise.resolve(limite == null ? toutes : toutes.slice(0, limite)).then(
              resoudre,
              rejeter,
            );
          } catch (e) {
            return Promise.reject(e).then(resoudre, rejeter);
          }
        },
      };
      return maillon;
    },

    /**
     * L'ÉCRITURE CONDITIONNELLE — `update(t).set(…).where(…).returning(…)`.
     *
     * ⚠️ C'EST LA FORME QUI PORTE LA SÉCURITÉ, ET LE DOUBLE NE LA VOYAIT PAS.
     * Ce dépôt tient une règle explicite : le contrôle et l'écriture doivent
     * être le MÊME ordre SQL, dont le `where` EST le contrôle
     * (`membres/accepter.post.ts` l'a payé). Un double aveugle aux `update`
     * laissait donc cette règle-là entièrement hors mesure : on ne pouvait
     * vérifier ni qu'un `auteurId` figure au filtre, ni qu'un statut y est
     * exigé.
     *
     * ⚠️ ET IL REFUSE CE QUE LA VRAIE BASE REFUSERAIT. `returning()` rend le
     * tableau des lignes déclarées pour la table — donc `[]` quand le banc n'en
     * déclare aucune, ce qui est le cas « la condition n'a rien trouvé ». Un
     * double qui rendrait toujours une ligne rendrait vertes les routes dont
     * le `where` ne filtre rien.
     */
    update(t: PgTable) {
      const table = getTableName(t);
      let valeurs: string[] = [];
      let colonnes: string[] = [];

      const maillon = {
        set() {
          return maillon;
        },
        where(cond: unknown) {
          ({ valeurs, colonnes } = analyserCondition(cond));
          return maillon;
        },
        returning() {
          requetes.push({ table, valeurs, colonnes, limite: null });
          return Promise.resolve(lignesParTable[table] ?? []);
        },
        then(resoudre: (v: unknown[]) => unknown, rejeter?: (e: unknown) => unknown) {
          requetes.push({ table, valeurs, colonnes, limite: null });
          return Promise.resolve(lignesParTable[table] ?? []).then(resoudre, rejeter);
        },
      };
      return maillon;
    },
  };

  return {
    db,
    requetes,
    toutesLesValeurs: () => requetes.flatMap((r) => r.valeurs),
    aFiltreSur: (valeur) => requetes.some((r) => r.valeurs.includes(valeur)),
    aFiltreLaColonne: (colonne) => requetes.some((r) => r.colonnes.includes(colonne)),
  };
}
