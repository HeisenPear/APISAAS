import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { veterinaires } from '~~/server/database/schema';

const schema = z.object({
  nomComplet: z.string().min(2).max(255).trim(),
  cabinet: z.string().max(255).trim().optional(),
  telephone: z.string().max(50).trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  adresse: z.string().max(500).trim().optional(),
  numeroOrdre: z.string().max(100).trim().optional(),
  estPrincipal: z.boolean().default(false),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, schema.parse);

  // Si principal, mettre les autres à false
  if (body.estPrincipal) {
    await db
      .update(veterinaires)
      .set({ estPrincipal: false })
      .where(eq(veterinaires.userId, user.id));
  }

  const [created] = await db
    .insert(veterinaires)
    .values({ ...body, userId: user.id })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
