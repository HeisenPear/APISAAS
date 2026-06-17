import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { supabaseAdmin } from '~~/server/utils/supabase';
import { logAudit } from '~~/server/utils/audit';

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
    .select({
      stripeSubscriptionId: profils.stripeSubscriptionId,
      stripeCustomerId: profils.stripeCustomerId,
    })
    .from(profils)
    .where(eq(profils.id, targetId))
    .limit(1);

  // Annuler les abonnements Stripe (best-effort, sans bloquer la suppression).
  // IMPORTANT : on annule TOUS les abonnements du client, pas seulement celui
  // enregistré en base — un webhook manqué peut avoir laissé un abonnement payé
  // non suivi, qui continuerait à facturer la carte après la suppression.
  if (profil?.stripeCustomerId || profil?.stripeSubscriptionId) {
    const stripe = useStripe();
    try {
      if (profil.stripeCustomerId) {
        const subs = await stripe.subscriptions.list({
          customer: profil.stripeCustomerId,
          status: 'all',
          limit: 20,
        });
        for (const s of subs.data) {
          if (['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) {
            await stripe.subscriptions.cancel(s.id).catch(() => null);
          }
        }
      } else if (profil.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(profil.stripeSubscriptionId).catch(() => null);
      }
    } catch {
      /* l'annulation Stripe ne doit jamais bloquer la suppression du compte */
    }
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

  await logAudit({
    event,
    action: 'admin.user_deleted',
    userId: user.id,
    resourceType: 'user',
    resourceId: targetId,
    metadata: { adminEmail: user.email },
  });

  return { success: true };
});
