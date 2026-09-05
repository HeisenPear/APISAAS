import { and, asc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, profils, sujetsForum } from '~~/server/database/schema';
import { pseudonymeForum } from '~~/app/utils/forumPseudonyme';
import { TEXTE_MESSAGE_MASQUE } from '~~/app/config/forum';

/**
 * GET /api/forum/sujets/[slug] — un fil et ses messages. LECTURE PUBLIQUE.
 *
 * ⚠️ LE CONTENU D'UN MESSAGE MASQUÉ NE SORT PAS DE LA BASE. Il aurait été plus
 * simple de tout envoyer et de laisser l'écran cacher ce qui est masqué : c'est
 * exactement ce qu'il ne faut pas faire. Le texte serait alors dans la réponse
 * HTTP, dans le HTML rendu côté serveur, dans le cache du navigateur, et dans
 * l'index du moteur de recherche qui, lui, ne lit pas notre CSS. Un message
 * signalé pour insultes resterait donc parfaitement lisible — et indexé — pour
 * qui regarde la source de la page.
 *
 * Le masquage se fait ICI, à la projection, avant que quoi que ce soit ne parte.
 */
export default defineEventHandler(async (event) => {
  const slug = z.string().min(1).max(200).parse(getRouterParam(event, 'slug'));

  const [sujet] = await db
    .select({
      id: sujetsForum.id,
      titre: sujetsForum.titre,
      slug: sujetsForum.slug,
      statut: sujetsForum.statut,
      createdAt: sujetsForum.createdAt,
      auteurId: sujetsForum.auteurId,
      auteurPrenom: profils.prenom,
      auteurNom: profils.nom,
    })
    .from(sujetsForum)
    .innerJoin(profils, eq(sujetsForum.auteurId, profils.id))
    .where(eq(sujetsForum.slug, slug))
    .limit(1);

  /**
   * Un sujet masqué ou supprimé répond 404 — la même réponse qu'un slug
   * inconnu, délibérément. Distinguer les deux (« ce fil a été masqué »)
   * confirmerait publiquement l'existence et la sanction d'un fil dont on ne
   * peut plus lire le contenu : c'est une information sur quelqu'un d'autre,
   * donnée à qui devine une URL.
   */
  if (!sujet || sujet.statut !== 'visible') {
    throw createError({ statusCode: 404, message: 'Ce sujet n’existe pas ou plus.' });
  }

  const lignes = await db
    .select({
      id: messagesForum.id,
      contenu: messagesForum.contenu,
      statut: messagesForum.statut,
      createdAt: messagesForum.createdAt,
      auteurId: messagesForum.auteurId,
      auteurPrenom: profils.prenom,
      auteurNom: profils.nom,
    })
    .from(messagesForum)
    .innerJoin(profils, eq(messagesForum.auteurId, profils.id))
    .where(
      and(
        /**
         * ⚠️ CE FILTRE-CI EST TOUT LE FIL. Sans `sujetId`, la requête rend les
         * messages de TOUT le forum, dans l'ordre chronologique, sous le titre
         * de ce sujet — et rien n'aurait signalé l'erreur : la page se serait
         * affichée, pleine, cohérente, et fausse.
         */
        eq(messagesForum.sujetId, sujet.id),
        /**
         * ⚠️ LES MASQUÉS RESTENT DANS LE FIL, LES SUPPRIMÉS NON. Un trou
         * silencieux au milieu d'une conversation la rend incompréhensible :
         * les réponses qui suivent citent un message que plus personne ne voit.
         * On garde donc la place et on dit pourquoi. Un message SUPPRIMÉ, lui,
         * est un geste de son auteur : on ne laisse pas une pierre tombale à
         * quelqu'un qui a demandé à partir.
         */
        ne(messagesForum.statut, 'supprime'),
      ),
    )
    .orderBy(asc(messagesForum.createdAt))
    .limit(500);

  return {
    data: {
      id: sujet.id,
      titre: sujet.titre,
      slug: sujet.slug,
      createdAt: sujet.createdAt,
      auteur: pseudonymeForum({
        id: sujet.auteurId,
        prenom: sujet.auteurPrenom,
        nom: sujet.auteurNom,
      }),
      messages: lignes.map((l) => ({
        id: l.id,
        masque: l.statut === 'masque',
        contenu: l.statut === 'masque' ? TEXTE_MESSAGE_MASQUE : l.contenu,
        createdAt: l.createdAt,
        auteur: pseudonymeForum({ id: l.auteurId, prenom: l.auteurPrenom, nom: l.auteurNom }),
      })),
    },
  };
});
