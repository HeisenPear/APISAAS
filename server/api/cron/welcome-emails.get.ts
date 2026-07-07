import { sql } from 'drizzle-orm';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { claimAndSendWelcomeEmail } from '~~/server/utils/welcomeEmail';

/**
 * Rattrapage quotidien des emails de bienvenue (Vercel Hobby = crons
 * quotidiens uniquement). La plupart des inscrits sont accueillis plus tôt
 * par le déclencheur opportuniste à la visite du dashboard — ce cron couvre
 * ceux qui ne sont pas revenus. Logique d'envoi : utils/welcomeEmail.ts.
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const rows = (await db.execute(sql`
    SELECT id FROM profils
    WHERE created_at <= now() - interval '1 hour'
      AND created_at > now() - interval '48 hours'
      AND (preferences->>'welcomeEmailSentAt') IS NULL
    LIMIT 200
  `)) as unknown as Array<{ id: string }>;

  if (rows.length === 0) return { data: { sent: 0, failed: 0 } };

  const { results, errors } = await processInBatches(rows, 10, (u) =>
    claimAndSendWelcomeEmail(u.id),
  );

  if (errors.length > 0) {
    console.error('[cron/welcome-emails] échecs', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ userId: e.item.id, error: String(e.error) })),
    });
  }

  return { data: { sent: results.filter(Boolean).length, failed: errors.length } };
});
