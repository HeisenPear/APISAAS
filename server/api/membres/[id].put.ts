import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres } from '~~/server/database/schema';
import { estRoleRestreint } from '~~/app/config/roles';

const updateSchema = z.object({
  role: z.enum(['admin', 'apiculteur', 'technicien', 'comptable', 'lecture']),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateSchema.parse);

  // Rôles restreints (technicien / comptable / lecture) → réservés à Expert.
  if (estRoleRestreint(body.role) && !(await peutAssignerRolesRestreints(user.id))) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Plan insuffisant',
      data: {
        code: 'PLAN_REQUIRED',
        feature: 'rolesEquipe',
        message: 'Les rôles à accès limité sont réservés au plan Expert.',
      },
    });
  }

  const [updated] = await db
    .update(membres)
    .set({ role: body.role, updatedAt: new Date() })
    .where(and(eq(membres.id, id), eq(membres.ownerId, user.id)))
    .returning();

  if (!updated) return notFound('Membre introuvable');

  return { data: updated };
});
