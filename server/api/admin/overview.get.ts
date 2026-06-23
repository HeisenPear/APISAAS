import { sql } from 'drizzle-orm';
import { PLAN_CONFIGS } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

/**
 * Vue d'ensemble admin — cockpit business.
 *
 * Agrège en parallèle, depuis la DB uniquement : croissance & présence,
 * revenus récurrents (MRR/ARR dérivés des plans), entonnoir d'acquisition
 * (démos → inscrits → trials → payants), sponsoring, santé produit
 * (DAU/WAU/MAU, top pages/actions) et comptes à risque (trials expirants).
 * Réservé aux admins. Résilient : chaque bloc échoue isolément (→ vide).
 */
const EMPTY = {
  core: {},
  parPlan: [] as unknown[],
  inscriptionsParJour: [] as unknown[],
  produit: {},
  topPages: [] as unknown[],
  topActions: [] as unknown[],
  activiteParJour: [] as unknown[],
  demos: [] as unknown[],
  sponsoring: [] as unknown[],
  activation: {},
  trialsExpirants: [] as unknown[],
  derniersInscrits: [] as unknown[],
  revenus: { mrr: 0, arr: 0, payants: 0 },
  schemaReady: false,
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  try {
    return { data: await collect() };
  } catch (err) {
    console.error('[admin/overview] query failed', err);
    return { data: EMPTY };
  }
});

/** Rejeu une fois sur pool recyclé (cohérent avec admin/analytics). */
async function safe(factory: () => Promise<unknown>, label: string): Promise<unknown[]> {
  for (let t = 0; t < 2; t++) {
    try {
      return (await dbWatchdog(factory(), `admin/overview:${label}`)) as unknown[];
    } catch (err) {
      if (t === 0) continue;
      console.error(`[admin/overview] bloc "${label}" a échoué:`, err);
      return [];
    }
  }
  return [];
}

async function collect() {
  const [
    coreRows,
    parPlan,
    inscriptionsParJour,
    produitRows,
    topPages,
    topActions,
    activiteParJour,
    demos,
    sponsoring,
    activationRows,
    trialsExpirants,
    derniersInscrits,
  ] = await Promise.all([
    safe(
      () =>
        db.execute(sql`
        select
          (select count(*) from profils)::int as "totalUsers",
          (select count(*) from profils where created_at > now() - interval '7 days')::int as "inscriptions7j",
          (select count(*) from profils where created_at > now() - interval '30 days')::int as "inscriptions30j",
          (select count(*) from profils where derniere_activite_at > now() - interval '24 hours')::int as "actifs24h",
          (select count(*) from profils where derniere_activite_at > now() - interval '7 days')::int as "actifs7j",
          (select count(*) from profils where derniere_activite_at > now() - interval '30 days')::int as "actifs30j",
          (select count(*) from profils where onboarding_complete = true)::int as "onboardingComplete",
          (select count(*) from profils where trial_active = true and trial_ends_at > now())::int as "trialsActifs",
          (select count(*) from profils where trial_used = true)::int as "trialsTotal",
          (select count(*) from profils where trial_used = true and trial_active = false and plan = 'decouverte')::int as "trialsPerdus",
          (select count(*) from profils where stripe_subscription_id is not null)::int as "avecStripe"
      `),
      'core',
    ),
    safe(
      () =>
        db.execute(sql`
        select plan,
          count(*)::int as total,
          count(*) filter (where trial_active = true)::int as "enTrial"
        from profils group by plan
      `),
      'parPlan',
    ),
    safe(
      () =>
        db.execute(sql`
        select to_char(date_trunc('day', created_at at time zone 'Europe/Paris'), 'YYYY-MM-DD') as jour, count(*)::int as count
        from profils where created_at > now() - interval '30 days'
        group by 1 order by 1
      `),
      'inscriptionsParJour',
    ),
    safe(
      () =>
        db.execute(sql`
        select
          (select count(distinct user_id) from evenements_activite where created_at >= date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris')::int as "dau",
          (select count(distinct user_id) from evenements_activite where created_at > now() - interval '7 days')::int as "wau",
          (select count(distinct user_id) from evenements_activite where created_at > now() - interval '30 days')::int as "mau",
          (select count(*) from evenements_activite where created_at >= date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris')::int as "evenementsAujourdhui"
      `),
      'produit',
    ),
    safe(
      () =>
        db.execute(sql`
        select nom, count(*)::int as count from evenements_activite
        where type = 'page' and created_at > now() - interval '7 days'
        group by nom order by count desc limit 10
      `),
      'topPages',
    ),
    safe(
      () =>
        db.execute(sql`
        select nom, count(*)::int as count from evenements_activite
        where type = 'action' and created_at > now() - interval '7 days'
        group by nom order by count desc limit 10
      `),
      'topActions',
    ),
    safe(
      () =>
        db.execute(sql`
        select to_char(date_trunc('day', created_at at time zone 'Europe/Paris'), 'YYYY-MM-DD') as jour,
               count(*)::int as evenements, count(distinct user_id)::int as utilisateurs
        from evenements_activite where created_at > now() - interval '14 days'
        group by 1 order by 1
      `),
      'activiteParJour',
    ),
    safe(
      () =>
        db.execute(sql`select statut, count(*)::int as count from demandes_demo group by statut`),
      'demos',
    ),
    safe(
      () =>
        db.execute(sql`
        select cp.type_sponsoring as "typeSponsoring",
               count(ap.id)::int as acquisitions,
               coalesce(sum(ap.montant_remise_cents), 0)::int as "remiseCents"
        from codes_promo cp left join acquisitions_promo ap on ap.code_promo_id = cp.id
        group by cp.type_sponsoring
      `),
      'sponsoring',
    ),
    safe(
      () =>
        db.execute(sql`
        select
          (select count(distinct user_id) from ruchers)::int as "avecRucher",
          (select count(distinct user_id) from ruches)::int as "avecRuche",
          (select count(distinct user_id) from interventions)::int as "avecIntervention"
      `),
      'activation',
    ),
    safe(
      () =>
        db.execute(sql`
        select id, prenom, nom, email, plan, trial_ends_at as "trialEndsAt"
        from profils
        where trial_active = true and trial_ends_at between now() and now() + interval '7 days'
        order by trial_ends_at asc limit 10
      `),
      'trialsExpirants',
    ),
    safe(
      () =>
        db.execute(sql`
        select id, prenom, nom, email, plan, created_at as "createdAt"
        from profils order by created_at desc limit 6
      `),
      'derniersInscrits',
    ),
  ]);

  // MRR/ARR dérivés des prix de plan (les montants Stripe réels ne sont pas en DB)
  let mrr = 0;
  let payants = 0;
  for (const row of parPlan as { plan: Plan; total: number; enTrial: number }[]) {
    const actifsPayants = row.total - row.enTrial;
    const prix = PLAN_CONFIGS[row.plan]?.prix?.mois ?? 0;
    if (prix > 0) {
      mrr += actifsPayants * prix;
      payants += actifsPayants;
    }
  }

  return {
    core: (coreRows as Record<string, number>[])[0] ?? {},
    parPlan,
    inscriptionsParJour,
    produit: (produitRows as Record<string, number>[])[0] ?? {},
    topPages,
    topActions,
    activiteParJour,
    demos,
    sponsoring,
    activation: (activationRows as Record<string, number>[])[0] ?? {},
    trialsExpirants,
    derniersInscrits,
    revenus: { mrr: Math.round(mrr * 100) / 100, arr: Math.round(mrr * 12 * 100) / 100, payants },
    schemaReady: true,
  };
}
