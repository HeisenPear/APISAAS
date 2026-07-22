import { serverSupabaseClient } from '#supabase/server';

/**
 * GET /api/auth/mfa/factors
 *
 * Liste les facteurs MFA enrolles par l'utilisateur.
 * Le client utilise ca pour :
 *   - afficher si 2FA est active dans Parametres
 *   - savoir s'il y a un facteur a presenter au login (assuranceLevel)
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return {
    data: {
      // totp[] et phone[] (Supabase ne supporte phone qu'en plan paye)
      totp: (data?.totp ?? []).map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name,
        status: f.status, // 'verified' | 'unverified'
        createdAt: f.created_at,
      })),
    },
  };
});
