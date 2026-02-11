import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';

const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, resetPasswordSchema.parse);

  const supabase = await serverSupabaseClient(event);
  const config = useRuntimeConfig();

  const redirectTo = `${config.public.baseUrl}/reset-password/confirm`;

  // Fire and forget -- we never reveal whether the email exists
  await supabase.auth.resetPasswordForEmail(body.email, { redirectTo });

  return { success: true };
});
