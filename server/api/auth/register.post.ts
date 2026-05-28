import { z } from 'zod';
import { profils } from '~~/server/database/schema';
import { isDisposableEmail } from '~~/server/utils/disposable-emails';
import { supabaseAdmin } from '~~/server/utils/supabase';
import { logAudit } from '~~/server/utils/audit';

const registerSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  // Politique mot de passe : 10 chars min + 3 classes parmi (maj, min, chiffre, special).
  // Volontairement plus permissif que NIST strict pour eviter de bloquer les utilisateurs
  // sur des formulaires deja debugues — mais bloque les mots de passe triviaux.
  password: z
    .string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .max(128, 'Le mot de passe est trop long')
    .refine(
      (p) => {
        const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
          re.test(p),
        ).length;
        return classes >= 3;
      },
      {
        message:
          'Le mot de passe doit contenir au moins 3 types parmi : minuscule, majuscule, chiffre, caractère spécial',
      },
    ),
  nom: z.string().min(1, 'Le nom est requis').max(100).trim(),
  prenom: z.string().min(1, 'Le prénom est requis').max(100).trim(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse);

  if (isDisposableEmail(body.email)) {
    throw createError({
      statusCode: 422,
      message: 'Les adresses email temporaires ne sont pas acceptées.',
    });
  }

  // Choix produit : email_confirm:true active le compte immediatement.
  //
  // Pourquoi : retirer ce flag declenche l'envoi d'un mail de confirmation Supabase,
  // mais le frontend (app/pages/register.vue) appelle ensuite signInWithPassword()
  // qui echoue avec "Email not confirmed" => le client recoit le mail ET voit
  // une erreur. De plus, Supabase free tier limite les emails sortants (~4/h).
  //
  // Compensations en place :
  //   - rate-limit register : 3 req/h/IP (middleware 03.rate-limit.ts)
  //   - disposable-emails blocklist (isDisposableEmail)
  //   - politique mot de passe : 10 chars + 3 classes
  //
  // TODO (post-launch) : refactor le flow front en "double opt-in" :
  //   1. retirer email_confirm:true
  //   2. supprimer le signInWithPassword auto dans register.vue
  //   3. afficher un ecran "Verifie ton email" puis laisser confirm.vue (PKCE) gerer
  //   4. ajouter captcha Turnstile/hCaptcha sur le formulaire
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already been registered') ||
      msg.includes('already exists')
    ) {
      conflict(
        'Un compte avec cet email existe déjà. Connectez-vous ou réinitialisez votre mot de passe.',
      );
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

  await logAudit({
    event,
    action: 'account.created',
    userId: profil.id,
    metadata: { email: body.email, plan: 'decouverte' },
  });

  return { data: profil };
});
