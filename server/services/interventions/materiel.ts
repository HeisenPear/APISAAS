import { sql } from 'drizzle-orm';
import { mouvementsMateriel, ruches } from '~~/server/database/schema';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import type { z } from 'zod';
import type { materielSchema } from '~~/server/utils/validation/interventions';

type MaterielData = z.infer<typeof materielSchema>;

/**
 * Handler Matériel — Ajoute/retire du matériel sur une ruche
 * Side-effects : UPDATE ruches.nombre_cadres, nombre_hausses
 */
export async function handleMateriel(
  tx: DrizzleTransaction,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const data = ctx.donnees as MaterielData;
  const created: HandlerResult['created'] = [];

  for (const el of data.elements) {
    const rows = await tx
      .insert(mouvementsMateriel)
      .values({
        userId: ctx.userId,
        rucheId: ctx.rucheId,
        inspectionId: ctx.inspectionId,
        action: 'ajout',
        element: el.element,
        quantite: el.quantite,
      })
      .returning({ id: mouvementsMateriel.id });
    const row = rows[0]!;

    created.push({ table: 'mouvements_materiel', id: row.id });

    // Side-effect : mettre à jour les compteurs de la ruche
    if (el.element === 'cadres' || el.element === 'cadres_male') {
      await tx
        .update(ruches)
        .set({ nombreCadres: sql`COALESCE(nombre_cadres, 0) + ${el.quantite}` })
        .where(sql`id = ${ctx.rucheId}`);
    } else if (el.element === 'hausses') {
      await tx
        .update(ruches)
        .set({ nombreHausses: sql`COALESCE(nombre_hausses, 0) + ${el.quantite}` })
        .where(sql`id = ${ctx.rucheId}`);
    }
  }

  return { type: 'materiel', created };
}
