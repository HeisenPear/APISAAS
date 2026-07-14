// Rôles & accès granulaires de l'équipe (Expert). Décision d'écriture PURE et
// testable, consommée par `assertCanWrite`. Deux domaines d'écriture :
//  - terrain  : rucher, ruches, interventions, récoltes, élevage, transhumance,
//               stocks/mouvements de stock (inventaire physique, pas la facturation)…
//  - commerce : facturation, ventes/achats, clients, bons de livraison, compta.
//
// Rôles :
//  - admin / apiculteur : accès complet (apiculteur = collaborateur opérationnel).
//  - technicien : terrain uniquement (saisie au rucher, pas la compta).
//  - comptable  : commerce uniquement (facturation/finances, rucher en lecture).
//  - lecture    : consultation seule, aucune écriture.
// Les rôles « restreints » (technicien / comptable / lecture) ne sont assignables
// qu'avec la capacité `rolesEquipe` (plan Expert).

export type MembreRole = 'admin' | 'apiculteur' | 'technicien' | 'comptable' | 'lecture';
export type WorkspaceRole = 'owner' | MembreRole;
export type DomaineEcriture = 'terrain' | 'commerce';

/** Le rôle autorise-t-il l'écriture dans ce domaine ? */
export function rolePeutEcrire(role: WorkspaceRole, domaine: DomaineEcriture): boolean {
  switch (role) {
    case 'owner':
    case 'admin':
    case 'apiculteur':
      return true;
    case 'technicien':
      return domaine === 'terrain';
    case 'comptable':
      return domaine === 'commerce';
    case 'lecture':
      return false;
    default:
      return false;
  }
}

export interface RoleDef {
  value: MembreRole;
  label: string;
  description: string;
  /** Réservé au plan Expert (capacité `rolesEquipe`). */
  restreint: boolean;
}

export const ROLE_DEFS: readonly RoleDef[] = [
  {
    value: 'admin',
    label: 'Administrateur',
    description: "Accès complet, y compris la gestion de l'équipe",
    restreint: false,
  },
  {
    value: 'apiculteur',
    label: 'Apiculteur',
    description: 'Accès complet au rucher et au commerce',
    restreint: false,
  },
  {
    value: 'technicien',
    label: 'Technicien',
    description: 'Rucher, interventions et stocks — aucun accès à la facturation/compta',
    restreint: true,
  },
  {
    value: 'comptable',
    label: 'Comptable',
    description: 'Facturation & finances — le rucher reste en lecture',
    restreint: true,
  },
  {
    value: 'lecture',
    label: 'Lecture seule',
    description: 'Consultation uniquement, aucune modification',
    restreint: true,
  },
] as const;

export const ROLES_RESTREINTS: readonly MembreRole[] = ['technicien', 'comptable', 'lecture'];

/** Un rôle « restreint » nécessite la capacité `rolesEquipe` (Expert) pour être assigné. */
export function estRoleRestreint(role: string): boolean {
  return (ROLES_RESTREINTS as readonly string[]).includes(role);
}

/** Message d'erreur lisible quand un membre tente une écriture hors de son périmètre. */
export function messageAccesRefuse(role: WorkspaceRole, domaine: DomaineEcriture): string {
  if (role === 'lecture') return 'Votre accès est en lecture seule.';
  if (role === 'technicien')
    return 'Votre rôle (technicien) ne donne pas accès à la facturation et aux finances.';
  if (role === 'comptable')
    return 'Votre rôle (comptable) ne permet pas de modifier les données du rucher.';
  return `Action non autorisée pour le domaine « ${domaine} ».`;
}
