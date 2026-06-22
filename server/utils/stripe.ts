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

/**
 * Map plan names to Stripe price IDs from runtimeConfig.
 * `billing` sélectionne le prix mensuel (défaut) ou annuel (−20 %).
 */
export function getPriceId(
  plan: 'starter' | 'pro' | 'expert',
  billing: 'mois' | 'an' = 'mois',
): string {
  const config = useRuntimeConfig();
  const monthly: Record<string, string> = {
    starter: config.stripePriceStarter,
    pro: config.stripePricePro,
    expert: config.stripePriceExpert,
  };
  const yearly: Record<string, string> = {
    starter: config.stripePriceStarterAnnual,
    pro: config.stripePriceProAnnual,
    expert: config.stripePriceExpertAnnual,
  };
  const priceId = billing === 'an' ? yearly[plan] : monthly[plan];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan} (${billing})`);
  }
  return priceId;
}
