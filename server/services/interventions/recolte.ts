import { recoltes } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { recolteSchema } from '~~/server/utils/validation/interventions';

type RecolteData = z.infer<typeof recolteSchema>;

/**
 * Handler Récolte — Insère un enregistrement dans la table recoltes
 * Lié à l'intervention via inspection_id
 */
export async function handleRecolte(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as RecolteData;

  const rows = await tx
    .insert(recoltes)
    .values({
      userId: ctx.userId,
      rucherId: ctx.rucherId,
      rucheId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      dateRecolte: new Date(),
      typeProduit: data.typeProduit,
    })
    .returning({ id: recoltes.id });
  const row = rows[0]!;

  return {
    type: 'recolte',
    created: [{ table: 'recoltes', id: row.id }],
  };
}
