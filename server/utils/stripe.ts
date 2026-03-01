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

/** Map plan names to Stripe price IDs from runtimeConfig. */
export function getPriceId(plan: 'starter' | 'pro' | 'expert'): string {
  const config = useRuntimeConfig();
  const map: Record<string, string> = {
    starter: config.stripePriceStarter,
    pro: config.stripePricePro,
    expert: config.stripePriceExpert,
  };
  const priceId = map[plan];
  if (!priceId) throw new Error(`No Stripe price ID configured for plan: ${plan}`);
  return priceId;
}
