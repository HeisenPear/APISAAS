import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const onboardingSchema = z.object({
  complete: z.boolean(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, onboardingSchema.parse);

  const [updatedProfil] = await db
    .update(profils)
    .set({
      onboardingComplete: body.complete,
      updatedAt: new Date(),
    })
    .where(eq(profils.id, user.id))
    .returning();

  if (!updatedProfil) {
    notFound('Profil introuvable');
  }

  return { data: updatedProfil };
});
