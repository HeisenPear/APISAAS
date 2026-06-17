import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const bodySchema = z.object({
  plan: z.enum(['decouverte', 'starter', 'pro', 'expert']),
});

/** Correction manuelle du plan d'un utilisateur (admin). Filet de secours. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const { plan } = await readValidatedBody(event, bodySchema.parse);

  const [updated] = await db
    .update(profils)
    .set({ plan, updatedAt: new Date() })
    .where(eq(profils.id, id))
    .returning({ id: profils.id, plan: profils.plan });
  if (!updated) notFound('Utilisateur introuvable');

  return { data: updated };
});
