import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const bodySchema = z.object({
  contenu: z.string().trim().min(2).max(10_000),
});

/**
 * PUT /api/forum/messages/[id] — l'auteur corrige son propre message.
 *
 * ⚠️ SANS CETTE ROUTE, UNE FAUTE DE FRAPPE COÛTAIT LE FIL. Le seul recours
 * était de supprimer et de reposter — ce qui déplace le message à la fin de la
 * conversation, laisse les réponses qui le citaient pointer dans le vide, et
 * fait perdre au fil son ordre. Sur un forum, l'ordre EST le sens.
 *
 * ⚠️ LE `WHERE` EST LE CONTRÔLE, comme pour la suppression. Lire le message,
 * vérifier qu'il appartient à la personne, puis écrire par un second ordre
 * filtré sur le seul identifiant, c'est la forme qui a déjà laissé passer une
 * invitation révoquée entre les deux (`membres/accepter.post.ts`).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, bodySchema.parse);

  const [modifie] = await db
    .update(messagesForum)
    .set({ contenu: body.contenu, modifieLe: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(messagesForum.id, id),
        eq(messagesForum.auteurId, user.id),
        /**
         * ⚠️ UN MESSAGE MASQUÉ NE SE RÉÉCRIT PAS, ET C'EST LA MOITIÉ DE LA
         * MODÉRATION. Sans ce prédicat, quiconque voit son message masqué par
         * trois signalements le remplace par un texte anodin : l'arbitre
         * arriverait sur un contenu innocent, rétablirait le message, et
         * compterait un tort à chacun des trois signaleurs — qui avaient
         * raison. Trois personnes punies pour avoir bien signalé, et le
         * mécanisme de suspension retourné contre ceux qu'il protège.
         *
         * Un message supprimé ne se réécrit pas non plus : son auteur a
         * demandé à partir.
         */
        eq(messagesForum.statut, 'visible'),
      ),
    )
    .returning({ id: messagesForum.id, modifieLe: messagesForum.modifieLe });

  if (!modifie) {
    throw createError({
      statusCode: 404,
      message: 'Ce message n’existe pas, n’est pas le vôtre, ou a été masqué le temps d’être relu.',
    });
  }

  return { data: modifie };
});
