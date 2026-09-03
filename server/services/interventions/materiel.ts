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
  const updated: HandlerResult['updated'] = [];

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

    /**
     * Side-effect : mettre à jour les compteurs de la ruche.
     *
     * ⚠️ ET LE DÉCLARER. Cette écriture n'était mentionnée nulle part dans le
     * retour du gestionnaire : dicter « j'ai posé une hausse sur la ruche 3 »
     * changeait bien `nombre_hausses` en base, et la fiche de la ruche gardait
     * son ancien compte — sans que rien ne le dise. `evenementsDuHandler` lit
     * ce que le gestionnaire DÉCLARE ; une écriture tue est invisible.
     */
    if (el.element === 'cadres' || el.element === 'cadres_male') {
      await tx
        .update(ruches)
        .set({ nombreCadres: sql`COALESCE(nombre_cadres, 0) + ${el.quantite}` })
        .where(sql`id = ${ctx.rucheId}`);
      updated.push({
        table: 'ruches',
        id: ctx.rucheId,
        changes: { nombreCadres: `+${el.quantite}` },
      });
    } else if (el.element === 'hausses') {
      await tx
        .update(ruches)
        .set({ nombreHausses: sql`COALESCE(nombre_hausses, 0) + ${el.quantite}` })
        .where(sql`id = ${ctx.rucheId}`);
      updated.push({
        table: 'ruches',
        id: ctx.rucheId,
        changes: { nombreHausses: `+${el.quantite}` },
      });
    }
  }

  return { type: 'materiel', created, updated };
}
