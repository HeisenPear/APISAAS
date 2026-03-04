import { eq } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { nourrissementSchema } from '~~/server/utils/validation/interventions';

type NourrissementData = z.infer<typeof nourrissementSchema>;

/**
 * Handler Nourrissement — Met à jour les colonnes nourrissement de interventions
 */
export async function handleNourrissement(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as NourrissementData;

  await tx
    .update(interventions)
    .set({
      nourrissementType: data.type,
      nourrissementQuantite: String(data.quantite),
      nourrissementUnite: data.unite,
    })
    .where(eq(interventions.id, ctx.inspectionId));

  return {
    type: 'nourrissement',
    updated: [{ table: 'interventions', id: ctx.inspectionId, changes: data }],
  };
}
