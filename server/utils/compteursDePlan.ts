// ═══════════════════════════════════════════════════════════════════════════
// COMBIEN L'APICULTEUR EN A DÉJÀ — UN SEUL JEU DE COMPTEURS, POUR TOUT LE MONDE.
//
// ⚠️ CE FICHIER NAÎT D'UN TROU SILENCIEUX, ET LE TROU EST INSTRUCTIF.
//
// Il existait deux compteurs de ressources dans le dépôt :
//
//   · `server/middleware/04.subscription.ts` — sept ressources, un `switch`,
//     et un `default: return 0`. Zéro veut dire « en dessous du plafond » :
//     une limite inconnue LAISSE PASSER, en silence.
//   · `server/utils/copilote-gating.ts` — une seule ressource, `clients`, et
//     `if (limite !== 'clients') return null;` ; or `null` y valait aussi
//     « laisse passer ».
//
// Le commentaire d'origine assumait ce choix : « seul clients est atteignable
// par une écriture Maya aujourd'hui […] on préfère ne pas appliquer que
// d'appliquer de travers ». C'était vrai le jour où il a été écrit. Mais
// `ROUTE_EQUIVALENTE` déclare DÉJÀ l'action `vente`, dont la route porte
// `limit: 'facturesParMois'`. Le jour où la vente cesse d'être un squelette,
// le plafond de factures ne s'applique pas — et rien ne sonne. C'est
// exactement la classe de défaut qui a déjà coûté cher ici : une garde qui
// dort en attendant le code qui la réveillera, sauf que personne ne s'en
// souvient au moment de l'écrire.
//
// LA VRAIE CORRECTION N'EST PAS D'AJOUTER SIX `case`. C'est de n'avoir plus
// qu'un seul endroit où l'on sait compter, et de faire du « je ne sais pas
// compter » un REFUS au lieu d'un laissez-passer. Une porte qui ignore ce
// qu'elle ne comprend pas n'est pas une porte.
//
// L'exécuteur est un paramètre : le middleware compte sur `db`, Maya compte
// DANS SA TRANSACTION — sans quoi un lot qui crée cinq clients passerait cinq
// fois le même contrôle sur un compteur figé.
// ═══════════════════════════════════════════════════════════════════════════

import { eq, and, gte, sql } from 'drizzle-orm';
import {
  ruchers,
  ruches,
  clients,
  transactions,
  membres,
  templatesIntervention,
  balances,
} from '~~/server/database/schema';
import type { PlanLimits } from '~~/app/config/plans';
import type { DrizzleTransaction } from '~~/server/types/interventions';
import type { db } from '~~/server/utils/db';

/**
 * De quoi lire la base : la connexion, ou la transaction en cours. Les deux
 * exposent `select()`, c'est tout ce dont les compteurs ont besoin.
 */
export type Executeur = DrizzleTransaction | typeof db;

/** Une ressource comptable : sa requête, et rien d'autre. */
type Compteur = (exec: Executeur, userId: string, maintenant: Date) => Promise<number>;

const un = async (rows: Promise<{ count: number }[]>): Promise<number> =>
  (await rows)[0]?.count ?? 0;

/**
 * Le premier instant du mois de `maintenant`, pour les quotas mensuels.
 *
 * Exporté pour être testé seul : c'est la seule partie du fichier qui décide
 * quelque chose sans toucher la base, et une borne de mois fausse déplacerait
 * silencieusement un plafond d'un mois sur l'autre.
 */
export function debutDuMois(maintenant: Date): Date {
  const d = new Date(maintenant);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ⚠️ CETTE TABLE EST EXHAUSTIVE PAR CONSTRUCTION : elle est typée
 * `Record<keyof PlanLimits, …>`. Ajouter une limite à `PlanLimits` sans lui
 * donner sa ligne ici ne compile pas. C'est le remplacement du `default:
 * return 0` — le trou n'a plus de trappe où tomber.
 *
 * `null` = ressource NON comptable. Ce n'est pas un oubli, c'est une
 * déclaration : ces trois-là n'ont pas de compteur au sens d'une ligne en base
 * (un volume de stockage, un compteur d'alertes vivantes, un quota réservé à
 * un mode abandonné). Aucune route ne les déclare comme `limit` — et un banc
 * l'exige.
 */
export const COMPTEURS: Record<keyof PlanLimits, Compteur | null> = {
  ruchers: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(ruchers)
        .where(eq(ruchers.userId, userId)),
    ),

  // Les colonies mortes, vendues ou fusionnées ne pèsent pas sur le plafond :
  // l'apiculteur ne les conduit plus, il les archive.
  ruches: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(ruches)
        .where(
          and(
            eq(ruches.userId, userId),
            sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
          ),
        ),
    ),

  clients: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(clients)
        .where(eq(clients.userId, userId)),
    ),

  facturesParMois: (exec, userId, maintenant) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            gte(transactions.createdAt, debutDuMois(maintenant)),
          ),
        ),
    ),

  // Les invitations en attente comptent : sinon on en crée une infinité sans
  // jamais toucher le quota, et le plafond ne veut plus rien dire.
  membresEquipe: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(membres)
        .where(
          and(eq(membres.ownerId, userId), sql`${membres.statut} IN ('acceptee', 'en_attente')`),
        ),
    ),

  templatesIntervention: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(templatesIntervention)
        .where(eq(templatesIntervention.userId, userId)),
    ),

  balances: (exec, userId) =>
    un(
      exec
        .select({ count: sql<number>`count(*)::int` })
        .from(balances)
        .where(eq(balances.userId, userId)),
    ),

  // ── Non comptables, et c'est une décision, pas un oubli ──────────────────
  /** Un volume de fichiers, pas un nombre de lignes. */
  photosStorageMb: null,
  /** Le nombre d'alertes vivantes se déduit d'un calcul, pas d'un `count`. */
  alertesActives: null,
  /** Quota réservé à un mode Claude abandonné — le produit est déterministe. */
  iaQuestionsParMois: null,
};

/**
 * Combien l'apiculteur en a aujourd'hui, ou `null` si la ressource n'est pas
 * comptable.
 *
 * ⚠️ `null` NE VEUT PAS DIRE ZÉRO. L'appelant doit décider — et la seule
 * décision honnête, devant une porte qu'on ne sait pas mesurer, est de ne pas
 * écrire. `maintenant` est injectable pour que les quotas mensuels se testent.
 */
export async function compterRessource(
  exec: Executeur,
  userId: string,
  limite: keyof PlanLimits,
  maintenant: Date = new Date(),
): Promise<number | null> {
  const compteur = COMPTEURS[limite];
  return compteur ? compteur(exec, userId, maintenant) : null;
}
