import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { logAudit } from '~~/server/utils/audit';

const verifySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'Code TOTP a 6 chiffres requis'),
});

/**
 * POST /api/auth/mfa/verify
 *
 * Valide un code TOTP. Deux cas d'usage :
 *   1. **Enrollment** : juste apres /enroll, l'user scanne le QR et entre
 *      le code de son app → si OK, le facteur passe en "verified".
 *   2. **Login** : apres signInWithPassword, Supabase impose le 2FA si un
 *      facteur verified existe → le user entre son code pour finaliser
 *      la session.
 *
 * Dans les deux cas, Supabase gere via challenge() + verify() :
 *   - challenge() cree un challenge associe au facteur
 *   - verify() valide le code contre le challenge
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, verifySchema.parse);
  const supabase = await serverSupabaseClient(event);

  // 1. Creer un challenge pour ce facteur
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: body.factorId,
  });

  if (challengeError) {
    await logAudit({
      event,
      action: 'mfa.verify_failed',
      userId: user.id,
      success: false,
      metadata: { reason: 'challenge_failed', error: challengeError.message },
    });
    throw createError({ statusCode: 400, message: challengeError.message });
  }

  // 2. Verifier le code contre le challenge
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: body.factorId,
    challengeId: challengeData.id,
    code: body.code,
  });

  if (error) {
    await logAudit({
      event,
      action: 'mfa.verify_failed',
      userId: user.id,
      success: false,
      metadata: { reason: 'code_invalid' },
    });
    throw createError({ statusCode: 401, message: 'Code invalide' });
  }

  await logAudit({ event, action: 'mfa.verified', userId: user.id });

  // data.access_token est present si on est en flow login (escalade AAL1 -> AAL2)
  return {
    data: {
      verified: true,
      // Si present, le client doit le stocker — il remplace l'access token AAL1
      accessToken: data?.access_token ?? null,
    },
  };
});
