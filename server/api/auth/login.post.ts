import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';

const loginSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);

  const supabase = await serverSupabaseClient(event);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error) {
    unauthorized('Email ou mot de passe incorrect');
  }

  return {
    data: {
      user: data.user,
      session: data.session,
    },
  };
});
