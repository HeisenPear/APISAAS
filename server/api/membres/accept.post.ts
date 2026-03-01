import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

const acceptSchema = z.object({
  membreId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, acceptSchema.parse);

  // Get the user's email
  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil) return notFound('Profil introuvable');

  // Find the invitation for this email
  const [membre] = await db
    .select()
    .from(membres)
    .where(
      and(
        eq(membres.id, body.membreId),
        eq(membres.email, profil.email),
        eq(membres.statut, 'en_attente'),
      ),
    )
    .limit(1);

  if (!membre) return notFound('Invitation introuvable ou deja traitee');

  const [updated] = await db
    .update(membres)
    .set({
      userId: user.id,
      statut: 'acceptee',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(membres.id, body.membreId))
    .returning();

  return { data: updated };
});
