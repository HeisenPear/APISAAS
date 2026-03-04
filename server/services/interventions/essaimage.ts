import { eq } from 'drizzle-orm';
import { essaimages, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { essaimageSchema } from '~~/server/utils/validation/interventions';

type EssaimageData = z.infer<typeof essaimageSchema>;

/**
 * Handler Essaimage — Enregistre un essaimage naturel
 * Side-effect : si non récupéré → ruche.statut = 'essaimee'
 */
export async function handleEssaimage(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as EssaimageData;

  const rows = await tx
    .insert(essaimages)
    .values({
      userId: ctx.userId,
      rucheSourceId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      dateEssaimage: new Date(),
      essaimRecupere: data.essaimRecupere,
    })
    .returning({ id: essaimages.id });
  const row = rows[0]!;

  const result: HandlerResult = {
    type: 'essaimage',
    created: [{ table: 'essaimages', id: row.id }],
  };

  // Si l'essaim n'a pas été récupéré, marquer la ruche comme essaimée
  if (!data.essaimRecupere) {
    await tx.update(ruches).set({ statut: 'essaimee' }).where(eq(ruches.id, ctx.rucheId));

    result.updated = [{ table: 'ruches', id: ctx.rucheId, changes: { statut: 'essaimee' } }];
  }

  return result;
}
