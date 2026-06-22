import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { testsPerformance, reinesElevage } from '~~/server/database/schema';
import { computeSelectionIndex } from '~~/app/utils/selectionReines';

const schema = z.object({
  reineId: z.string().uuid(),
  saison: z.coerce.number().int().min(2000).max(2100),
  productiviteMielKg: z.coerce.number().min(0).nullable().optional(),
  douceur: z.coerce.number().int().min(1).max(10).nullable().optional(),
  tenueCadre: z.coerce.number().int().min(1).max(10).nullable().optional(),
  hygienismePinTestPct: z.coerce.number().int().min(0).max(100).nullable().optional(),
  resistanceVarroaPctInfestation: z.coerce.number().min(0).max(100).nullable().optional(),
  tendanceEssaimage: z.coerce.number().int().min(1).max(10).nullable().optional(),
  hivernage: z.coerce.number().int().min(1).max(10).nullable().optional(),
  vigueurPrintemps: z.coerce.number().int().min(1).max(10).nullable().optional(),
  ponteQualite: z.coerce.number().int().min(1).max(10).nullable().optional(),
  indexComposite: z.coerce.number().min(0).max(100).nullable().optional(),
  observations: z.string().max(2000).trim().optional(),
  dateEvaluation: z.string().datetime(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  // Verify reine belongs to user
  const [reine] = await db
    .select({ id: reinesElevage.id })
    .from(reinesElevage)
    .where(and(eq(reinesElevage.id, body.reineId), eq(reinesElevage.userId, user.id)))
    .limit(1);
  if (!reine) notFound('Reine introuvable');

  // Index de sélection calculé objectivement à partir des traits saisis.
  // Prioritaire sur l'éventuelle saisie manuelle ; on retombe sur le manuel
  // seulement si aucun trait n'est renseigné.
  const { index } = computeSelectionIndex({
    productiviteMielKg: body.productiviteMielKg,
    resistanceVarroaPctInfestation: body.resistanceVarroaPctInfestation,
    hygienismePinTestPct: body.hygienismePinTestPct,
    douceur: body.douceur,
    tenueCadre: body.tenueCadre,
    tendanceEssaimage: body.tendanceEssaimage,
    hivernage: body.hivernage,
    vigueurPrintemps: body.vigueurPrintemps,
    ponteQualite: body.ponteQualite,
  });
  const indexComposite = index ?? body.indexComposite ?? null;

  const [row] = await db
    .insert(testsPerformance)
    .values({
      ...body,
      dateEvaluation: new Date(body.dateEvaluation),
      productiviteMielKg: body.productiviteMielKg?.toString(),
      resistanceVarroaPctInfestation: body.resistanceVarroaPctInfestation?.toString(),
      indexComposite: indexComposite?.toString(),
      userId: user.id,
    })
    .returning();

  if (!row) internalError('Erreur création test');
  setResponseStatus(event, 201);
  return { data: row };
});
