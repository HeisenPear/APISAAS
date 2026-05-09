import { z } from 'zod';
import { profils } from '~~/server/database/schema';
import { isDisposableEmail } from '~~/server/utils/disposable-emails';
import { supabaseAdmin } from '~~/server/utils/supabase';

const registerSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(1, 'Le nom est requis').trim(),
  prenom: z.string().min(1, 'Le prénom est requis').trim(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse);

  if (isDisposableEmail(body.email)) {
    throw createError({ statusCode: 422, message: 'Les adresses email temporaires ne sont pas acceptées. Utilisez votre email professionnel.' });
  }

  // Utiliser supabaseAdmin (service role) pour le signup serveur-side — plus fiable
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('user already registered')) {
      conflict('Un compte avec cet email existe déjà');
    }
    if (authError.status === 422 || authError.message.toLowerCase().includes('invalid')) {
      badRequest(authError.message);
    }
    badRequest(authError.message);
  }

  if (!authData.user) {
    internalError('Erreur lors de la création du compte');
  }

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
