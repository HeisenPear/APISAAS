import { eq, sql } from 'drizzle-orm';
import { empilements, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { empilementSchema } from '~~/server/utils/validation/interventions';

type EmpilementData = z.infer<typeof empilementSchema>;

/**
 * Handler Empilement — Fusionne deux colonies
 * Side-effects :
 * - Destination : +cadres, +hausses de la source
 * - Source : statut 'fusionnee', compteurs à 0
 */
export async function handleEmpilement(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as EmpilementData;

  // Récupérer les compteurs de la ruche source
  const sourceRows = await tx
    .select({ nombreCadres: ruches.nombreCadres, nombreHausses: ruches.nombreHausses })
    .from(ruches)
    .where(eq(ruches.id, ctx.rucheId))
    .limit(1);
  const source = sourceRows[0]!;

  const cadresSource = source.nombreCadres ?? 0;
  const haussesSource = source.nombreHausses ?? 0;

  const rows = await tx
    .insert(empilements)
    .values({
      userId: ctx.userId,
      rucheSourceId: ctx.rucheId,
      rucheDestinationId: data.rucheDestinationId,
      inspectionId: ctx.inspectionId,
    })
    .returning({ id: empilements.id });
  const row = rows[0]!;

  // Destination : ajouter les cadres et hausses de la source
  await tx
    .update(ruches)
    .set({
      nombreCadres: sql`COALESCE(nombre_cadres, 0) + ${cadresSource}`,
      nombreHausses: sql`COALESCE(nombre_hausses, 0) + ${haussesSource}`,
    })
    .where(eq(ruches.id, data.rucheDestinationId));

  // Source : marquer comme fusionnée, compteurs à 0
  await tx
    .update(ruches)
    .set({
      statut: 'fusionnee',
      nombreCadres: 0,
      nombreHausses: 0,
    })
    .where(eq(ruches.id, ctx.rucheId));

  return {
    type: 'empilement',
    created: [{ table: 'empilements', id: row.id }],
    updated: [
      {
        table: 'ruches',
        id: data.rucheDestinationId,
        changes: { nombreCadres: `+${cadresSource}`, nombreHausses: `+${haussesSource}` },
      },
      {
        table: 'ruches',
        id: ctx.rucheId,
        changes: { statut: 'fusionnee', nombreCadres: 0, nombreHausses: 0 },
      },
    ],
  };
}
