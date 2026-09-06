import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

const acceptSchema = z.object({
  membreId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, acceptSchema.parse);

  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil) return notFound('Profil introuvable');

  /**
   * ⚠️ LE CONTRÔLE ÉTAIT FAIT, PUIS OUBLIÉ.
   *
   * Un SELECT vérifiait l'e-mail de l'invité et le statut « en_attente », puis
   * un UPDATE distinct ne filtrait plus que sur l'identifiant. Entre les deux,
   * rien : pas de transaction, pas de re-vérification. Le propriétaire qui
   * révoquait l'invitation dans cet intervalle la voyait acceptée quand même.
   *
   * Sa jumelle `refuser.post.ts` portait déjà la bonne forme : UN SEUL ordre
   * conditionnel, dont le `where` EST le contrôle. On l'aligne dessus — la
   * lecture préalable ne servait qu'à distinguer un message d'erreur que
   * `returning()` donne aussi bien.
   */
  const [updated] = await db
    .update(membres)
    .set({
      userId: user.id,
      statut: 'acceptee',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(membres.id, body.membreId),
        eq(membres.email, profil.email),
        eq(membres.statut, 'en_attente'),
      ),
    )
    .returning();

  if (!updated) return notFound('Invitation introuvable ou deja traitee');

  return { data: updated };
});
