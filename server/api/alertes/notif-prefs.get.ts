import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import {
  normaliserPrefs,
  resumeQuotidienActif,
  heureResumeQuotidien,
  emailUrgentActif,
} from '~~/server/utils/alertesCategories';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const [profil] = await db
    .select({ pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils)
    .where(eq(profils.id, user.id));

  const brut = profil?.pushNotifPrefs as Record<string, unknown> | null;

  // Préférences par CATÉGORIE (6 interrupteurs) + le résumé quotidien et son
  // heure d'envoi. Les anciennes clés par type éventuellement stockées sont
  // ignorées par normaliserPrefs → défaut = activé.
  return {
    data: {
      ...normaliserPrefs(brut),
      resume_quotidien: resumeQuotidienActif(brut),
      heure_resume: heureResumeQuotidien(brut),
      email_urgent: emailUrgentActif(brut),
    },
  };
});
