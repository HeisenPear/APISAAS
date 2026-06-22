import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe, getPriceId } from '~~/server/utils/stripe';
import { useServerPostHog } from '~~/server/utils/posthog';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'expert']),
  billing: z.enum(['mois', 'an']).default('mois'),
});

// Essai offert sur l'abonnement mensuel (l'annuel bénéficie lui de la remise -20 %).
const MONTHLY_TRIAL_DAYS = 14;

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, checkoutSchema.parse);
  const config = useRuntimeConfig();
  const stripe = useStripe();

  // Get or create Stripe customer
  const [profil] = await db
    .select({ stripeCustomerId: profils.stripeCustomerId, email: profils.email })
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

  const priceId = getPriceId(body.plan, body.billing);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.public.baseUrl}/parametres/abonnement?success=1`,
    cancel_url: `${config.public.baseUrl}/parametres/abonnement?canceled=1`,
    metadata: { userId: user.id, plan: body.plan, billing: body.billing },
    subscription_data: {
      metadata: { userId: user.id, plan: body.plan, billing: body.billing },
      // Essai uniquement sur le mensuel ; l'annuel a déjà la remise -20 %.
      ...(body.billing === 'mois' ? { trial_period_days: MONTHLY_TRIAL_DAYS } : {}),
    },
  });

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'checkout_session_created',
    properties: {
      $session_id: sessionId,
      plan: body.plan,
    },
  });

  return { data: { url: session.url } };
});
