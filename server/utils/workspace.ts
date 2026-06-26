import type { H3Event } from 'h3';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';
import { hasFeature, type Plan } from '~~/app/config/plans';
import {
  rolePeutEcrire,
  messageAccesRefuse,
  type WorkspaceRole,
  type DomaineEcriture,
} from '~~/app/config/roles';

export type { WorkspaceRole, DomaineEcriture };

export interface Workspace {
  /** Compte dont les données forment l'espace de travail courant (le propriétaire). */
  ownerId: string;
  /** Utilisateur authentifié. */
  userId: string;
  /** Rôle dans l'espace : 'owner' si c'est son propre espace, sinon le rôle du membre. */
  role: WorkspaceRole;
  /** true si l'utilisateur agit comme membre d'un espace partagé (pas le sien). */
  isMember: boolean;
}

/**
 * Résout l'espace de travail courant.
 *
 * Un utilisateur ayant accepté une invitation (membres.statut='acceptee')
 * opère dans l'espace du propriétaire : il voit et gère les données du
 * `ownerId`, pas les siennes. Sinon il est dans son propre espace (owner).
 *
 * NB : l'isolation locataire de l'app passe par le scoping `userId` côté code
 * (le client Drizzle utilise une connexion service-role qui bypasse la RLS),
 * donc rescoper sur `ownerId` ici suffit à partager l'espace — pas de RLS à
 * modifier.
 *
 * Résultat mémoïsé sur `event.context` pour éviter une 2e requête dans la
 * même requête HTTP.
 */
export async function resolveWorkspace(event: H3Event): Promise<Workspace> {
  const cached = event.context.__workspace as Workspace | undefined;
  if (cached) return cached;

  const user = await requireAuth(event);

  const [membership] = await db
    .select({ ownerId: membres.ownerId, role: membres.role })
    .from(membres)
    .where(and(eq(membres.userId, user.id), eq(membres.statut, 'acceptee')))
    .limit(1);

  const ws: Workspace = membership
    ? { ownerId: membership.ownerId, userId: user.id, role: membership.role, isMember: true }
    : { ownerId: user.id, userId: user.id, role: 'owner', isMember: false };

  event.context.__workspace = ws;
  return ws;
}

/** Raccourci : id du compte dont les données forment l'espace courant. */
export async function resolveOwnerId(event: H3Event): Promise<string> {
  return (await resolveWorkspace(event)).ownerId;
}

/**
 * Garde-fou écriture, sensible au DOMAINE (rôles & accès granulaires Expert).
 * Par défaut `terrain` (rucher) ; les routes commerce (facturation, clients,
 * bons de livraison) passent `'commerce'`. Owner/admin/apiculteur écrivent
 * partout ; technicien = terrain, comptable = commerce, lecture = rien.
 * Lève un 403 sinon. Renvoie le workspace pour enchaîner sur `ws.ownerId`.
 */
export async function assertCanWrite(
  event: H3Event,
  domaine: DomaineEcriture = 'terrain',
): Promise<Workspace> {
  const ws = await resolveWorkspace(event);
  if (!rolePeutEcrire(ws.role, domaine)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès refusé',
      message: messageAccesRefuse(ws.role, domaine),
    });
  }
  return ws;
}

/** Plan d'abonnement du propriétaire de l'espace (pour gater l'assignation de rôles). */
export async function planDuProprietaire(ownerId: string): Promise<Plan> {
  const [row] = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  return (row?.plan as Plan) ?? 'decouverte';
}

/** Le propriétaire peut-il assigner des rôles restreints (capacité Expert) ? */
export async function peutAssignerRolesRestreints(ownerId: string): Promise<boolean> {
  return hasFeature(await planDuProprietaire(ownerId), 'rolesEquipe');
}

/**
 * Valide qu'une FK fournie par le client (rucheId, rucherId, emplacementId…)
 * pointe bien vers un enregistrement de l'espace `ownerId` AVANT un insert /
 * update. Lève un 400 sinon. Empêche un compte de rattacher ses propres
 * données à la ressource d'un autre locataire (intégrité inter-tenant +
 * défense en profondeur — l'isolation étant 100 % code-level). No-op si `id`
 * est null/undefined (FK optionnelle non fournie).
 */
export async function assertFkBelongsToOwner(
  ownerId: string,
  table: PgTable,
  idColumn: PgColumn,
  ownerColumn: PgColumn,
  id: string | null | undefined,
  label = 'Ressource',
): Promise<void> {
  if (!id) return;
  const [row] = await db
    .select({ ok: idColumn })
    .from(table)
    .where(and(eq(idColumn, id), eq(ownerColumn, ownerId)))
    .limit(1);
  if (!row) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Référence invalide',
      message: `${label} introuvable dans votre espace.`,
    });
  }
}
