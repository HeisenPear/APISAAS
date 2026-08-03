import type { SQL } from 'drizzle-orm';
import type { Plan } from '~~/app/config/plans';

/** Destinataire réclamé par une campagne (jamais chargé au-delà du nécessaire). */
export interface DestinataireCampagne {
  id: string;
  email: string;
  prenom: string | null;
}

/**
 * Modèle de campagne — un envoi de masse NON transactionnel.
 *
 * Toute campagne est soumise à l'opt-out `email_marketing` (RGPD) et marquée
 * par son `slug` dans `profils.preferences.campagnes`, ce qui la rend
 * idempotente : relancer la route ne peut pas réexpédier à quelqu'un de déjà
 * servi. Le slug est donc une CLÉ STABLE — le renommer réenverrait tout.
 */
export interface ModeleCampagne {
  slug: string;
  sujet: string;
  /** Plans ciblés. Au moins un — une campagne sans cible n'existe pas. */
  plans: readonly Plan[];
  /**
   * Segment, en SQL, évalué sur la ligne `profils` en cours.
   *
   * Quand plusieurs campagnes tournent en parallèle sur le même plan, leurs
   * segments doivent être MUTUELLEMENT EXCLUSIFS : c'est la seule chose qui
   * empêche un apiculteur de recevoir deux mails le même jour. Le banc
   * `segmentsExclusifs` le vérifie sur toute combinaison de cheptel.
   */
  segment?: SQL;
  /** Libellé humain du segment, pour le retour du dry-run. */
  segmentLibelle?: string;
  rendu: (dest: DestinataireCampagne, lienDesinscription: string) => string;
}
