import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { profils } from '~~/server/database/schema';
import { isDisposableEmail } from '~~/server/utils/disposable-emails';

const registerSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(1, 'Le nom est requis').trim(),
  prenom: z.string().min(1, 'Le prénom est requis').trim(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse);

  // Bloquer les adresses email jetables
  if (isDisposableEmail(body.email)) {
    throw createError({ statusCode: 422, message: 'Les adresses email temporaires ne sont pas acceptées. Utilisez votre email professionnel.' });
  }

  const supabase = await serverSupabaseClient(event);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      conflict('Un compte avec cet email existe déjà');
    }
    badRequest(authError.message);
  }

  if (!authData.user) {
    internalError('Erreur lors de la création du compte');
  }

  // Compte créé en plan Découverte — le trial Pro est activé séparément via Stripe
  const [profil] = await db
    .insert(profils)
    .values({
      id: authData.user.id,
      email: body.email,
      nom: body.nom,
      prenom: body.prenom,
      plan: 'decouverte',
    })
    .returning();

  if (!profil) {
    internalError('Erreur lors de la création du profil');
  }

  return { data: profil };
});
