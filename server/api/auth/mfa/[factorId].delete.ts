import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { logAudit } from '~~/server/utils/audit';

/**
 * DELETE /api/auth/mfa/[factorId]
 *
 * Desactive un facteur MFA (unenroll). Action sensible : exige une session
 * recente (cf. requireFreshAuth) pour eviter qu'un attaquant qui aurait
 * vole un token longue-duree ne puisse pas desactiver la 2FA.
 *
 * TODO : envoyer un email "2FA desactivee" via Brevo apres unenroll
 * pour alerter le user en cas de desactivation non autorisee.
 */
export default defineEventHandler(async (event) => {
  // Desactiver son 2FA est une action sensible — exige une session AAL2
  const user = await requireMFA(event);

  const factorIdParse = z.string().uuid().safeParse(getRouterParam(event, 'factorId'));
  if (!factorIdParse.success) {
    throw createError({ statusCode: 400, message: 'factorId invalide' });
  }
  const factorId = factorIdParse.data;

  const supabase = await serverSupabaseClient(event);
  const { error } = await supabase.auth.mfa.unenroll({ factorId });

  if (error) {
    throw createError({ statusCode: 400, message: error.message });
  }

  await logAudit({
    event,
    action: 'mfa.disabled',
    userId: user.id,
    resourceType: 'mfa_factor',
    resourceId: factorId,
  });

  return { success: true };
});
