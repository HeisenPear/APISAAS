import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe, getPriceId, classifierErreurCheckout } from '~~/server/utils/stripe';
import { requireCgvAcceptance } from '~~/server/utils/legal';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const stripe = useStripe();
  const appOrigin = resolveAppOrigin(event);

  // Depuis l'onboarding (carte d'abord, avant le build), l'annulation doit revenir
  // sur l'onboarding pour reprendre le parcours — pas sur la page /activer-essai.
  //
  // `?? {}` INDISPENSABLE : sur un POST sans corps, `readBody` ne lève pas —
  // il RÉSOUT sur `undefined`. Le `.catch()` ne se déclenchait donc jamais et
  // la ligne suivante plantait en 500. L'onboarding appelait précisément cette
  // route sans corps : l'Essai Pro, l'option proposée PAR DÉFAUT sur l'écran
  // des formules, échouait à tous les coups.
  const body =
    (await readBody<{ context?: string; acceptCgv?: boolean }>(event).catch(() => undefined)) ?? {};
  const fromOnboarding = body.context === 'onboarding';

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
    throw createError({
      statusCode: 409,
      message:
        'Vous avez déjà utilisé votre essai gratuit. Souscrivez directement à un plan payant.',
    });
  }

  // Essai avec capture de carte = vente → acceptation CGV obligatoire + preuve enregistrée.
  await requireCgvAcceptance(event, user.id, body.acceptCgv);

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
  const priceId = getPriceId('pro');
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 60,
        metadata: { userId: user.id, plan: 'pro', isTrial: 'true' },
      },
      payment_method_collection: 'always',
      ...(process.env.NUXT_STRIPE_TOS_REQUIRED === 'true'
        ? { consent_collection: { terms_of_service: 'required' as const } }
        : {}),
      success_url: `${appOrigin}/onboarding?trial=activated`,
      cancel_url: fromOnboarding
        ? `${appOrigin}/onboarding?canceled=1`
        : `${appOrigin}/activer-essai?canceled=1`,
      metadata: { userId: user.id, plan: 'pro', isTrial: 'true' },
    });
  } catch (err) {
    // Même garde que /api/stripe/checkout : un tarif Pro injouable renvoie un
    // message clair plutôt qu'un 500. L'essai est l'entrée par défaut de
    // l'onboarding — il ne doit jamais planter en silence.
    const connu = classifierErreurCheckout(err);
    if (!connu) throw err;
    console.error(connu.messageOps, { plan: 'pro', trial: true, priceId });
    throw createError({ statusCode: connu.statusCode, statusMessage: connu.messageClient });
  }

  return { data: { url: session.url } };
});
