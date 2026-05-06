import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe, getPriceId } from '~~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const stripe = useStripe();
  const config = useRuntimeConfig();

  const [profil] = await db
    .select({
      email: profils.email,
      nom: profils.nom,
      prenom: profils.prenom,
      trialUsed: profils.trialUsed,
      stripeCustomerId: profils.stripeCustomerId,
    })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil) return notFound('Profil introuvable');

  if (profil.trialUsed) {
    throw createError({ statusCode: 409, message: 'Vous avez déjà utilisé votre essai gratuit. Souscrivez directement à un plan payant.' });
  }

  // Créer ou récupérer le customer Stripe
  let customerId = profil.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profil.email,
      name: [profil.prenom, profil.nom].filter(Boolean).join(' ') || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(profils)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(profils.id, user.id));
  }

  // Checkout en mode subscription avec 60 jours de trial — la carte est capturée maintenant,
  // débitée automatiquement par Stripe à la fin du trial.
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: getPriceId('pro'), quantity: 1 }],
    subscription_data: {
      trial_period_days: 60,
      metadata: { userId: user.id, plan: 'pro', isTrial: 'true' },
    },
    payment_method_collection: 'always',
    success_url: `${config.public.baseUrl}/onboarding?trial=activated`,
    cancel_url: `${config.public.baseUrl}/activer-essai?canceled=1`,
    metadata: { userId: user.id, plan: 'pro', isTrial: 'true' },
  });

  return { data: { url: session.url } };
});
