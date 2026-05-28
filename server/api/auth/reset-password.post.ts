import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { logAudit } from '~~/server/utils/audit';

const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, resetPasswordSchema.parse);

  const supabase = await serverSupabaseClient(event);
  const config = useRuntimeConfig();

  const redirectTo = `${config.public.baseUrl}/reset-password/confirm`;

  // Fire and forget — on ne revele jamais si l'email existe ou pas (anti-enumeration).
  // Le rate-limit IP (3 req/h/IP) couvre les tentatives massives ; on log quand meme
  // pour avoir une trace en cas d'enumeration ciblee.
  await supabase.auth.resetPasswordForEmail(body.email, { redirectTo });

  await logAudit({
    event,
    action: 'auth.password_reset_requested',
    userId: null,
    metadata: { email: body.email },
  });

  return { success: true };
});
