import { eq, and } from 'drizzle-orm';
import { recoltes, ruchers, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [recolte] = await db
    .select({
      id: recoltes.id,
      userId: recoltes.userId,
      rucherId: recoltes.rucherId,
      rucheId: recoltes.rucheId,
      dateRecolte: recoltes.dateRecolte,
      typeMiel: recoltes.typeMiel,
      quantiteKg: recoltes.quantiteKg,
      humidite: recoltes.humidite,
      nombreHausses: recoltes.nombreHausses,
      numeroLot: recoltes.numeroLot,
      notes: recoltes.notes,
      createdAt: recoltes.createdAt,
      updatedAt: recoltes.updatedAt,
      rucherNom: ruchers.nom,
      rucheNumero: ruches.numero,
    })
    .from(recoltes)
    .leftJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
    .leftJoin(ruches, eq(recoltes.rucheId, ruches.id))
    .where(and(eq(recoltes.id, id), eq(recoltes.userId, user.id)))
    .limit(1);

  if (!recolte) notFound('Recolte introuvable');

  return { data: recolte };
});
