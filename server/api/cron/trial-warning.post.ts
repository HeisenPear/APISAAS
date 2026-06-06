import { eq, and, lte, gt } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';
import { sendTrialEndingSoonEmail } from '~~/server/utils/email';

// Lancé chaque jour à 9h — envoie un email aux trials qui expirent dans 3 jours.
// La fenêtre [3j - 4j[ évite les doublons si le cron tourne plusieurs fois.
export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const expiringSoon = await db
    .select({
      email: profils.email,
      prenom: profils.prenom,
      trialEndsAt: profils.trialEndsAt,
    })
    .from(profils)
    .where(
      and(
        eq(profils.trialActive, true),
        gt(profils.trialEndsAt, in3Days),
        lte(profils.trialEndsAt, in4Days),
      ),
    );

  if (expiringSoon.length === 0) return { warned: 0 };

  await Promise.all(
    expiringSoon.map((u) => {
      const joursRestants = Math.ceil(
        (u.trialEndsAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      return sendTrialEndingSoonEmail(
        u.email,
        u.prenom || 'Apiculteur',
        joursRestants,
        u.trialEndsAt!,
      ).catch(() => {});
    }),
  );

  return { warned: expiringSoon.length };
});
