import { eq } from 'drizzle-orm';
import { deplacementsRuches, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { deplacementSchema } from '~~/server/utils/validation/interventions';

type DeplacementData = z.infer<typeof deplacementSchema>;

/**
 * Handler Déplacement — Déplace une ruche vers un autre rucher
 * Side-effect : UPDATE ruches.rucher_id
 */
export async function handleDeplacement(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as DeplacementData;

  const rows = await tx
    .insert(deplacementsRuches)
    .values({
      userId: ctx.userId,
      rucheId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      rucherSourceId: ctx.rucherId,
      rucherDestinationId: data.rucherDestinationId,
      dateDeplacement: new Date(),
      motif: 'reorganisation',
    })
    .returning({ id: deplacementsRuches.id });
  const row = rows[0]!;

  // Side-effect : mettre à jour le rucher de la ruche
  await tx
    .update(ruches)
    .set({ rucherId: data.rucherDestinationId })
    .where(eq(ruches.id, ctx.rucheId));

  return {
    type: 'deplacement',
    created: [{ table: 'deplacements_ruches', id: row.id }],
    updated: [
      { table: 'ruches', id: ctx.rucheId, changes: { rucherId: data.rucherDestinationId } },
    ],
  };
}
