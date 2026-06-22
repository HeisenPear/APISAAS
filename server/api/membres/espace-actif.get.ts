import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { resolveWorkspace, workspaceLabel } from '~~/server/utils/workspace';
import { isAdminEmail } from '~~/app/config/admin';

/**
 * Contexte de l'espace actif : propriétaire effectif, rôle, et PLAN EFFECTIF
 * (celui du propriétaire) — permet au client de débloquer les bonnes features
 * quand on travaille dans l'espace d'autrui.
 */
export default defineEventHandler(async (event) => {
  const ws = await resolveWorkspace(event);

  const [owner] = await db
    .select({
      plan: profils.plan,
      nom: profils.nom,
      prenom: profils.prenom,
      email: profils.email,
    })
    .from(profils)
    .where(eq(profils.id, ws.ownerId))
    .limit(1);

  return {
    ownerId: ws.ownerId,
    role: ws.role,
    isOwner: ws.isOwner,
    plan: owner?.plan ?? 'decouverte',
    label: workspaceLabel(owner?.prenom, owner?.nom, owner?.email),
    isAdmin: isAdminEmail(ws.actorEmail),
  };
});
