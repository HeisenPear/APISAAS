import { eq, and, isNotNull } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';
import { z } from 'zod';

const schema = z.object({ scope: z.enum(['resolues', 'lues', 'toutes']) });

/** Suppression groupée d'alertes : résolues, lues, ou toutes. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { scope } = await readValidatedBody(event, schema.parse);

  const conditions = [eq(alertes.userId, user.id)];
  if (scope === 'resolues') conditions.push(isNotNull(alertes.resolvedAt));
  else if (scope === 'lues') conditions.push(eq(alertes.lue, true));
  // 'toutes' → aucune condition supplémentaire (scopé au user)

  const deleted = await db
    .delete(alertes)
    .where(and(...conditions))
    .returning({ id: alertes.id });

  return { data: { deleted: deleted.length } };
});
