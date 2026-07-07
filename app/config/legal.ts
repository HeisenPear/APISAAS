/**
 * Source UNIQUE des informations légales de l'éditeur + versions des documents.
 *
 * ⚠️ APIGO est présenté comme l'entité éditrice/vendeuse. Une micro-entreprise étant
 *    NOMINATIVE (une personne physique), exploiter sous « APIGO » en tant que société
 *    suppose la CONSTITUTION d'une société (SAS/SARL…). Compléter les placeholders
 *    [forme] / [capital] / [RCS] / [SIRET] / [adresse] dès l'immatriculation, et faire
 *    relire par un professionnel du droit avant toute commercialisation.
 *
 * ⚠️ Régime TVA : franchise en base supposée (art. 293 B du CGI) — À CONFIRMER.
 */
export const LEGAL_EDITOR = {
  raisonSociale: 'APIGO',
  nomCommercial: 'APIGO',
  formeJuridique: '[Forme juridique — ex. SAS — à compléter à la constitution]',
  capitalSocial: '[Capital social — à compléter]',
  rcs: '[RCS — ville + numéro — à compléter]',
  siret: '[SIRET — à compléter]',
  adresse: '[Adresse du siège social — à compléter]',
  email: 'apigo360.apiculture@gmail.com',
  site: 'apigo.fr',
  /** Franchise en base de TVA — à confirmer. */
  tvaMention: 'TVA non applicable, art. 293 B du CGI',
  directeurPublication: "[Représentant légal d'APIGO — à compléter]",
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
