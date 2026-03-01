import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

const inviteSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  role: z.enum(['apiculteur', 'comptable']).default('apiculteur'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, inviteSchema.parse);

  // Can't invite yourself
  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (profil?.email === body.email) {
    return badRequest('Vous ne pouvez pas vous inviter vous-meme');
  }

  // Check if already invited
  const [existing] = await db
    .select({ id: membres.id, statut: membres.statut })
    .from(membres)
    .where(and(eq(membres.ownerId, user.id), eq(membres.email, body.email)))
    .limit(1);

  if (existing) {
    if (existing.statut === 'en_attente') {
      return badRequest('Cette personne a deja une invitation en attente');
    }
    if (existing.statut === 'acceptee') {
      return badRequest('Cette personne fait deja partie de votre equipe');
    }
  }

  // Check if the invitee has an account
  const [invitee] = await db
    .select({ id: profils.id })
    .from(profils)
    .where(eq(profils.email, body.email))
    .limit(1);

  const [created] = await db
    .insert(membres)
    .values({
      ownerId: user.id,
      userId: invitee?.id ?? null,
      email: body.email,
      role: body.role,
      statut: 'en_attente',
    })
    .returning();

  if (!created) return internalError('Erreur lors de la creation');

  setResponseStatus(event, 201);
  return { data: created };
});
