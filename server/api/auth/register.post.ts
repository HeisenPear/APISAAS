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
    throw createError({ statusCode: 422, message: 'Les adresses email temporaires ne sont pas acceptées.' });
  }

  // admin.createUser + email_confirm:true — pas de validation email pour l'instant
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
      conflict('Un compte avec cet email existe déjà. Connectez-vous ou réinitialisez votre mot de passe.');
    }
    badRequest(authError.message);
  }

  if (!authData?.user) {
    internalError('Erreur lors de la création du compte');
  }

  // Idempotence : profil déjà créé lors d'une tentative précédente
  const existing = await db.query.profils.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, authData.user!.id),
    columns: { id: true },
  });
  if (existing) return { data: existing };

  const [profil] = await db
    .insert(profils)
    .values({
      id: authData.user!.id,
      email: body.email,
      nom: body.nom,
      prenom: body.prenom,
      plan: 'decouverte',
    })
    .returning();

  if (!profil) internalError('Erreur lors de la création du profil');

  return { data: profil };
});
