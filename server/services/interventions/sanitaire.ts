import { eq } from 'drizzle-orm';
import { evenementsSanitaires, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import type { z } from 'zod';
import type { sanitaireSchema } from '~~/server/utils/validation/interventions';

type SanitaireData = z.infer<typeof sanitaireSchema>;

/**
 * Handler Sanitaire — Mortalité, nettoyage, retrait couvain
 * Side-effect : essaim_mort → ruche.statut = 'morte'
 * Alerte : mortalité constatée (moyenne)
 */
export async function handleSanitaire(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as SanitaireData;
  const alerts: HandlerResult['alerts'] = [];

  const rows = await tx
    .insert(evenementsSanitaires)
    .values({
      userId: ctx.userId,
      rucheId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      typeEvenement: data.typeEvenement,
      causeProbable: data.causeProbable,
      dateConstat: new Date(),
      declarationGdsa: data.declarationGdsa,
      typeNettoyage: data.typeNettoyage,
      produitUtilise: data.produitUtilise,
      typeCouvain: data.typeCouvain,
      nombreCadres: data.nombreCadres,
    })
    .returning({ id: evenementsSanitaires.id });
  const row = rows[0]!;

  const result: HandlerResult = {
    type: 'sanitaire',
    created: [{ table: 'evenements_sanitaires', id: row.id }],
  };

  // Side-effect : essaim mort → statut morte
  if (data.typeEvenement === 'essaim_mort') {
    await tx.update(ruches).set({ statut: 'morte' }).where(eq(ruches.id, ctx.rucheId));

    result.updated = [{ table: 'ruches', id: ctx.rucheId, changes: { statut: 'morte' } }];

    await createAlerte(tx, {
      userId: ctx.userId,
      type: 'mortalite',
      titre: 'Mortalité constatée',
      message: `Essaim mort${data.causeProbable ? ` — cause probable : ${data.causeProbable}` : ''}.`,
      priorite: 'moyenne',
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: 'mortalite',
      titre: 'Mortalité constatée',
      message: data.causeProbable ?? 'Cause inconnue',
      priorite: 'moyenne',
    });
  }

  result.alerts = alerts;
  return result;
}
