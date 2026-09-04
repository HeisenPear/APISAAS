import { eq, and, ne, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { signalementsFrelon, votesFrelon } from '~~/server/database/schema';
import { PEREMPTION_JOURS } from '~~/app/utils/frelonFiabilite';

/**
 * GET /api/frelon — carte COMMUNAUTAIRE (cross-tenant) des signalements de
 * frelons non rejetés. Auteur ANONYMISÉ (jamais exposé) ; on renvoie seulement
 * `estMien` (= signalement de l'utilisateur courant) et `monVote`.
 *
 * ─── LA PÉREMPTION SE JOUE ICI, ET NULLE PART AILLEURS ────────────────────
 *
 * Un signalement sur lequel plus personne ne donne de nouvelles quitte la
 * carte. C'est une PROPRIÉTÉ DU TEMPS, calculée à la lecture — pas un état
 * gravé en base, pas un statut de plus, pas une tâche planifiée. Trois raisons,
 * chacune payée ailleurs dans ce dépôt :
 *
 * · un cinquième statut serait compté ACTIF — `estActif()` ne rejette que
 *   `detruit` et `rejete` — donc un nid réputé disparu déclencherait un
 *   bandeau d'ALERTE DE PROXIMITÉ, l'inverse exact de l'effet recherché ;
 * · une colonne matérialisée aurait demandé de jouer du SQL sur la base de
 *   PRODUCTION avant même de pouvoir essayer la correction en préversion ;
 * · un cron quotidien n'aurait rien apporté de plus — la péremption est à
 *   l'échelle du mois — et une tâche qui ne tourne pas laisse la carte mentir
 *   sans que personne ne le sache.
 *
 * ⚠️ RIEN N'EST SUPPRIMÉ. Le signalement reste en base, et il redevient visible
 * dès qu'on lui redonne signe de vie : le confirmer d'un clic, ou simplement le
 * re-signaler à moins de 150 m — `index.post.ts` en fait alors un vote
 * `confirme`. On n'efface pas une information, on cesse d'afficher une
 * information que plus personne ne soutient.
 */
/**
 * LA REQUÊTE DE LA CARTE, EXPORTÉE — pour qu'un banc puisse en lire le SQL.
 *
 * ⚠️ ELLE EST EXPORTÉE PLUTÔT QUE RECOPIÉE DANS LE BANC, ET ÇA VIENT DE SE
 * PAYER. Une requête Drizzle mal formée n'apparaît ni au `typecheck` (un
 * gabarit `sql` accepte n'importe quel texte) ni aux bancs d'unité (ils
 * doublent la base) : elle échoue à l'exécution, en production. Un banc qui
 * recopierait la requête mesurerait sa propre copie.
 *
 * Le premier jet le prouve : `from ${vote}` rendait `from "signe"` — l'ALIAS
 * seul, sans la table — donc `relation "signe" does not exist` à la première
 * ouverture de la carte. Rien ne l'aurait vu avant l'apiculteur.
 */
export function requeteCarteFrelon(userId: string) {
  /**
   * Le dernier signe de vie : la date la plus récente entre la création et la
   * dernière CONFIRMATION. Seules les confirmations comptent — une infirmation
   * dit « il n'y est pas », une destruction est terminale.
   *
   * ⚠️ LA SOUS-REQUÊTE PORTE UN ALIAS. `votes_frelon` est DÉJÀ jointe plus bas
   * (pour `monVote`) : sans alias, la corrélation viserait la ligne jointe —
   * le vote de l'utilisateur courant — au lieu de toutes les confirmations.
   * Les colonnes viennent du schéma, jamais d'un `v.created_at` écrit à la
   * main qui survivrait à un renommage jusqu'à l'exécution.
   */
  /**
   * ⚠️ LA DATE D'OBSERVATION EST UN SIGNE DE VIE, ET C'EST LA SEULE PORTE DE
   * L'AUTEUR. Il ne peut pas voter son propre signalement (anti-auto-validation,
   * juste sur le fond), et le re-signaler par-dessus ne posait aucun vote quand
   * le nid était le sien : sans elle, celui qui passe devant le nid chaque
   * semaine — presque toujours celui qui l'a signalé — n'avait AUCUN moyen de
   * dire « il est toujours là », et voyait son propre signalement disparaître
   * sans recours, avec son identifiant devenu inatteignable.
   *
   * `least(dateObservation, now())` la borne : elle est saisie librement, et
   * une date à venir rendrait le nid immortel. Le schéma la refuse déjà côté
   * écriture ; on ne s'en remet pas à une seule des deux gardes pour une donnée
   * qui décide de ce qui reste affiché.
   */
  const vote = alias(votesFrelon, 'signe');
  const signeDeVie = sql<Date>`greatest(
    ${signalementsFrelon.createdAt},
    least(${signalementsFrelon.dateObservation}, now()),
    coalesce(
      (select max(${vote.createdAt}) from ${votesFrelon} as ${sql.identifier('signe')}
        where ${vote.signalementId} = ${signalementsFrelon.id}
          and ${vote.vote} = 'confirme'),
      ${signalementsFrelon.createdAt}
    )
  )`;

  return db
    .select({
      id: signalementsFrelon.id,
      latitude: signalementsFrelon.latitude,
      longitude: signalementsFrelon.longitude,
      espece: signalementsFrelon.espece,
      type: signalementsFrelon.type,
      pression: signalementsFrelon.pression,
      statut: signalementsFrelon.statut,
      dateObservation: signalementsFrelon.dateObservation,
      commune: signalementsFrelon.commune,
      hauteurM: signalementsFrelon.hauteurM,
      notes: signalementsFrelon.notes,
      confirmations: signalementsFrelon.confirmations,
      infirmations: signalementsFrelon.infirmations,
      destructions: signalementsFrelon.destructions,
      scoreFiabilite: signalementsFrelon.scoreFiabilite,
      /**
       * ⚠️ RENVOYÉ AU CLIENT, ET C'EST TOUT L'INTÉRÊT. Sans cette date, l'écran
       * ne peut pas dire « sans nouvelles depuis deux mois » — donc l'apiculteur
       * ne voit pas venir la disparition et n'a aucune raison de confirmer le
       * nid qu'il croise pourtant chaque semaine.
       */
      dernierSigneDeVie: signeDeVie,
      estMien: sql<boolean>`${signalementsFrelon.auteurId} = ${userId}`,
      monVote: votesFrelon.vote,
    })
    .from(signalementsFrelon)
    .leftJoin(
      votesFrelon,
      and(eq(votesFrelon.signalementId, signalementsFrelon.id), eq(votesFrelon.userId, userId)),
    )
    .where(
      and(
        ne(signalementsFrelon.statut, 'rejete'),
        // La péremption, en SQL : le silence se mesure côté base pour que la
        // limite de 2000 lignes porte sur les signalements VIVANTS. Filtrer
        // après coup en JavaScript aurait tronqué la carte au profit de nids
        // morts, sans que rien ne le signale.
        sql`${signeDeVie} > now() - make_interval(days => ${PEREMPTION_JOURS})`,
      ),
    )
    .orderBy(desc(signalementsFrelon.dateObservation))
    .limit(2000);
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  return { data: await requeteCarteFrelon(user.id) };
});
