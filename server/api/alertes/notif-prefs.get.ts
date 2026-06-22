import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const DEFAULT_PREFS: Record<string, boolean> = {
  visite_requise: true,
  sante_critique: true,
  stock_bas: true,
  facture_retard: true,
};

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const [profil] = await db
    .select({ pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, user.id));

  return { data: { ...DEFAULT_PREFS, ...(profil?.pushNotifPrefs ?? {}) } };
});
