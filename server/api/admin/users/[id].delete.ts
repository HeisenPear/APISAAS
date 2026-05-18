import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { useStripe } from '~~/server/utils/stripe';
import { supabaseAdmin } from '~~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 404, message: 'Not found' });
  }

  const targetId = getRouterParam(event, 'id');
  if (!targetId) throw createError({ statusCode: 400, message: 'ID manquant' });

  // Empêcher l'admin de se supprimer lui-même
  if (targetId === user.id) {
    throw createError({ statusCode: 400, message: 'Impossible de supprimer son propre compte' });
  }

  const [profil] = await db
    .select({ stripeSubscriptionId: profils.stripeSubscriptionId })
    .from(profils)
    .where(eq(profils.id, targetId))
    .limit(1);

  // Annuler l'abonnement Stripe si actif (sans bloquer si ça échoue)
  if (profil?.stripeSubscriptionId) {
    const stripe = useStripe();
    await stripe.subscriptions.cancel(profil.stripeSubscriptionId).catch(() => null);
  }

  // Supprimer l'utilisateur Supabase Auth → cascade sur profils + toutes les données
  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);

  if (error) throw createError({ statusCode: 500, message: error.message });

  return { success: true };
});
