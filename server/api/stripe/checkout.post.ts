import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe, getPriceId } from '~~/server/utils/stripe';
import { useServerPostHog } from '~~/server/utils/posthog';
import { requireCgvAcceptance } from '~~/server/utils/legal';

const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'expert']),
  billing: z.enum(['mois', 'an']).default('mois'),
  // Depuis l'onboarding (carte d'abord, avant le build) → on revient sur /onboarding
  // pour reprendre la configuration du rucher avec le plan désormais actif.
  context: z.enum(['onboarding']).optional(),
  // Acceptation des CGV au moment de la vente — obligatoire (preuve enregistrée).
  acceptCgv: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, checkoutSchema.parse);

  // Vente d'abonnement → acceptation CGV obligatoire + enregistrement de la preuve.
  await requireCgvAcceptance(event, user.id, body.acceptCgv);

  const appOrigin = resolveAppOrigin(event);
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

  // Filet anti-400 : si l'annuel n'est pas configuré (NUXT_STRIPE_PRICE_*_ANNUAL
  // absent), on REPLIE sur le mensuel plutôt que de renvoyer un cul-de-sac 400.
  // L'utilisateur peut toujours s'abonner (mensuel) au lieu d'être bloqué.
  let priceId: string;
  let effectiveBilling = body.billing;
  try {
    priceId = getPriceId(body.plan, effectiveBilling);
  } catch {
    if (effectiveBilling === 'an') {
      try {
        priceId = getPriceId(body.plan, 'mois');
        effectiveBilling = 'mois';
        console.warn(
          `[stripe checkout] prix annuel indisponible pour ${body.plan} → repli mensuel`,
        );
      } catch {
        throw createError({ statusCode: 400, message: 'Tarif indisponible pour ce plan.' });
      }
    } else {
      throw createError({ statusCode: 400, message: 'Tarif indisponible pour ce plan.' });
    }
  }

  // 2 mois offerts (essai 60 j) sur Pro & Expert au mensuel, une seule fois par compte.
  // La carte est capturée maintenant, débitée automatiquement à la fin de l'essai.
  // L'annuel n'a pas d'essai : la remise −20 % est déjà dans le prix.
  const isTrial =
    effectiveBilling === 'mois' &&
    (body.plan === 'pro' || body.plan === 'expert') &&
    !profil.trialUsed;

  const cycle = effectiveBilling === 'an' ? 'annual' : 'monthly';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    // Champ « Code promo » natif Stripe (sponsoring) — incompatible avec `discounts`,
    // qu'on ne passe pas. La remise s'applique sur la page de paiement Stripe.
    allow_promotion_codes: true,
    // Double verrou CGV côté Stripe (case à cocher native). Activé seulement si
    // NUXT_STRIPE_TOS_REQUIRED=true ET l'URL des CGV est configurée dans le Dashboard
    // Stripe (sinon l'API renvoie une erreur). Notre propre case + preuve en base reste
    // le mécanisme principal.
    ...(process.env.NUXT_STRIPE_TOS_REQUIRED === 'true'
      ? { consent_collection: { terms_of_service: 'required' as const } }
      : {}),
    success_url:
      body.context === 'onboarding'
        ? `${appOrigin}/onboarding?checkout=success`
        : `${appOrigin}/parametres/abonnement?success=1`,
    cancel_url:
      body.context === 'onboarding'
        ? `${appOrigin}/onboarding?canceled=1`
        : `${appOrigin}/parametres/abonnement?canceled=1`,
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
