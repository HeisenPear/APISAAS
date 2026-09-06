import { eq } from 'drizzle-orm';
import { interventions } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import { alertesDuControle } from '~~/server/utils/alertesControle';
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

  /**
   * Les alertes du contrôle viennent d'une SEULE liste (`alertesDuControle`).
   *
   * ⚠️ Elles étaient écrites deux fois — une pour la base, une pour la bulle de
   * Maya — avec des titres et des messages recopiés à quelques mots près. Et
   * surtout : ces alertes vivent HORS du hub, ce qui rend un contrôle qui en
   * lève non défaisable. `annulationRegle` et `estActionAuto` interrogent
   * maintenant la même fonction, si bien que les trois ne peuvent plus diverger.
   */
  for (const alerte of alertesDuControle(data)) {
    await createAlerte(tx, {
      userId: ctx.userId,
      type: alerte.type,
      titre: alerte.titre,
      message: alerte.message,
      priorite: alerte.priorite,
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: alerte.type,
      titre: alerte.titre,
      message: alerte.resume,
      priorite: alerte.priorite,
    });
  }

  return {
    type: 'controle',
    updated: [{ table: 'interventions', id: ctx.inspectionId, changes: data }],
    alerts,
  };
}
