import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { z } from 'zod';

// Préférences de notifications par CATÉGORIE (6 interrupteurs au lieu d'une case
// par type d'alerte). Voir server/utils/alertesCategories.ts.
const bodySchema = z.object({
  sante: z.boolean(),
  production: z.boolean(),
  stock: z.boolean(),
  saison: z.boolean(),
  gestion: z.boolean(),
  reglementaire: z.boolean(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = bodySchema.parse(await readBody(event));

  await db
    .update(profils)
    .set({ pushNotifPrefs: body, updatedAt: new Date() })
    .where(eq(profils.id, user.id));

  return { data: body };
});
