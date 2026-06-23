import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe, getPriceId } from '~~/server/utils/stripe';
import { useServerPostHog } from '~~/server/utils/posthog';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'expert']),
  billing: z.enum(['mois', 'an']).default('mois'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, checkoutSchema.parse);
  const config = useRuntimeConfig();
  const stripe = useStripe();

  // Get or create Stripe customer
  const [profil] = await db
    .select({
      stripeCustomerId: profils.stripeCustomerId,
      email: profils.email,
      trialUsed: profils.trialUsed,
    })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil) return notFound('Profil introuvable');

  let customerId = profil.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profil.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await db
      .update(profils)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(profils.id, user.id));
  }

  let priceId: string;
  try {
    priceId = getPriceId(body.plan, body.billing);
  } catch {
    // Prix non configuré (typiquement l'annuel sans NUXT_STRIPE_PRICE_*_ANNUAL).
    // On renvoie une erreur claire plutôt qu'un 500 opaque.
    throw createError({
      statusCode: 400,
      message:
        body.billing === 'an'
          ? "L'abonnement annuel n'est pas encore disponible pour ce plan. Choisissez le paiement mensuel."
          : 'Tarif indisponible pour ce plan.',
    });
  }

  // 2 mois offerts (essai 60 j) sur Pro & Expert au mensuel, une seule fois par compte.
  // La carte est capturée maintenant, débitée automatiquement à la fin de l'essai.
  // L'annuel n'a pas d'essai : la remise −20 % est déjà dans le prix.
  const isTrial =
    body.billing === 'mois' && (body.plan === 'pro' || body.plan === 'expert') && !profil.trialUsed;

  const cycle = body.billing === 'an' ? 'annual' : 'monthly';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    // Champ « Code promo » natif Stripe (sponsoring) — incompatible avec `discounts`,
    // qu'on ne passe pas. La remise s'applique sur la page de paiement Stripe.
    allow_promotion_codes: true,
    success_url: `${config.public.baseUrl}/parametres/abonnement?success=1`,
    cancel_url: `${config.public.baseUrl}/parametres/abonnement?canceled=1`,
    metadata: { userId: user.id, plan: body.plan, cycle, isTrial: String(isTrial) },
    subscription_data: {
      metadata: { userId: user.id, plan: body.plan, cycle, isTrial: String(isTrial) },
      ...(isTrial ? { trial_period_days: 60 } : {}),
    },
    ...(isTrial ? { payment_method_collection: 'always' as const } : {}),
  });

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'checkout_session_created',
    properties: {
      $session_id: sessionId,
      plan: body.plan,
      cycle,
      is_trial: isTrial,
    },
  });

  return { data: { url: session.url } };
});
