import { eq, and, sql } from 'drizzle-orm';
import { transvasements, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { transvasementSchema } from '~~/server/utils/validation/interventions';

type TransvasementData = z.infer<typeof transvasementSchema>;

/**
 * Handler Transvasement — Transfère un essaim d'une ruche à une autre
 * Side-effects :
 * - Destination : +cadres transférés
 * - Source : statut selon devenirRucheSource, compteurs à 0
 */
export async function handleTransvasement(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as TransvasementData;

  const rows = await tx
    .insert(transvasements)
    .values({
      userId: ctx.userId,
      rucheSourceId: ctx.rucheId,
      rucheDestinationId: data.rucheDestinationId,
      inspectionId: ctx.inspectionId,
      cadresTransferes: data.cadresTransferes,
      devenirRucheSource: data.devenirRucheSource,
      lieuStockage: data.lieuStockage,
    })
    .returning({ id: transvasements.id });
  const row = rows[0]!;

  // La ruche de destination DOIT appartenir à l'espace, sinon on écrirait sur
  // la ruche d'un autre locataire (isolation 100% code-level — la RLS est
  // bypassée par la connexion service-role).
  const [dest] = await tx
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, data.rucheDestinationId), eq(ruches.userId, ctx.userId)))
    .limit(1);
  if (!dest) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Référence invalide',
      message: 'Ruche de destination introuvable dans votre espace.',
    });
  }

  // Destination : ajouter les cadres transférés
  await tx
    .update(ruches)
    .set({
      nombreCadres: sql`COALESCE(nombre_cadres, 0) + ${data.cadresTransferes}`,
    })
    .where(eq(ruches.id, data.rucheDestinationId));

  // Source : vider et marquer selon devenir
  const statutSource = data.devenirRucheSource === 'reutilisation_immediate' ? 'active' : 'vendue';
  await tx
    .update(ruches)
    .set({
      statut: statutSource,
      nombreCadres: 0,
      nombreHausses: 0,
    })
    .where(eq(ruches.id, ctx.rucheId));

  return {
    type: 'transvasement',
    created: [{ table: 'transvasements', id: row.id }],
    updated: [
      {
        table: 'ruches',
        id: data.rucheDestinationId,
        changes: { nombreCadres: `+${data.cadresTransferes}` },
      },
      {
        table: 'ruches',
        id: ctx.rucheId,
        changes: { statut: statutSource, nombreCadres: 0, nombreHausses: 0 },
      },
    ],
  };
}
