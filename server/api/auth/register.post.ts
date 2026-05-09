import { z } from 'zod';
import { eq } from 'drizzle-orm';
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

  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email: body.email,
    password: body.password,
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      conflict('Un compte avec cet email existe déjà. Connectez-vous ou réinitialisez votre mot de passe.');
    }
    badRequest(authError.message);
  }

  let userId: string;

  if (!authData?.user) {
    // Supabase retourne user=null quand l'email existe déjà dans auth.users
    // (protection anti-énumération). On cherche si c'est un compte non confirmé.
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const stuck = listData?.users?.find(u => u.email?.toLowerCase() === body.email);

    if (!stuck) {
      conflict('Un compte avec cet email existe déjà. Connectez-vous ou réinitialisez votre mot de passe.');
    }

    if (stuck.email_confirmed_at) {
      // Compte confirmé — vrai conflit, ne pas écraser
      conflict('Un compte avec cet email existe déjà. Connectez-vous ou réinitialisez votre mot de passe.');
    }

    // Compte non confirmé (inscription bloquée) — suppression + recréation
    await supabaseAdmin.auth.admin.deleteUser(stuck.id);
    await db.delete(profils).where(eq(profils.id, stuck.id));

    const { data: retry, error: retryError } = await supabaseAdmin.auth.signUp({
      email: body.email,
      password: body.password,
    });

    if (retryError || !retry?.user) {
      internalError('Erreur lors de la recréation du compte. Réessayez dans quelques minutes.');
    }

    userId = retry.user!.id;
  } else {
    userId = authData.user.id;
  }

  // Idempotence : si le profil existe déjà (tentative précédente partiellement réussie)
  const existing = await db.query.profils.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.id, userId),
    columns: { id: true },
  });
  if (existing) return { data: existing };

  const [profil] = await db
    .insert(profils)
    .values({
      id: userId,
      email: body.email,
      nom: body.nom,
      prenom: body.prenom,
      plan: 'decouverte',
    })
    .returning();

  if (!profil) internalError('Erreur lors de la création du profil');

  return { data: profil };
});
