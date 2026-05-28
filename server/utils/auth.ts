import type { H3Event } from 'h3';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { isAdminEmail } from '~~/app/config/admin';

export async function requireAuth(event: H3Event) {
  let user;
  try {
    user = await serverSupabaseUser(event);
  } catch {
    throw createError({ statusCode: 401, message: 'Non authentifie' });
  }
  if (!user) {
    throw createError({ statusCode: 401, message: 'Non authentifie' });
  }
  return user;
}

/**
 * Garde admin — verifie qu'un utilisateur authentifie est dans la whitelist.
 * Retourne 403 (et non 404) pour ne pas laisser deviner l'existence des
 * endpoints, et garder un comportement coherent avec requireAuth.
 */
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event);
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, message: 'Acces refuse' });
  }
  return user;
}

/**
 * Garde MFA — exige que la session courante ait passe un challenge TOTP.
 *
 * Supabase utilise les niveaux AAL (Authenticator Assurance Level) :
 *   - AAL1 = mot de passe seulement
 *   - AAL2 = mot de passe + 2FA
 *
 * Une route protegee par requireMFA refuse les sessions AAL1 si un facteur
 * verified existe pour le user. A utiliser pour : suppression de compte,
 * changement d'email, desactivation 2FA, actions admin.
 *
 * Pour l'instant non-bloquant si aucun facteur MFA n'est enrolle (sinon
 * impossible de l'activer la premiere fois).
 */
export async function requireMFA(event: H3Event) {
  const user = await requireAuth(event);
  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) {
    throw createError({ statusCode: 500, message: 'MFA check failed' });
  }

  // `nextLevel = aal2` signifie qu'un facteur verified existe et qu'on
  // attend une elevation. Si la session courante est aal1, on refuse.
  if (data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
    throw createError({
      statusCode: 401,
      statusMessage: 'MFA Required',
      message: 'Verification 2FA requise pour cette action',
      data: { requiresMfa: true },
    });
  }

  return user;
}
