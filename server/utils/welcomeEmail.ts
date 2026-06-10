import { sql } from 'drizzle-orm';
import { sendWelcomeEmail } from '~~/server/utils/email';

/**
 * Envoi (au plus une fois) de l'email de bienvenue différé.
 *
 * Fenêtre : inscrit depuis plus d'1 h (le délai voulu) et moins de 48 h
 * (évite d'accueillir les vieux comptes à la mise en service).
 *
 * Le marqueur `welcomeEmailSentAt` est posé atomiquement par l'UPDATE qui
 * sert de claim — deux appels concurrents (cron + visite dashboard) ne
 * peuvent pas envoyer deux fois. Posé avant l'envoi : en cas d'échec on
 * préfère un mail jamais envoyé à un doublon.
 *
 * Deux déclencheurs (le plan Vercel Hobby interdit les crons horaires) :
 *  - opportuniste : visite du dashboard (POST /api/alertes/generate)
 *  - rattrapage   : cron quotidien /api/cron/welcome-emails
 */
export async function claimAndSendWelcomeEmail(userId: string): Promise<boolean> {
  const rows = (await db.execute(sql`
    UPDATE profils
    SET preferences = coalesce(preferences, '{}'::jsonb)
          || jsonb_build_object('welcomeEmailSentAt', now()::text)
    WHERE id = ${userId}
      AND created_at <= now() - interval '1 hour'
      AND created_at > now() - interval '48 hours'
      AND (preferences->>'welcomeEmailSentAt') IS NULL
    RETURNING email, prenom
  `)) as unknown as Array<{ email: string; prenom: string | null }>;

  const u = rows[0];
  if (!u) return false;

  await sendWelcomeEmail(u.email, u.prenom || 'apiculteur·rice');
  return true;
}
