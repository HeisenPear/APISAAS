import { and, desc, eq, lt } from 'drizzle-orm';
import { pesees, interventions } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { createAlerte } from '~~/server/utils/alertes';
import type { z } from 'zod';
import type { peseeSchema } from '~~/server/utils/validation/interventions';

type PeseeData = z.infer<typeof peseeSchema>;

/**
 * Handler Pesée — Enregistre le poids avec calcul de variation
 * Alerte : perte > 2 kg (moyenne)
 */
export async function handlePesee(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as PeseeData;
  const alerts: HandlerResult['alerts'] = [];

  // Dernière pesée ANTÉRIEURE par date de MESURE (dateVisite de l'intervention liée),
  // et non par date d'insertion : une pesée saisie après coup ne doit pas fausser la
  // variation (l'alerte « perte > 2 kg » se déclenchait/ratait à tort).
  const refDate = ctx.dateVisite ? new Date(ctx.dateVisite) : new Date();
  const lastPesee = await tx
    .select({ poidsKg: pesees.poidsKg })
    .from(pesees)
    .innerJoin(interventions, eq(pesees.inspectionId, interventions.id))
    .where(and(eq(pesees.rucheId, ctx.rucheId), lt(interventions.dateVisite, refDate)))
    .orderBy(desc(interventions.dateVisite))
    .limit(1);

  let variationKg: number | null = null;
  if (lastPesee.length > 0) {
    variationKg = data.poidsKg - Number(lastPesee[0]!.poidsKg);
  }

  const rows = await tx
    .insert(pesees)
    .values({
      userId: ctx.userId,
      rucheId: ctx.rucheId,
      inspectionId: ctx.inspectionId,
      poidsKg: String(data.poidsKg),
      typePesee: data.typePesee,
      variationKg: variationKg !== null ? String(variationKg) : null,
    })
    .returning({ id: pesees.id });
  const row = rows[0]!;

  // Alerte si perte > 2 kg
  if (variationKg !== null && variationKg < -2) {
    await createAlerte(tx, {
      userId: ctx.userId,
      type: 'perte_poids',
      titre: 'Perte de poids importante',
      message: `Perte de ${Math.abs(variationKg).toFixed(1)} kg détectée. Vérifier la colonie.`,
      priorite: 'moyenne',
      referenceType: 'ruche',
      referenceId: ctx.rucheId,
      actionUrl: `/ruches/${ctx.rucheId}`,
    });
    alerts.push({
      type: 'perte_poids',
      titre: 'Perte de poids importante',
      message: `${variationKg.toFixed(1)} kg`,
      priorite: 'moyenne',
    });
  }

  return {
    type: 'pesee',
    created: [{ table: 'pesees', id: row.id }],
    alerts,
  };
}
