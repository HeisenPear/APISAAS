import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const profil = await db.query.profils.findFirst({
    where: eq(profils.id, user.id),
  });

  if (!profil) {
    notFound('Profil introuvable');
  }

  // Contexte espace de travail. Un membre d'équipe opère sous l'abonnement du
  // propriétaire : on expose le plan EFFECTIF (celui qui gouverne l'accès aux
  // fonctionnalités) dès le profil, chargé à chaque ouverture de l'app. Le
  // gating est ainsi correct IMMÉDIATEMENT et sur toutes les plateformes
  // (desktop + mobile/PWA), sans dépendre du fetch tardif de /subscription/usage.
  // Pour un compte solo, ownerId === user.id → effectivePlan = plan personnel.
  const ws = await resolveWorkspace(event);
  let effectivePlan = profil.plan;
  let workspaceOwnerName: string | null = null;
  if (ws.isMember) {
    const owner = await db.query.profils.findFirst({
      where: eq(profils.id, ws.ownerId),
      columns: { plan: true, prenom: true, nom: true, email: true },
    });
    if (owner) {
      effectivePlan = owner.plan;
      workspaceOwnerName = [owner.prenom, owner.nom].filter(Boolean).join(' ') || owner.email;
    }
  }

  return {
    data: {
      ...profil,
      isAdmin: isAdminEmail(user.email),
      effectivePlan,
      isMember: ws.isMember,
      workspaceRole: ws.role,
      workspaceOwnerName,
    },
  };
});
