import { and, eq, isNull } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';
import { construireDangerMeteoIntraday } from '~~/server/utils/alertesMeteo';
import { planifierPush, type PrioriteAlerte } from '~~/server/utils/alertesPush';
import { envoyerEmailsUrgents } from '~~/server/utils/alertesEmail';
import { normaliserPrefs, typeActif } from '~~/server/utils/alertesCategories';
import type { Plan } from '~~/app/config/plans';

const USER_BATCH_SIZE = 25;

/**
 * GET /api/cron/urgences — réactivité INTRADAY (météo dangereuse en cours de
 * journée). Déclenché par PLUSIEURS crons quotidiens à heures fixes (vercel.json),
 * plan Hobby oblige. À CHAQUE passage : détection + envoi dans le MÊME run (jamais
 * de découplage « info à 14 h, notif à 16 h »).
 *
 * Anti-doublon : une seule `meteo_danger` active par utilisateur (dejaExiste) —
 * le cron 8 h (« demain ») et ce cron (« prochaines 12 h ») ne créent donc qu'une
 * alerte ; les passages suivants la voient active et n'y touchent plus, jusqu'à
 * résolution par le cron 8 h du lendemain. L'email a en plus son propre verrou 12 h.
 *
 * Le sanitaire critique n'est PAS ré-évalué ici (il ne change qu'à la saisie d'une
 * intervention → déjà couvert par /api/alertes/generate + le cron 8 h, email inclus).
 */
export default defineEventHandler(async (event) => {
  assertCronAuth(event);
  const now = new Date();

  const users = await db
    .select({ id: profils.id, plan: profils.plan, pushNotifPrefs: profils.pushNotifPrefs })
    .from(profils);
  if (users.length === 0) return { data: { cibles: 0, crees: 0, pousses: 0, emails: 0 } };

  const { results } = await processInBatches(users, USER_BATCH_SIZE, async (user) => {
    const vide = { crees: 0, pousses: 0, emails: 0 };
    const brut = user.pushNotifPrefs as Record<string, unknown> | null;
    const prefs = normaliserPrefs(brut);
    const plan = (user.plan ?? 'decouverte') as Plan;

    // Catégorie « saison » (météo) coupée → on n'interroge même pas Open-Meteo.
    if (!typeActif(prefs, 'meteo_danger')) return vide;

    // Une alerte météo est-elle déjà active ? (dédup cron 8 h + passages répétés)
    const actives = await db
      .select({ id: alertes.id })
      .from(alertes)
      .where(
        and(
          eq(alertes.userId, user.id),
          isNull(alertes.resolvedAt),
          eq(alertes.type, 'meteo_danger'),
        ),
      );
    const dejaExiste = (type: string) => type === 'meteo_danger' && actives.length > 0;

    const nouvelles = await construireDangerMeteoIntraday(user.id, dejaExiste, now);
    if (nouvelles.length === 0) return vide;

    await db.insert(alertes).values(nouvelles);

    const payloads = planifierPush(
      nouvelles.map((a) => ({
        type: a.type ?? '',
        titre: a.titre,
        message: a.message,
        actionUrl: a.actionUrl,
        priorite: (a.priorite ?? 'haute') as PrioriteAlerte,
        referenceId: a.referenceId,
      })),
      prefs,
      now,
      plan,
    );
    for (const p of payloads) await sendPushToUser(user.id, p).catch(() => {});

    const emails = await envoyerEmailsUrgents(
      user.id,
      plan,
      brut,
      nouvelles.map((a) => ({
        type: a.type ?? '',
        titre: a.titre,
        message: a.message,
        actionUrl: a.actionUrl,
      })),
    ).catch(() => 0);

    return { crees: nouvelles.length, pousses: payloads.length, emails };
  });

  const agg = results.reduce(
    (s, r) => ({
      crees: s.crees + r.crees,
      pousses: s.pousses + r.pousses,
      emails: s.emails + r.emails,
    }),
    { crees: 0, pousses: 0, emails: 0 },
  );
  return { data: { cibles: users.length, ...agg } };
});
