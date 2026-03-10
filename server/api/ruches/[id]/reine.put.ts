import { eq, and } from 'drizzle-orm';
import { ruches } from '~~/server/database/schema';
import { updateReineRucheSchema } from '~~/server/utils/validation/reine';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateReineRucheSchema.parse);

  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  const setData: Partial<typeof ruches.$inferInsert> = {
    updatedAt: new Date(),
    ...(body.reinePresente !== undefined && { reinePresente: body.reinePresente }),
    ...(body.reineCouleur !== undefined && { reineCouleur: body.reineCouleur }),
    ...(body.reineAnnee !== undefined && { reineAnnee: body.reineAnnee }),
    ...(body.reineRace !== undefined && { reineRace: body.reineRace }),
    ...(body.reineOrigine !== undefined && { reineOrigine: body.reineOrigine }),
    ...(body.reineDateIntroduction !== undefined && {
      reineDateIntroduction: body.reineDateIntroduction
        ? new Date(body.reineDateIntroduction)
        : null,
    }),
    ...(body.reineQualitePonte !== undefined && { reineQualitePonte: body.reineQualitePonte }),
    ...(body.reineDouceur !== undefined && { reineDouceur: body.reineDouceur }),
    ...(body.reineProlificite !== undefined && { reineProlificite: body.reineProlificite }),
  };

  const [updated] = await db
    .update(ruches)
    .set(setData)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .returning({ id: ruches.id });

  return { data: updated };
});
