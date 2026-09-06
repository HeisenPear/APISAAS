import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { alertes, messagesForum, profils, sujetsForum } from '~~/server/database/schema';
import { TYPE_FORUM_REPONSE, categorieDeType } from '~~/server/utils/alertesCategories';

// ═══════════════════════════════════════════════════════════════════════════
// PRÉVENIR QU'ON A RÉPONDU — sans que le forum devienne du harcèlement.
//
// Un forum où personne n'apprend qu'on lui a répondu se vide : la question
// reste sans retour visible, l'auteur ne revient pas, et le fil meurt avec une
// réponse que personne n'a lue.
//
// ─── TROIS RÈGLES, ET CHACUNE FERME UN DÉFAUT PRÉCIS ──────────────────────
//
// 1. JAMAIS POUR SON PROPRE MESSAGE. Sans ça, répondre à son propre fil se
//    notifie soi-même — le premier réflexe de quiconque complète sa question.
//
// 2. UNE PAR FIL ET PAR JOUR, PAS UNE PAR RÉPONSE. Un fil vivant reçoit dix
//    messages dans l'après-midi : dix notifications pour la même conversation
//    font désinstaller l'application, pas revenir au forum.
//
// 3. SEULEMENT SI LE COMPTE LE VEUT. La catégorie `communaute` est un
//    interrupteur des réglages ; on le lit AVANT d'écrire l'alerte, et non
//    après. Écrire puis filtrer à l'affichage laisserait la pastille de
//    notification s'allumer pour quelqu'un qui a explicitement coupé.
// ═══════════════════════════════════════════════════════════════════════════

/** Fenêtre d'anti-répétition : une alerte par fil et par tranche de 24 h. */
const FENETRE_MS = 24 * 3600 * 1000;

/**
 * Prévient l'auteur d'un sujet qu'on y a répondu.
 *
 * Rend `true` si une alerte a été ÉCRITE — mesuré, pas promis. Une fonction qui
 * ne rend rien ne peut pas être prise en défaut par un banc : « on a prévenu »
 * doit se vérifier, pas se croire.
 *
 * ⚠️ NE LÈVE JAMAIS. Prévenir est un service rendu APRÈS coup ; si l'alerte
 * échoue, le message a été publié et doit le rester. Une notification ratée est
 * un désagrément, une réponse perdue est une trahison.
 */
export async function notifierReponseAuSujet(
  sujetId: string,
  auteurDuMessageId: string,
  maintenant: Date,
): Promise<boolean> {
  try {
    const [sujet] = await db
      .select({
        id: sujetsForum.id,
        titre: sujetsForum.titre,
        slug: sujetsForum.slug,
        auteurId: sujetsForum.auteurId,
        statut: sujetsForum.statut,
      })
      .from(sujetsForum)
      .where(eq(sujetsForum.id, sujetId))
      .limit(1);

    if (!sujet || sujet.statut !== 'visible') return false;

    // ── 1. Jamais pour son propre message ──────────────────────────────────
    if (sujet.auteurId === auteurDuMessageId) return false;

    // ── 3. Seulement si le compte le veut ──────────────────────────────────
    const [profil] = await db
      .select({ prefs: profils.pushNotifPrefs })
      .from(profils)
      .where(eq(profils.id, sujet.auteurId))
      .limit(1);

    /**
     * ⚠️ LA CATÉGORIE SE DÉRIVE DU TYPE, elle ne se nomme pas en dur. Écrire
     * `'communaute'` ici en ferait une seconde source de vérité, à tenir
     * d'accord avec `CATEGORIE_PAR_TYPE` — et c'est le genre d'accord qui se
     * défait sans bruit. Si le type changeait de catégorie, ce filtre suivrait.
     */
    const categorie = categorieDeType(TYPE_FORUM_REPONSE);
    const prefs = (profil?.prefs ?? {}) as Record<string, unknown>;
    /**
     * ⚠️ `!== false` ET NON `=== true`. Les préférences sont un JSON qui n'a
     * pas forcément la clé : un compte créé avant cette catégorie n'a rien
     * d'écrit pour elle. Exiger `true` aurait privé de notification TOUS les
     * comptes existants, en silence, et personne n'aurait su pourquoi le forum
     * ne réveille personne. L'absence de choix vaut le défaut, et le défaut est
     * `CATEGORIES_DEFAUT.communaute`.
     */
    if (prefs[categorie] === false) return false;

    // ── 2. Une par fil et par jour ─────────────────────────────────────────
    const depuis = new Date(maintenant.getTime() - FENETRE_MS);
    const [{ n } = { n: 0 }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(alertes)
      .where(
        and(
          eq(alertes.userId, sujet.auteurId),
          eq(alertes.type, TYPE_FORUM_REPONSE),
          eq(alertes.referenceId, sujet.id),
          gte(alertes.createdAt, depuis),
        ),
      );
    if (n > 0) return false;

    // Combien de réponses d'AUTRES personnes : « 3 réponses », pas « 1 ».
    const [{ reponses } = { reponses: 1 }] = await db
      .select({ reponses: sql<number>`count(*)::int` })
      .from(messagesForum)
      .where(
        and(
          eq(messagesForum.sujetId, sujet.id),
          ne(messagesForum.auteurId, sujet.auteurId),
          eq(messagesForum.statut, 'visible'),
        ),
      );

    await db.insert(alertes).values({
      userId: sujet.auteurId,
      type: TYPE_FORUM_REPONSE,
      titre: 'On a répondu à votre sujet',
      message:
        reponses > 1
          ? `« ${sujet.titre} » a ${reponses} réponses.`
          : `« ${sujet.titre} » a une première réponse.`,
      /**
       * ⚠️ PRIORITÉ BASSE, ET C'EST UN ENGAGEMENT. Une réponse de forum n'est
       * pas une colonie qui meurt. La priorité gouverne le push et le résumé du
       * matin : la monter mettrait une conversation au même rang qu'une alerte
       * sanitaire, et c'est ainsi qu'on apprend à ignorer les deux.
       */
      priorite: 'basse',
      referenceType: 'sujet_forum',
      referenceId: sujet.id,
      actionUrl: `/forum/${sujet.slug}`,
    });

    return true;
  } catch {
    /**
     * Le message est publié ; l'alerte, non. On ne relance pas : la route
     * appelante répondrait une erreur pour une réponse qui, elle, est bien
     * enregistrée — et l'apiculteur la réécrirait.
     */
    return false;
  }
}
