import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { profils } from '~~/server/database/schema';
import { peutSignaler } from '~~/app/utils/forumModeration';
import { uuidSchema } from '~~/server/utils/validators';

const bodySchema = z.object({
  /**
   * `true` rend le droit de signaler, `false` le retire de nouveau.
   *
   * ⚠️ LES DEUX SENS, ET PAS SEULEMENT LA LEVÉE. Une levée accordée par erreur
   * — ou à quelqu'un qui recommence — devrait sinon se défaire en base à la
   * main. Une porte qui ne s'ouvre que dans un sens n'est pas une porte.
   */
  levee: z.boolean(),
});

/**
 * POST /api/admin/forum/suspensions/[id]/lever — rend (ou retire) le droit de
 * signaler. Admin uniquement.
 *
 * ⚠️ C'EST LA ROUTE QUI REND LA DÉCISION DE L'APICULTEUR APPLICABLE. Il a
 * choisi une suspension DÉFINITIVE, « jusqu'à ce que tu la lèves » : sans ce
 * geste, « définitif » voudrait dire « irréversible », ce qui n'est pas la même
 * chose et n'a pas été demandé. Le reste du forum peut attendre ; ceci, non.
 *
 * ⚠️ ON NE REMET PAS `forumSignalementsRetablis` À ZÉRO. Ce compteur est un
 * FAIT — trois arbitrages ont donné tort à ce compte — et il se recalcule
 * depuis la table des signalements (`recomputerTortsAuteur`). L'écraser ici
 * serait défait au prochain arbitrage, et l'administrateur perdrait
 * l'historique qui lui permet de juger une seconde demande. La levée dit « je
 * prends la responsabilité de ce compte », pas « ça n'a jamais existé ».
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, bodySchema.parse);

  const [profil] = await db
    .update(profils)
    .set({ forumSuspensionLevee: body.levee })
    .where(eq(profils.id, id))
    .returning({
      id: profils.id,
      email: profils.email,
      torts: profils.forumSignalementsRetablis,
      levee: profils.forumSuspensionLevee,
    });

  if (!profil) {
    throw createError({ statusCode: 404, message: 'Ce compte n’existe pas.' });
  }

  return {
    data: {
      ...profil,
      // La règle, appelée — pas une négation recopiée de `levee`.
      peutSignaler: peutSignaler({
        signalementsRetablis: profil.torts,
        suspensionLevee: profil.levee,
      }),
    },
  };
});
