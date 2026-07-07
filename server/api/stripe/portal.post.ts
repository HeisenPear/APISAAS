import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const config = useRuntimeConfig();
  const stripe = useStripe();

  const [profil] = await db
    .select({ stripeCustomerId: profils.stripeCustomerId })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil?.stripeCustomerId) {
    return badRequest('Aucun abonnement actif');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profil.stripeCustomerId,
    return_url: `${config.public.baseUrl}/parametres/abonnement`,
  });

  return { data: { url: session.url } };
});
