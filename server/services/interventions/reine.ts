import { eq } from 'drizzle-orm';
import { evenementsReine, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import type { z } from 'zod';
import type { reineSchema } from '~~/server/utils/validation/interventions';

type ReineData = z.infer<typeof reineSchema>;

/**
 * Handler Reine — Introduction, marquage, clipping, remplacement, perte
 * Alertes : perte reine → alerte critique, introduction → info
 */
export async function handleReine(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as ReineData;
  const created: HandlerResult['created'] = [];
  const alerts: HandlerResult['alerts'] = [];

  const rows = await tx
    .insert(evenementsReine)
    .values({
      userId: ctx.userId,
      rucheId: ctx.rucheId,
      interventionId: ctx.inspectionId,
      typeEvenement: data.typeEvenement,
      dateEvenement: new Date(data.dateEvenement ?? ctx.dateVisite ?? new Date().toISOString()),
      couleur: data.couleur ?? null,
      origine: data.origine ?? null,
      actionOrpheline: data.actionOrpheline ?? null,
      qualitePonte: data.qualitePonte ?? null,
      notes: data.notes ?? null,
    })
    .returning({ id: evenementsReine.id });

  const row = rows[0]!;
  created.push({ table: 'evenements_reine', id: row.id });

  // Mettre à jour les champs reine sur la ruche si fournis
  const updateData: Partial<typeof ruches.$inferInsert> = {};
  if (data.couleur) updateData.reineCouleur = data.couleur;
  if (data.origine) updateData.reineOrigine = data.origine;
  if (data.qualitePonte) updateData.reineQualitePonte = data.qualitePonte;
  if (data.typeEvenement === 'introduction' || data.typeEvenement === 'remplacement') {
    updateData.reinePresente = true;
    updateData.reineDateIntroduction = new Date(
      data.dateEvenement ?? ctx.dateVisite ?? new Date().toISOString(),
    );
  }
  if (data.typeEvenement === 'perte') {
    updateData.reinePresente = false;
  }

  if (Object.keys(updateData).length > 0) {
    await tx.update(ruches).set(updateData).where(eq(ruches.id, ctx.rucheId));
  }

  // Alertes
  if (data.typeEvenement === 'perte') {
    await createAlerte(tx, {
      userId: ctx.userId,
      type: 'reine_perdue',
      titre: 'Reine perdue',
      message: `La reine de la ruche a été perdue. Action requise.`,
      priorite: 'haute',
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: 'reine_perdue',
      titre: 'Reine perdue',
      message: 'Action requise : introduction ou fusion',
      priorite: 'haute',
    });
  }

  return { type: 'reine', created, alerts };
}
