import { profils } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import {
  diffuserPush,
  executerMoteurAlertes,
  preferencesDepuisProfil,
} from '~~/server/utils/moteurAlertes';
import { PROFIL_CRON } from '~~/server/utils/moteurAlertes/profils';

/** Le pooler Supabase plafonne à ~60 connexions : on traite par paquets. */
const USER_BATCH_SIZE = 25;

/**
 * GET /api/cron/alertes — passage quotidien sur tous les comptes.
 *
 * Mêmes règles que la route à la demande, plus celles qui n'ont de sens qu'une
 * fois par jour : météo (réseau), rappels de RDV, balances devenues muettes.
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);
  const maintenant = new Date();

  const users = await db
    .select({ id: profils.id, plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);
  if (users.length === 0) return { data: { users: 0, created: 0, envoyes: 0, failed: 0 } };

  const { results, errors } = await processInBatches(users, USER_BATCH_SIZE, (u) =>
    executerMoteurAlertes({
      userId: u.id,
      profil: PROFIL_CRON,
      maintenant,
      preferences: preferencesDepuisProfil(
        u.plan,
        u.pushNotifPrefs as Record<string, unknown> | null,
      ),
    }),
  );

  const envoyes = await diffuserPush(results);

  if (errors.length > 0) {
    console.error('[cron/alertes] users failed', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ userId: e.item.id, error: String(e.error) })),
    });
  }

  return {
    data: {
      users: users.length,
      created: results.reduce((n, r) => n + r.creees.length, 0),
      envoyes,
      failed: errors.length,
    },
  };
});
