import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';
import { useServerPostHog } from '~~/server/utils/posthog';

const inviteSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  role: z.enum(['admin', 'apiculteur', 'comptable']).default('apiculteur'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, inviteSchema.parse);

  const [profil] = await db
    .select({ email: profils.email, prenom: profils.prenom, nom: profils.nom })
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

  // Email d'invitation (non bloquant : un échec d'envoi ne casse pas l'invite).
  const ownerName = [profil?.prenom, profil?.nom].filter(Boolean).join(' ') || 'Un apiculteur';
  try {
    await sendTeamInvitationEmail({ to: body.email, ownerName, role: body.role });
  } catch (err) {
    console.error('[membres/inviter] envoi email invitation échoué', String(err));
  }

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'member_invited',
    properties: {
      $session_id: sessionId,
      role: body.role,
    },
  });

  setResponseStatus(event, 201);
  return { data: created };
});
