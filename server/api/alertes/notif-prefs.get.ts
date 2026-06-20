import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { normaliserPrefs } from '~~/server/utils/alertesCategories';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const [profil] = await db
    .select({ pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, user.id));

  // Préférences par CATÉGORIE (6 interrupteurs). Les anciennes clés par type
  // éventuellement stockées sont ignorées par normaliserPrefs → défaut = activé.
  return { data: normaliserPrefs(profil?.pushNotifPrefs as Record<string, unknown> | null) };
});
