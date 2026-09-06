import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, signalementsAbus } from '~~/server/database/schema';
import { recomputerMessage, recomputerTortsAuteur } from '~~/server/utils/forumSignalement';
import { uuidSchema } from '~~/server/utils/validators';

const bodySchema = z.object({
  /**
   * `retenu` : le signalement avait raison — le message reste masqué, et son
   * signaleur ne paie rien.
   * `retabli` : le signalement avait tort — le message redevient visible, et
   * c'est CE cas, et lui seul, qui compte un tort à son auteur.
   */
  arbitrage: z.enum(['retenu', 'retabli']),
});

/**
 * POST /api/admin/forum/signalements/[id]/arbitrer — tranche un signalement.
 *
 * ⚠️ `retabli` A DEUX EFFETS, ET LES OUBLIER SÉPARÉMENT DONNE DEUX DÉFAUTS
 * DIFFÉRENTS. Il faut que le message REDEVIENNE VISIBLE (sinon l'arbitrage ne
 * change rien pour l'apiculteur injustement masqué) et que le tort SOIT COMPTÉ
 * (sinon la suspension est inatteignable et le signaleur abusif continue).
 * Les deux passent par un recompte, jamais par une écriture directe.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, bodySchema.parse);

  /**
   * Le contrôle EST le `where` : un seul ordre, conditionnel. `returning` dit
   * si la ligne existait — pas besoin d'un `select` préalable qui pourrait
   * devenir faux entre les deux.
   */
  const [arbitre] = await db
    .update(signalementsAbus)
    .set({ arbitrage: body.arbitrage })
    .where(eq(signalementsAbus.id, id))
    .returning({
      messageId: signalementsAbus.messageId,
      signaleurId: signalementsAbus.auteurId,
    });

  if (!arbitre) {
    throw createError({ statusCode: 404, message: 'Ce signalement n’existe pas.' });
  }

  /**
   * ⚠️ UN SIGNALEMENT RÉTABLI SORT DU COMPTE DU MESSAGE. Sans cette
   * suppression, `recomputerMessage` recompterait la ligne rétablie et le
   * message resterait masqué : l'arbitrage aurait été rendu, écrit, affiché
   * dans la file — et n'aurait rien changé à ce que voit le lecteur. C'est le
   * défaut le plus probable de cette route, parce qu'il ne se voit pas depuis
   * l'écran d'administration, seulement depuis le forum public.
   *
   * On ne supprime pas la LIGNE — elle porte le tort de son auteur, que
   * `recomputerTortsAuteur` relit. C'est `recomputerMessage` qui l'exclut du
   * dénombrement (`ne(arbitrage, 'retabli')`) : retirée du compte, gardée au
   * dossier.
   */
  const signalements = await recomputerMessage(arbitre.messageId);
  const torts =
    body.arbitrage === 'retabli' ? await recomputerTortsAuteur(arbitre.signaleurId) : null;

  const [message] = await db
    .select({ statut: messagesForum.statut })
    .from(messagesForum)
    .where(eq(messagesForum.id, arbitre.messageId))
    .limit(1);

  return { data: { signalements, statut: message?.statut ?? null, tortsDuSignaleur: torts } };
});
