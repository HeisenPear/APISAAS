import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function useStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig();
    if (!config.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

/** Première valeur non vide parmi les candidates (ignore '' et undefined). */
function firstConfigured(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((v) => typeof v === 'string' && v.trim() !== '');
}

/**
 * Résout le Stripe price ID d'un plan pour une période donnée.
 * `billing` sélectionne le prix mensuel (défaut) ou annuel (−20 %).
 *
 * Tolérant au nommage des variables d'env : runtimeConfig
 * (NUXT_STRIPE_PRICE_*[_ANNUAL]) en priorité, puis les conventions
 * historiques NUXT_PRICE_*_MONTHLY / _YEARLY et NUXT_STRIPE_PRICE_*.
 * Évite qu'un prix pourtant configuré sous un autre nom soit ignoré.
 */
export function getPriceId(
  plan: 'starter' | 'pro' | 'expert',
  billing: 'mois' | 'an' = 'mois',
): string {
  const config = useRuntimeConfig();
  const KEY = plan.toUpperCase(); // STARTER | PRO | EXPERT
  const env = process.env;

  const monthly: Record<string, string | undefined> = {
    starter: firstConfigured(
      config.stripePriceStarter,
      env.NUXT_PRICE_STARTER_MONTHLY,
      env.NUXT_STRIPE_PRICE_STARTER,
    ),
    pro: firstConfigured(
      config.stripePricePro,
      env.NUXT_PRICE_PRO_MONTHLY,
      env.NUXT_STRIPE_PRICE_PRO,
    ),
    expert: firstConfigured(
      config.stripePriceExpert,
      env.NUXT_PRICE_EXPERT_MONTHLY,
      env.NUXT_STRIPE_PRICE_EXPERT,
    ),
  };
  const yearly: Record<string, string | undefined> = {
    starter: firstConfigured(
      config.stripePriceStarterAnnual,
      env.NUXT_PRICE_STARTER_YEARLY,
      env.NUXT_STRIPE_PRICE_STARTER_ANNUAL,
    ),
    pro: firstConfigured(
      config.stripePriceProAnnual,
      env.NUXT_PRICE_PRO_YEARLY,
      env.NUXT_STRIPE_PRICE_PRO_ANNUAL,
    ),
    expert: firstConfigured(
      config.stripePriceExpertAnnual,
      env.NUXT_PRICE_EXPERT_YEARLY,
      env.NUXT_STRIPE_PRICE_EXPERT_ANNUAL,
    ),
  };

  const priceId = billing === 'an' ? yearly[plan] : monthly[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${KEY} (${billing})`);
  }
  return priceId;
}
