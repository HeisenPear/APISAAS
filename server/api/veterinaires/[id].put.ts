import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

const schema = z.object({
  nomComplet: z.string().min(2).max(255).trim().optional(),
  cabinet: z.string().max(255).trim().optional(),
  telephone: z.string().max(50).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().max(500).trim().optional(),
  numeroOrdre: z.string().max(100).trim().optional(),
  estPrincipal: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, schema.parse);

  if (body.estPrincipal) {
    await db
      .update(veterinaires)
      .set({ estPrincipal: false })
      .where(eq(veterinaires.userId, user.id));
  }

  const [updated] = await db
    .update(veterinaires)
    .set(body)
    .where(and(eq(veterinaires.id, id!), eq(veterinaires.userId, user.id)))
    .returning();

  if (!updated) throw createError({ statusCode: 404, message: 'Vétérinaire non trouvé' });
  return { data: updated };
});
