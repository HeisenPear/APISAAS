import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { supabaseAdmin } from '~~/server/utils/supabase';

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event);

  const targetIdRaw = getRouterParam(event, 'id');
  const targetIdParse = z.string().uuid().safeParse(targetIdRaw);
  if (!targetIdParse.success) {
    throw createError({ statusCode: 400, message: 'ID invalide' });
  }
  const targetId = targetIdParse.data;

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

  if (error) {
    const notFound =
      error.message?.toLowerCase().includes('not found') ||
      error.message?.toLowerCase().includes('user not found') ||
      (error as unknown as { status?: number }).status === 404;

    if (!notFound) {
      throw createError({ statusCode: 500, message: error.message });
    }

    // L'utilisateur n'existe plus dans auth.users (profil orphelin) — on nettoie manuellement
    await db.delete(profils).where(eq(profils.id, targetId));
  }

  return { success: true };
});
