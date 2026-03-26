import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { profils } from '~~/server/database/schema';

const registerSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
  nom: z.string().min(1, 'Le nom est requis').trim(),
  prenom: z.string().min(1, 'Le prenom est requis').trim(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse);

  const supabase = await serverSupabaseClient(event);

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      conflict('Un compte avec cet email existe deja');
    }
    badRequest(authError.message);
  }

  if (!authData.user) {
    internalError('Erreur lors de la creation du compte');
  }

  // Activer le trial Pro 2 mois dès l'inscription
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Insert profile row linked to Supabase auth user
  const [profil] = await db
    .insert(profils)
    .values({
      id: authData.user.id,
      email: body.email,
      nom: body.nom,
      prenom: body.prenom,
      plan: 'pro',
      trialActive: true,
      trialStartedAt: now,
      trialEndsAt,
      trialUsed: true,
    })
    .returning();

  if (!profil) {
    internalError('Erreur lors de la creation du profil');
  }

  return { data: profil };
});
