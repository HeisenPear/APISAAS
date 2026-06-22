import type { Plan } from '~~/app/config/plans';

/**
 * Mapping Stripe price_id → plan interne.
 * Chaque price_id correspond à un plan (mensuel ou annuel).
 */
function buildPriceToPlan(): Record<string, Plan> {
  const config = useRuntimeConfig();
  const map: Record<string, Plan> = {};

  const add = (priceId: string | undefined, plan: Plan) => {
    if (priceId) map[priceId] = plan;
  };

  // Source de vérité : runtimeConfig (même origine que getPriceId au checkout),
  // mensuel ET annuel — pour que le webhook reconnaisse aussi les abos annuels.
  add(config.stripePriceStarter, 'starter');
  add(config.stripePriceStarterAnnual, 'starter');
  add(config.stripePricePro, 'pro');
  add(config.stripePriceProAnnual, 'pro');
  add(config.stripePriceExpert, 'expert');
  add(config.stripePriceExpertAnnual, 'expert');

  // Compat avec d'anciennes variables d'env éventuelles
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
