import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { LEGAL_VERSIONS } from '~~/app/config/legal';
import { logAudit } from '~~/server/utils/audit';

/**
 * Exige et enregistre l'acceptation des CGV au moment de la VENTE (souscription d'un
 * abonnement payant ou d'un essai avec carte). Constitue la preuve opposable :
 * horodatage + version acceptée sur le profil + entrée d'audit (avec IP).
 *
 * À appeler AVANT de créer la session de paiement Stripe.
 */
export async function requireCgvAcceptance(
  event: H3Event,
  userId: string,
  acceptCgv: boolean | undefined,
): Promise<void> {
  if (acceptCgv !== true) {
    throw createError({
      statusCode: 403,
      statusMessage: 'CGV non acceptées',
      message: 'Vous devez accepter les Conditions Générales de Vente pour souscrire.',
    });
  }

  const now = new Date();
  await db
    .update(profils)
    .set({ cgvAcceptedAt: now, cgvVersion: LEGAL_VERSIONS.cgv, updatedAt: now })
    .where(eq(profils.id, userId));

  await logAudit({
    event,
    action: 'legal.cgv_accepted',
    userId,
    metadata: { version: LEGAL_VERSIONS.cgv, context: 'checkout' },
  });
}
