import type { Plan } from '~~/app/config/plans';

/**
 * Mapping Stripe price_id → plan interne.
 * Chaque price_id correspond à un plan (mensuel ou annuel).
 */
function buildPriceToPlan(): Record<string, Plan> {
  const map: Record<string, Plan> = {};

  const add = (priceId: string | undefined, plan: Plan) => {
    if (priceId) map[priceId] = plan;
  };

  // Source de vérité : runtimeConfig (mêmes IDs que getPriceId au checkout),
  // pour reconnaître les abonnements mensuels ET annuels côté webhook.
  const config = useRuntimeConfig();
  add(config.stripePriceStarter, 'starter');
  add(config.stripePricePro, 'pro');
  add(config.stripePriceExpert, 'expert');
  add(config.stripePriceStarterAnnual, 'starter');
  add(config.stripePriceProAnnual, 'pro');
  add(config.stripePriceExpertAnnual, 'expert');

  // Compat avec les anciennes variables d'env
  add(process.env.NUXT_PRICE_STARTER_MONTHLY, 'starter');
  add(process.env.NUXT_PRICE_STARTER_YEARLY, 'starter');
  add(process.env.NUXT_PRICE_PRO_MONTHLY, 'pro');
  add(process.env.NUXT_PRICE_PRO_YEARLY, 'pro');
  add(process.env.NUXT_PRICE_EXPERT_MONTHLY, 'expert');
  add(process.env.NUXT_PRICE_EXPERT_YEARLY, 'expert');
  add(process.env.NUXT_STRIPE_PRICE_STARTER, 'starter');
  add(process.env.NUXT_STRIPE_PRICE_PRO, 'pro');
  add(process.env.NUXT_STRIPE_PRICE_EXPERT, 'expert');

  return map;
}

export function planFromPriceId(priceId: string): Plan | null {
  const map = buildPriceToPlan();
  return map[priceId] ?? null;
}
