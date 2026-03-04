import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';

const updateClientSchema = z.object({
  type: z.enum(['particulier', 'professionnel', 'revendeur']).optional(),
  nom: z.string().trim().min(1).max(200).optional(),
  prenom: z.string().trim().max(200).optional(),
  entreprise: z.string().trim().max(300).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  telephone: z.string().trim().max(20).optional(),
  adresse: z.string().trim().max(500).optional(),
  codePostal: z.string().trim().max(10).optional(),
  ville: z.string().trim().max(200).optional(),
  siret: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateClientSchema.parse);

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
    .limit(1);

  if (!existing) notFound('Client introuvable');

  const [updated] = await db
    .update(clients)
    .set({ ...body, email: body.email || null, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, user.id)))
    .returning();

  return { data: updated };
});
