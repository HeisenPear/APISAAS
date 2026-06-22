import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';
import { WORKSPACE_COOKIE, workspaceLabel, type WorkspaceRole } from '~~/server/utils/workspace';

/**
 * Liste les espaces de travail accessibles à l'acteur : le sien + ceux où il
 * est membre accepté. Sert au sélecteur d'espace.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const active = getCookie(event, WORKSPACE_COOKIE) || user.id;

  const [me] = await db
    .select({ nom: profils.nom, prenom: profils.prenom, email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  const espaces: Array<{
    ownerId: string;
    label: string;
    role: WorkspaceRole;
    isOwner: boolean;
    isActive: boolean;
  }> = [
    {
      ownerId: user.id,
      label: `${workspaceLabel(me?.prenom, me?.nom, me?.email)} — mon exploitation`,
      role: 'owner',
      isOwner: true,
      isActive: active === user.id,
    },
  ];

  const memberships = await db
    .select({
      ownerId: membres.ownerId,
      role: membres.role,
      ownerNom: profils.nom,
      ownerPrenom: profils.prenom,
      ownerEmail: profils.email,
    })
    .from(membres)
    .leftJoin(profils, eq(membres.ownerId, profils.id))
    .where(and(eq(membres.userId, user.id), eq(membres.statut, 'acceptee')));

  for (const m of memberships) {
    espaces.push({
      ownerId: m.ownerId,
      label: workspaceLabel(m.ownerPrenom, m.ownerNom, m.ownerEmail),
      role: m.role,
      isOwner: false,
      isActive: active === m.ownerId,
    });
  }

  return { data: espaces };
});
