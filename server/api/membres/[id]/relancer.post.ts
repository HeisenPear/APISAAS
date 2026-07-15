import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

/**
 * Relance l'email d'invitation d'un membre encore EN ATTENTE. Réservé au
 * propriétaire de l'espace (ownerId = utilisateur courant). Ne crée aucun
 * nouveau siège — c'est un simple renvoi d'email — donc pas de gating de plan.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('Identifiant manquant');

  const [membre] = await db
    .select({ email: membres.email, role: membres.role, statut: membres.statut })
    .from(membres)
    .where(and(eq(membres.id, id), eq(membres.ownerId, user.id)))
    .limit(1);

  if (!membre) return notFound('Invitation introuvable');
  if (membre.statut !== 'en_attente') {
    return badRequest('Ce membre a déjà rejoint votre équipe');
  }

  const [profil] = await db
    .select({ prenom: profils.prenom, nom: profils.nom })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);
  const ownerName = [profil?.prenom, profil?.nom].filter(Boolean).join(' ') || 'Un apiculteur';

  try {
    await sendTeamInvitationEmail({ to: membre.email, ownerName, role: membre.role });
  } catch (err) {
    console.error('[membres/relancer] envoi email invitation échoué', String(err));
    return internalError("L'email n'a pas pu être renvoyé. Réessayez plus tard.");
  }

  await db
    .update(membres)
    .set({ invitedAt: new Date(), updatedAt: new Date() })
    .where(eq(membres.id, id));

  return { data: { ok: true } };
});
