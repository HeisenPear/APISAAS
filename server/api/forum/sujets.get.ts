import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { profils, sujetsForum } from '~~/server/database/schema';
import { pseudonymeForum } from '~~/app/utils/forumPseudonyme';

/**
 * GET /api/forum/sujets — la liste des fils. LECTURE PUBLIQUE, sans session.
 *
 * ⚠️ PAS DE `requireAuth`, ET C'EST DÉLIBÉRÉ. Un forum d'entraide qui ne se lit
 * qu'une fois connecté n'apporte rien à personne : il n'est pas indexé, on ne
 * peut pas y renvoyer quelqu'un par un lien, et la question qu'un apiculteur
 * vient de se poser reste introuvable. L'écriture, elle, reste réservée aux
 * comptes — c'est là que se joue la modération.
 *
 * ⚠️ ET DONC : AUCUNE DONNÉE DE COMPTE NE SORT D'ICI. La projection est
 * explicite, colonne par colonne ; l'auteur passe par `pseudonymeForum`, jamais
 * par un `select()` complet qui embarquerait l'e-mail, le SIRET et l'adresse du
 * profil. Une projection large sur une route publique est une fuite qui ne fait
 * pas de bruit.
 */
const querySchema = z.object({
  limite: z.coerce.number().int().min(1).max(50).default(30),
  page: z.coerce.number().int().min(0).default(0),
});

export default defineEventHandler(async (event) => {
  const { limite, page } = await getValidatedQuery(event, querySchema.parse);

  const lignes = await db
    .select({
      id: sujetsForum.id,
      titre: sujetsForum.titre,
      slug: sujetsForum.slug,
      messages: sujetsForum.messages,
      dernierMessageLe: sujetsForum.dernierMessageLe,
      createdAt: sujetsForum.createdAt,
      auteurId: sujetsForum.auteurId,
      auteurPrenom: profils.prenom,
      auteurNom: profils.nom,
    })
    .from(sujetsForum)
    .innerJoin(profils, eq(sujetsForum.auteurId, profils.id))
    /**
     * Un sujet masqué ou supprimé quitte la liste. Contrairement aux MESSAGES,
     * on ne garde pas sa place : un fil n'a pas de suite qui le citerait, donc
     * rien ne devient incompréhensible en son absence.
     */
    .where(eq(sujetsForum.statut, 'visible'))
    // Le dernier message d'abord ; un fil neuf n'en a pas encore, d'où le repli
    // sur sa création — sinon il naîtrait en bas de liste et personne ne le
    // verrait jamais.
    .orderBy(desc(sql`coalesce(${sujetsForum.dernierMessageLe}, ${sujetsForum.createdAt})`))
    .limit(limite)
    .offset(page * limite);

  const [total] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sujetsForum)
    .where(eq(sujetsForum.statut, 'visible'));

  return {
    data: lignes.map((l) => ({
      id: l.id,
      titre: l.titre,
      slug: l.slug,
      messages: l.messages,
      dernierMessageLe: l.dernierMessageLe,
      createdAt: l.createdAt,
      auteur: pseudonymeForum({ id: l.auteurId, prenom: l.auteurPrenom, nom: l.auteurNom }),
    })),
    total: total?.n ?? 0,
  };
});
