import type { H3Event } from 'h3';
import { eq, and } from 'drizzle-orm';
import { membres } from '~~/server/database/schema';

/**
 * Espaces de travail partagés (multi-utilisateurs).
 *
 * Un utilisateur (« acteur ») agit toujours dans UN espace :
 *  - son propre espace (role `owner`) — par défaut ;
 *  - l'espace d'un propriétaire dont il est membre accepté (role issu de
 *    `membres.role`), sélectionné via le cookie `apigo_ws`.
 *
 * Les données appartiennent à l'exploitation (la colonne `userId` = l'ID du
 * propriétaire). Les routes « data » utilisent donc `requireWorkspace` qui
 * renvoie un objet de forme `user` mais dont `.id` est l'ID du PROPRIÉTAIRE
 * effectif — le corps des routes reste inchangé. Les routes d'identité/compte
 * (profil, équipe, abonnement…) gardent `requireAuth` (l'acteur réel).
 */

export type WorkspaceRole = 'owner' | 'admin' | 'apiculteur' | 'comptable';

export const WORKSPACE_COOKIE = 'apigo_ws';
const CONTEXT_KEY = '__workspace';

export interface WorkspaceContext {
  actorId: string;
  actorEmail: string | undefined;
  ownerId: string;
  role: WorkspaceRole;
  isOwner: boolean;
}

/** Objet de forme `user` pour les routes data — `.id` = propriétaire effectif. */
export interface WorkspaceUser {
  id: string;
  email: string | undefined;
  actorId: string;
  role: WorkspaceRole;
  isOwner: boolean;
}

/**
 * Résout l'espace actif de l'acteur (mis en cache sur event.context pour la
 * durée de la requête). Cookie invalide → repli sécurisé sur l'espace propre.
 */
export async function resolveWorkspace(event: H3Event): Promise<WorkspaceContext> {
  const cached = event.context[CONTEXT_KEY] as WorkspaceContext | undefined;
  if (cached) return cached;

  const user = await requireAuth(event); // 401 si non authentifié
  const actorId = user.id;

  let ctx: WorkspaceContext = {
    actorId,
    actorEmail: user.email,
    ownerId: actorId,
    role: 'owner',
    isOwner: true,
  };

  const selected = getCookie(event, WORKSPACE_COOKIE);
  if (selected && selected !== actorId) {
    const [m] = await db
      .select({ role: membres.role })
      .from(membres)
      .where(
        and(
          eq(membres.ownerId, selected),
          eq(membres.userId, actorId),
          eq(membres.statut, 'acceptee'),
        ),
      )
      .limit(1);
    if (m) {
      ctx = {
        actorId,
        actorEmail: user.email,
        ownerId: selected,
        role: m.role as WorkspaceRole,
        isOwner: false,
      };
    }
  }

  event.context[CONTEXT_KEY] = ctx;
  return ctx;
}

/**
 * Garde « espace de travail » pour les routes data. Renvoie un objet de forme
 * `user` dont `.id` est le propriétaire effectif (scoping par exploitation).
 */
export async function requireWorkspace(event: H3Event): Promise<WorkspaceUser> {
  const ws = await resolveWorkspace(event);
  return {
    id: ws.ownerId,
    email: ws.actorEmail,
    actorId: ws.actorId,
    role: ws.role,
    isOwner: ws.isOwner,
  };
}

// ─── Permissions par rôle ────────────────────────────────────────────

/** Libellé lisible d'un propriétaire d'espace (prénom nom, sinon email). */
export function workspaceLabel(
  prenom?: string | null,
  nom?: string | null,
  email?: string | null,
): string {
  const name = [prenom, nom].filter(Boolean).join(' ').trim();
  return name || email || 'Exploitation';
}

export type WorkspaceDomain = 'tech' | 'finance' | 'account' | 'other';

const FINANCE_PREFIXES = ['/api/finances', '/api/clients', '/api/bons-livraison'];
const TECH_PREFIXES = [
  '/api/ruchers',
  '/api/ruches',
  '/api/interventions',
  '/api/production',
  '/api/stocks',
  '/api/elevage',
  '/api/transhumance',
  '/api/hausses',
  '/api/ordonnances',
  '/api/declarations',
  '/api/conformite',
  '/api/mortalites',
  '/api/visites-sanitaires',
  '/api/veterinaires',
  '/api/calendrier',
  '/api/photos',
];
// Compte / identité / administration — toujours scopés sur l'acteur, jamais
// soumis aux permissions d'espace (un membre gère toujours son propre compte).
const ACCOUNT_PREFIXES = [
  '/api/membres',
  '/api/subscription',
  '/api/profils',
  '/api/organisations',
  '/api/syndicat',
  '/api/campagnes',
  '/api/security',
  '/api/admin',
  '/api/push',
];

export function domainForPath(path: string): WorkspaceDomain {
  if (ACCOUNT_PREFIXES.some((p) => path.startsWith(p))) return 'account';
  if (FINANCE_PREFIXES.some((p) => path.startsWith(p))) return 'finance';
  if (TECH_PREFIXES.some((p) => path.startsWith(p))) return 'tech';
  return 'other';
}

/**
 * Une écriture d'un MEMBRE (non-propriétaire) est-elle bloquée ?
 * (Les lectures restent ouvertes — c'est pourquoi le comptable, en lecture
 * seule, peut consulter/exporter les finances via les GET.)
 *  - admin     : écrit tout (tech + finance + autre) ; le compte reste au owner ;
 *  - apiculteur: écrit le terrain (tech + autre), PAS les finances ;
 *  - comptable : LECTURE SEULE (aucune écriture) — il consulte et exporte.
 * Le domaine `account` est traité en amont (jamais soumis à cette règle).
 */
export function memberWriteBlocked(role: WorkspaceRole, domain: WorkspaceDomain): boolean {
  if (domain === 'account') return false;
  switch (role) {
    case 'admin':
      return false;
    case 'apiculteur':
      return domain === 'finance';
    case 'comptable':
      return true; // lecture seule : aucune écriture
    default:
      return true; // owner ne passe jamais ici ; rôle inconnu → blocage sûr
  }
}
