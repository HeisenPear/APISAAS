import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { supabaseAdmin } from '~~/server/utils/supabase';

const bodySchema = z.object({
  password: z.string().min(1, 'Mot de passe requis'),
});

/**
 * DELETE /api/profils/me
 *
 * Suppression self-service du compte utilisateur (conformite RGPD article 17).
 *
 * Effets :
 *   - annule l'abonnement Stripe actif (best effort)
 *   - supprime l'utilisateur Supabase Auth
 *   - le cascade onDelete du schema supprime toutes les donnees liees
 *     (ruchers, ruches, interventions, recoltes, stocks, transactions...)
 *
 * Le mot de passe est demande en confirmation pour eviter une suppression
 * accidentelle (CSRF + protection contre XSS qui aurait recupere une session).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  if (!user.email) {
    throw createError({ statusCode: 500, message: 'Email utilisateur introuvable' });
  }

  // Reverification du mot de passe via Supabase
  const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: user.email,
    password: body.password,
  });

  if (signInError) {
    throw createError({ statusCode: 401, message: 'Mot de passe incorrect' });
  }

  // Annulation Stripe (best effort — n'empeche pas la suppression si echec)
  const [profil] = await db
    .select({ stripeSubscriptionId: profils.stripeSubscriptionId })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (profil?.stripeSubscriptionId) {
    const stripe = useStripe();
    await stripe.subscriptions.cancel(profil.stripeSubscriptionId).catch(() => null);
  }

  // Suppression Supabase Auth — cascade sur profils + toutes les donnees liees
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    const notFoundMsg =
      deleteError.message?.toLowerCase().includes('not found') ||
      (deleteError as unknown as { status?: number }).status === 404;

    if (!notFoundMsg) {
      throw createError({ statusCode: 500, message: deleteError.message });
    }

    // Profil orphelin (Supabase Auth deja vide) — nettoyage manuel
    await db.delete(profils).where(eq(profils.id, user.id));
  }

  return { success: true };
});
