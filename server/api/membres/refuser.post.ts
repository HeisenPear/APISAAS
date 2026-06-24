import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

const schema = z.object({ membreId: z.string().uuid() });

/**
 * Refuser une invitation reçue. Comme accepter.post.ts, on autorise l'INVITÉ
 * (identifié par son email) à supprimer l'invitation en attente — pas seulement
 * le propriétaire (qui passe, lui, par DELETE /api/membres/[id]).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);
  if (!profil) return notFound('Profil introuvable');

  const [deleted] = await db
    .delete(membres)
    .where(
      and(
        eq(membres.id, body.membreId),
        eq(membres.email, profil.email),
        eq(membres.statut, 'en_attente'),
      ),
    )
    .returning({ id: membres.id });

  if (!deleted) return notFound('Invitation introuvable ou déjà traitée');
  return { data: { success: true } };
});
