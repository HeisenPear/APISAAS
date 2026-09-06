import { and, asc, eq, ne, sql } from 'drizzle-orm';
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
/**
 * ⚠️ LA PAGINATION D'UN FIL N'EST PAS CELLE D'UNE LISTE, ET LA DIFFÉRENCE EST
 * TOUT LE SUJET. Une liste de sujets se lit du plus récent au plus ancien, et
 * s'arrêter à la page 1 ne coûte rien : on a lu les plus récents. Une
 * CONVERSATION est ordonnée du premier au dernier — s'arrêter en cours de
 * route, c'est perdre les RÉPONSES, c'est-à-dire précisément ce qu'on venait
 * chercher.
 *
 * Le premier jet portait `.limit(500)` sans rien : au 501ᵉ message la fin du
 * fil disparaissait, sans erreur, sans compteur, sans bouton. Un fil vivant se
 * serait tu du jour au lendemain et personne n'aurait su pourquoi.
 */
const MESSAGES_PAR_PAGE = 100;

const querySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
});

export default defineEventHandler(async (event) => {
  const slug = z.string().min(1).max(200).parse(getRouterParam(event, 'slug'));
  const { page } = await getValidatedQuery(event, querySchema.parse);

  /**
   * ⚠️ FACULTATIVE, SUR UNE ROUTE PUBLIQUE. Un visiteur déconnecté lit le fil ;
   * un apiculteur connecté voit en plus lesquels de ces messages sont les
   * siens. `requireAuth` refuserait le premier — c'est-à-dire celui pour qui
   * cette page est publique.
   */
  const lecteur = await sessionFacultative(event);
  const lecteurId = lecteur?.id ?? null;

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
      modifieLe: messagesForum.modifieLe,
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
    .limit(MESSAGES_PAR_PAGE)
    .offset(page * MESSAGES_PAR_PAGE);

  /**
   * ⚠️ LE TOTAL SE COMPTE, IL NE SE DÉDUIT PAS DE LA PAGE. `lignes.length ===
   * MESSAGES_PAR_PAGE` ne dit pas « il y en a d'autres » : un fil de très
   * exactement 100 messages afficherait un bouton « voir la suite » qui ne
   * mène nulle part. Et `sujetsForum.messages` ne convient pas non plus — il
   * ne compte QUE les visibles, alors que le fil montre aussi les masqués.
   */
  const [total] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messagesForum)
    .where(and(eq(messagesForum.sujetId, sujet.id), ne(messagesForum.statut, 'supprime')));

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
      /** Ce que l'écran doit savoir pour ne JAMAIS tronquer en silence. */
      total: total?.n ?? 0,
      page,
      parPage: MESSAGES_PAR_PAGE,
      messages: lignes.map((l) => ({
        id: l.id,
        masque: l.statut === 'masque',
        contenu: l.statut === 'masque' ? TEXTE_MESSAGE_MASQUE : l.contenu,
        createdAt: l.createdAt,
        /**
         * ⚠️ « MODIFIÉ LE … » EST DÛ AU LECTEUR. Sur un forum, corriger un
         * message après que d'autres y ont répondu change le sens de leurs
         * réponses. Le dire n'est pas une punition pour l'auteur, c'est ce qui
         * rend le fil lisible pour ceux qui arrivent après.
         *
         * Un message MASQUÉ ne rend pas sa date de correction : son contenu ne
         * sort déjà pas, dire qu'il a été retouché n'apprendrait rien et
         * ajouterait une insinuation à une décision déjà prise.
         */
        modifieLe: l.statut === 'masque' ? null : l.modifieLe,
        /**
         * ⚠️ L'ÉCRAN DOIT SAVOIR CE QUI EST À LUI, ET IL NE PEUT PAS LE
         * DEVINER. L'auteur est réduit à un pseudonyme (deux personnes peuvent
         * porter « Camille D. ») : sans ce drapeau, la page afficherait le
         * bouton « modifier » sur les messages de tout le monde, et la route
         * refuserait — proposer puis refuser, exactement le défaut que
         * `EcranPropose` a été créé pour fermer.
         *
         * On rend un BOOLÉEN, jamais l'identifiant : cette route est publique,
         * et l'identifiant d'un compte n'a rien à y faire.
         */
        estMien: Boolean(lecteurId) && l.auteurId === lecteurId,
        auteur: pseudonymeForum({ id: l.auteurId, prenom: l.auteurPrenom, nom: l.auteurNom }),
      })),
    },
  };
});
