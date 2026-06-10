import { sql } from 'drizzle-orm';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendWelcomeEmail } from '~~/server/utils/email';

/**
 * Email de bienvenue différé — cron horaire.
 *
 * Choix produit : le mail part 1 à 2 h après l'inscription plutôt
 * qu'instantanément. Il arrive quand l'utilisateur a déjà exploré l'app,
 * sans se mélanger aux éventuels emails techniques d'inscription.
 *
 * Idempotence : marqueur `welcomeEmailSentAt` dans profils.preferences
 * (posé AVANT l'envoi — en cas d'échec on préfère un mail jamais envoyé
 * à un doublon de bienvenue).
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  // Fenêtre 1 h → 48 h : la borne basse crée le délai voulu, la borne haute
  // évite d'accueillir les vieux comptes au premier déploiement du cron.
  const rows = (await db.execute(sql`
    SELECT id, email, prenom
    FROM profils
    WHERE created_at <= now() - interval '1 hour'
      AND created_at > now() - interval '48 hours'
      AND (preferences->>'welcomeEmailSentAt') IS NULL
    LIMIT 200
  `)) as unknown as Array<{ id: string; email: string; prenom: string | null }>;

  if (rows.length === 0) return { data: { sent: 0, failed: 0 } };

  const { results, errors } = await processInBatches(rows, 10, async (u) => {
    await db.execute(sql`
      UPDATE profils
      SET preferences = coalesce(preferences, '{}'::jsonb)
            || jsonb_build_object('welcomeEmailSentAt', now()::text)
      WHERE id = ${u.id}
    `);
    await sendWelcomeEmail(u.email, u.prenom || 'apiculteur·rice');
    return u.id;
  });

  if (errors.length > 0) {
    console.error('[cron/welcome-emails] échecs', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ userId: e.item.id, error: String(e.error) })),
    });
  }

  return { data: { sent: results.length, failed: errors.length } };
});
