import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);

  const { error } = await supabase.auth.signOut();

  if (error) {
    internalError('Erreur lors de la deconnexion');
  }

  return { success: true };
});
