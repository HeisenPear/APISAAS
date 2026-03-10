import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { organisations } from '~~/server/database/schema';

const updateOrganisationSchema = z.object({
  nom: z.string().min(1).max(200).trim().optional(),
  type: z.enum(['gdsa', 'syndicat', 'cuma', 'gie', 'gaec', 'association', 'autre']).optional(),
  siret: z.string().max(14).trim().optional(),
  adresse: z.string().trim().optional(),
  codePostal: z.string().max(5).trim().optional(),
  ville: z.string().trim().optional(),
  email: z.string().email('Email invalide').optional(),
  telephone: z.string().trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = z.string().uuid().parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, updateOrganisationSchema.parse);

  const [updated] = await db
    .update(organisations)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(organisations.id, id), eq(organisations.ownerId, user.id)))
    .returning();

  if (!updated) {
    notFound('Organisation introuvable ou acces interdit');
  }

  return { data: updated };
});
