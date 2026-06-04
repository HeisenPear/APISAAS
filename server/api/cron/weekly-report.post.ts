import { gte, count, sql } from 'drizzle-orm';
import { profils, interventions, transactions, recoltes } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';
import { sendPushToUser } from '~~/server/utils/webPush';

const ADMIN_EMAIL = 'antoine.martin200262@gmail.com';

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ── Requêtes KPI en parallèle ─────────────────────────────────────────────
  const [
    totalUsers,
    newUsersThisWeek,
    newUsersLastWeek,
    activeThisWeek,
    interventionsThisWeek,
    interventionsLastWeek,
    salesThisWeek,
    recoltesThisWeek,
    trialUsers,
    payingUsers,
  ] = await Promise.all([
    // Total users
    db
      .select({ c: count() })
      .from(profils)
      .then((r) => r[0]?.c ?? 0),

    // Nouveaux inscrits cette semaine
    db
      .select({ c: count() })
      .from(profils)
      .where(gte(profils.createdAt, weekAgo))
      .then((r) => r[0]?.c ?? 0),

    // Nouveaux inscrits semaine précédente (pour variation)
    db
      .select({ c: count() })
      .from(profils)
      .where(sql`${profils.createdAt} >= ${twoWeeksAgo} AND ${profils.createdAt} < ${weekAgo}`)
      .then((r) => r[0]?.c ?? 0),

    // Utilisateurs actifs cette semaine (dernière activité)
    db
      .select({ c: count() })
      .from(profils)
      .where(gte(profils.derniereActiviteAt, weekAgo))
      .then((r) => r[0]?.c ?? 0),

    // Interventions cette semaine
    db
      .select({ c: count() })
      .from(interventions)
      .where(gte(interventions.createdAt, weekAgo))
      .then((r) => r[0]?.c ?? 0),

    // Interventions semaine précédente
    db
      .select({ c: count() })
      .from(interventions)
      .where(
        sql`${interventions.createdAt} >= ${twoWeeksAgo} AND ${interventions.createdAt} < ${weekAgo}`,
      )
      .then((r) => r[0]?.c ?? 0),

    // Ventes cette semaine
    db
      .select({ c: count() })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= ${weekAgo} AND ${transactions.type} = 'vente'`)
      .then((r) => r[0]?.c ?? 0),

    // Récoltes ce mois
    db
      .select({ c: count() })
      .from(recoltes)
      .where(gte(recoltes.createdAt, monthAgo))
      .then((r) => r[0]?.c ?? 0),

    // Utilisateurs en trial actif
    db
      .select({ c: count() })
      .from(profils)
      .where(sql`${profils.trialActive} = true`)
      .then((r) => r[0]?.c ?? 0),

    // Utilisateurs payants (plan != decouverte, trial inactif)
    db
      .select({ c: count() })
      .from(profils)
      .where(sql`${profils.plan} != 'decouverte' AND ${profils.trialActive} = false`)
      .then((r) => r[0]?.c ?? 0),
  ]);

  // ── Calcul des variations ────────────────────────────────────────────────
  const signupDelta =
    newUsersLastWeek > 0
      ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
      : null;
  const interventionDelta =
    interventionsLastWeek > 0
      ? Math.round(((interventionsThisWeek - interventionsLastWeek) / interventionsLastWeek) * 100)
      : null;

  const sign = (n: number | null) => (n === null ? '' : n >= 0 ? `+${n}%` : `${n}%`);

  // ── Rapport texte ────────────────────────────────────────────────────────
  const weekLabel = `${weekAgo.toLocaleDateString('fr-FR')} – ${now.toLocaleDateString('fr-FR')}`;
  const lines = [
    `📊 Rapport hebdo APIGO — ${weekLabel}`,
    '',
    `👥 Utilisateurs : ${totalUsers} total | +${newUsersThisWeek} inscrits ${sign(signupDelta)}`,
    `🔴 Actifs cette semaine : ${activeThisWeek}`,
    `💰 Payants : ${payingUsers} | En trial : ${trialUsers}`,
    '',
    `🐝 Interventions : ${interventionsThisWeek} cette semaine ${sign(interventionDelta)}`,
    `🍯 Ventes : ${salesThisWeek} | Récoltes (30j) : ${recoltesThisWeek}`,
  ];

  const reportText = lines.join('\n');

  // ── Push notification à l'admin ───────────────────────────────────────────
  const adminProfil = await db.query.profils.findFirst({
    where: sql`${profils.email} = ${ADMIN_EMAIL}`,
    columns: { id: true },
  });

  let pushSent = 0;
  if (adminProfil?.id) {
    pushSent = await sendPushToUser(adminProfil.id, {
      title: `📊 Rapport hebdo APIGO`,
      body: `${newUsersThisWeek} inscrits • ${interventionsThisWeek} interventions • ${payingUsers} payants`,
      url: '/dashboard',
      tag: 'weekly-report',
    });
  }

  // ── Email Brevo si clé configurée ────────────────────────────────────────
  const brevoKey = useRuntimeConfig().brevoApiKey as string | undefined;
  let emailSent = false;
  if (brevoKey) {
    try {
      await $fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: {
          sender: { name: 'APIGO Analytics', email: 'noreply@apigo.fr' },
          to: [{ email: ADMIN_EMAIL, name: 'Antoine' }],
          subject: `📊 Rapport hebdo APIGO — ${weekLabel}`,
          textContent: reportText,
          htmlContent: `<pre style="font-family:monospace;font-size:14px;line-height:1.6">${reportText.replace(/\n/g, '<br>')}</pre>`,
        },
      });
      emailSent = true;
    } catch {
      // Email optionnel — ne pas faire échouer le cron
    }
  }

  return {
    week: weekLabel,
    kpis: {
      total_users: totalUsers,
      new_users: newUsersThisWeek,
      signup_delta_pct: signupDelta,
      active_users: activeThisWeek,
      paying_users: payingUsers,
      trial_users: trialUsers,
      interventions: interventionsThisWeek,
      intervention_delta_pct: interventionDelta,
      sales: salesThisWeek,
      recoltes_30d: recoltesThisWeek,
    },
    notifications: { push: pushSent, email: emailSent },
  };
});
