import { serverSupabaseClient } from '#supabase/server';

/**
 * POST /api/auth/mfa/enroll
 *
 * Demarre l'enrollment d'un facteur MFA (TOTP — Google Authenticator,
 * Authy, 1Password…). Supabase genere :
 *   - un secret (`secret`)
 *   - un QR code (`qr_code`) au format SVG, a afficher au user
 *   - un id de facteur a passer a /verify pour confirmer
 *
 * Le facteur reste "unverified" tant que l'user n'a pas valide un
 * premier code TOTP via /verify.
 *
 * /!\ Cette route doit etre appelee avec une session active (cookie Supabase).
 */
export default defineEventHandler(async (event) => {
  // requireAuth garantit qu'on a un user connecte (sinon 401)
  await requireAuth(event);

  const supabase = await serverSupabaseClient(event);
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'APIGO TOTP',
  });

  if (error) {
    throw createError({ statusCode: 400, message: error.message });
  }

  return {
    data: {
      factorId: data.id,
      type: data.type,
      // Le QR code est un SVG inline — affichable directement avec <img :src="qrCode">
      // (le client encode en base64 si besoin via `data:image/svg+xml;base64,...`)
      qrCode: data.totp.qr_code,
      secret: data.totp.secret, // afficher en alternative au QR (saisie manuelle)
      uri: data.totp.uri, // otpauth:// — peut etre directement scanne par certaines apps
    },
  };
});
