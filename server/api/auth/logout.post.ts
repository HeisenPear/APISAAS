import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { supabaseAdmin } from '~~/server/utils/supabase';
import { logAudit } from '~~/server/utils/audit';

export default defineEventHandler(async (event) => {
  // On lit l'utilisateur AVANT le signOut local pour pouvoir revoquer
  // toutes ses sessions cote Supabase (global signout — invalide aussi
  // les refresh tokens, ce que signOut() local ne fait pas).
  const user = await serverSupabaseUser(event).catch(() => null);

  const supabase = await serverSupabaseClient(event);
  const { error } = await supabase.auth.signOut();

  if (error) {
    internalError('Erreur lors de la deconnexion');
  }

  if (user?.id) {
    // Revocation globale — best-effort, on n'echoue pas si l'admin API repond mal.
    await supabaseAdmin.auth.admin.signOut(user.id, 'global').catch(() => null);
    await logAudit({ event, action: 'auth.logout', userId: user.id });
  }

  return { success: true };
});
