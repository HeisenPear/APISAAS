import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { logAudit } from '~~/server/utils/audit';

const bodySchema = z.object({
  plan: z.enum(['decouverte', 'starter', 'pro', 'expert']),
});

/** Correction manuelle du plan d'un utilisateur (admin). Filet de secours. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const { plan } = await readValidatedBody(event, bodySchema.parse);

  // Plan actuel — pour tracer le changement dans le journal d'audit.
  const [avant] = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, id))
    .limit(1);
  if (!avant) notFound('Utilisateur introuvable');

  const [updated] = await db
    .update(profils)
    .set({ plan, updatedAt: new Date() })
    .where(eq(profils.id, id))
    .returning({ id: profils.id, plan: profils.plan });
  if (!updated) notFound('Utilisateur introuvable');

  // Forcer un plan manuellement touche la facturation → action sensible tracée.
  await logAudit({
    event,
    action: 'billing.plan_changed',
    userId: admin.id,
    resourceType: 'user',
    resourceId: id,
    metadata: {
      adminEmail: admin.email,
      ancienPlan: avant.plan,
      nouveauPlan: plan,
      manuel: true,
    },
  });

  return { data: updated };
});
