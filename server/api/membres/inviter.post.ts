import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

const inviteSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  role: z.enum(['admin', 'apiculteur', 'comptable']).default('apiculteur'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, inviteSchema.parse);

  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (profil?.email === body.email) {
    return badRequest('Vous ne pouvez pas vous inviter vous-meme');
  }

  const [existing] = await db
    .select({ id: membres.id, statut: membres.statut })
    .from(membres)
    .where(and(eq(membres.ownerId, user.id), eq(membres.email, body.email)))
    .limit(1);

  if (existing?.statut === 'en_attente') return badRequest('Invitation deja en attente');
  if (existing?.statut === 'acceptee') return badRequest('Deja membre de votre equipe');

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

  setResponseStatus(event, 201);
  return { data: created };
});
