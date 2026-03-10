import { eq } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import type { z } from 'zod';
import type { controleSchema } from '~~/server/utils/validation/interventions';

type ControleData = z.infer<typeof controleSchema>;

/**
 * Handler Contrôle — Met à jour les colonnes directes de la table interventions
 * Alertes : cellules royales (haute), force <= 1 (haute)
 */
export async function handleControle(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as ControleData;
  const alerts: HandlerResult['alerts'] = [];

  await tx
    .update(interventions)
    .set({
      reineVue: data.reineVue,
      couvainPresent: data.couvainPresent,
      // Map booleans to 1-5 scale for computeScore
      couvain: data.couvainPresent == null ? null : data.couvainPresent ? 4 : 1,
      celluleRoyale: data.celluleRoyale,
      reserves: data.reserves == null ? null : data.reserves ? 4 : 1,
      forceColonie: data.forceColonie,
      comportement: data.comportement,
    })
    .where(eq(interventions.id, ctx.inspectionId));

  // Alertes automatiques
  if (data.celluleRoyale === true) {
    await createAlerte(tx, {
      userId: ctx.userId,
      type: 'cellule_royale',
      titre: 'Cellules royales détectées',
      message: "Des cellules royales ont été observées. Risque d'essaimage imminent.",
      priorite: 'haute',
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: 'cellule_royale',
      titre: 'Cellules royales détectées',
      message: "Risque d'essaimage imminent",
      priorite: 'haute',
    });
  }

  if (data.forceColonie <= 1) {
    await createAlerte(tx, {
      userId: ctx.userId,
      type: 'colonie_faible',
      titre: 'Colonie très faible',
      message: `Force colonie évaluée à ${data.forceColonie}/4. Intervention urgente recommandée.`,
      priorite: 'haute',
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: 'colonie_faible',
      titre: 'Colonie très faible',
      message: `Force ${data.forceColonie}/4`,
      priorite: 'haute',
    });
  }

  return {
    type: 'controle',
    updated: [{ table: 'interventions', id: ctx.inspectionId, changes: data }],
    alerts,
  };
}
