import { eq } from 'drizzle-orm';
import { reinesElevage, lignees } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';
import { construireGenealogie } from '~~/server/utils/genealogieReines';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const rows = await db
    .select({
      id: reinesElevage.id,
      identifiant: reinesElevage.identifiant,
      couleurMarquage: reinesElevage.couleurMarquage,
      anneeNaissance: reinesElevage.anneeNaissance,
      estActive: reinesElevage.estActive,
      reineMereId: reinesElevage.reineMereId,
      ligneeNom: lignees.nom,
    })
    .from(reinesElevage)
    .leftJoin(lignees, eq(reinesElevage.ligneeId, lignees.id))
    .where(eq(reinesElevage.userId, ownerId));

  if (!rows.some((r) => r.id === id)) notFound('Reine introuvable');

  const generations = construireGenealogie(rows, id!);
  return { data: { focusId: id, generations } };
});
