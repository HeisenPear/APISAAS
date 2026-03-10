import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations, campagnesCommande, commandesGroupees } from '~~/server/database/schema';

const updateCommandeSchema = z.object({
  statut: z.enum(['validee', 'payee', 'annulee']),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const cmdId = z.string().uuid().parse(getRouterParam(event, 'cmdId'));
  const body = await readValidatedBody(event, updateCommandeSchema.parse);

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, user.id)));

  if (!campagne) throw notFound('Campagne introuvable');

  const [updated] = await db
    .update(commandesGroupees)
    .set({
      statut: body.statut,
      updatedAt: new Date(),
    })
    .where(and(eq(commandesGroupees.id, cmdId), eq(commandesGroupees.campagneId, campagneId)))
    .returning();

  if (!updated) throw notFound('Commande introuvable');

  return { data: updated };
});
