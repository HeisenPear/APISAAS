import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { z } from 'zod';

// Préférences de notifications par CATÉGORIE (6 interrupteurs au lieu d'une case
// par type d'alerte) + le résumé quotidien consolidé. Voir
// server/utils/alertesCategories.ts.
const bodySchema = z.object({
  sante: z.boolean(),
  production: z.boolean(),
  stock: z.boolean(),
  saison: z.boolean(),
  gestion: z.boolean(),
  reglementaire: z.boolean(),
  communaute: z.boolean(),
  // Feuille de route du matin. Défaut activé pour rester rétro-compatible.
  resume_quotidien: z.boolean().default(true),
  // Heure d'envoi du résumé (heure locale Paris). Défaut 7 h. Bornée 5-12 h :
  // le résumé est « du matin » et les crons ne couvrent que cette plage.
  heure_resume: z.number().int().min(5).max(12).default(7),
  // Emails d'alerte urgente (canal de secours). Défaut activé.
  email_urgent: z.boolean().default(true),
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
