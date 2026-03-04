import { eq } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { commentaireSchema } from '~~/server/utils/validation/interventions';

type CommentaireData = z.infer<typeof commentaireSchema>;

/**
 * Handler Commentaire — Met à jour interventions.notes
 */
export async function handleCommentaire(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as CommentaireData;

  await tx
    .update(interventions)
    .set({ notes: data.texte })
    .where(eq(interventions.id, ctx.inspectionId));

  return {
    type: 'commentaire',
    updated: [{ table: 'interventions', id: ctx.inspectionId, changes: { notes: data.texte } }],
  };
}
