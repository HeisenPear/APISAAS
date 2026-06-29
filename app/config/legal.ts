/**
 * Source UNIQUE des informations légales de l'éditeur + versions des documents.
 *
 * ⚠️ APIGO est exploité par Antoine Martin, entrepreneur individuel (micro-entreprise),
 *    sous le nom commercial « APIGO ». Compléter les placeholders [SIRET] / [adresse]
 *    DÈS l'immatriculation — vendre avant immatriculation est à régulariser au plus vite.
 *
 * ⚠️ Régime TVA : franchise en base supposée (art. 293 B du CGI) — À CONFIRMER.
 *    Si assujetti à la TVA, retirer `tvaMention` et afficher des prix TTC explicites.
 */
export const LEGAL_EDITOR = {
  nomCommercial: 'APIGO',
  exploitant: 'Antoine Martin',
  formeJuridique: 'Entrepreneur individuel (micro-entreprise)',
  siret: '[SIRET — à compléter dès l’immatriculation]',
  adresse: '[Adresse du siège — à compléter]',
  email: 'apigo360.apiculture@gmail.com',
  site: 'apigo.fr',
  /** Franchise en base de TVA — à confirmer. */
  tvaMention: 'TVA non applicable, art. 293 B du CGI',
  directeurPublication: 'Antoine Martin',
  /** Médiateur de la consommation (obligatoire pour la vente aux particuliers). */
  mediateur: '[Médiateur de la consommation — à désigner avant la vente B2C]',
} as const;

/**
 * Versions des documents contractuels. Incrémenter (date ISO) à CHAQUE modification
 * substantielle : on enregistre la version acceptée par l'utilisateur → preuve opposable.
 */
export const LEGAL_VERSIONS = {
  cgu: '2026-06-29',
  cgv: '2026-06-29',
  confidentialite: '2026-03-01',
} as const;

export type LegalDocument = keyof typeof LEGAL_VERSIONS;
