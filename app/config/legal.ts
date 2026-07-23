/**
 * Source UNIQUE des informations légales de l'éditeur + versions des documents.
 *
 * ✅ Société CONSTITUÉE (confirmé par Antoine) et ASSUJETTIE à la TVA. Il ne reste
 *    qu'à renseigner les valeurs exactes d'immatriculation ci-dessous (champs [entre
 *    crochets]) : forme, capital, RCS, SIREN/SIRET, adresse, n° TVA intra, directeur
 *    de publication. Tout est déjà câblé (mentions légales, CGV, factures) → dès que
 *    ces valeurs sont saisies, le site est conforme sur ce point.
 *
 * ⚠️ Faire relire par un professionnel du droit avant toute commercialisation : la
 *    conformité « logicielle » (champs/mentions présents) ne vaut pas validation
 *    juridique.
 */
export const LEGAL_EDITOR = {
  raisonSociale: 'APIGO',
  nomCommercial: 'APIGO',
  formeJuridique: '[Forme juridique — ex. SAS — à renseigner]',
  capitalSocial: '[Capital social — à renseigner]',
  rcs: '[RCS — ville + numéro — à renseigner]',
  siren: '[SIREN — 9 chiffres — à renseigner]',
  siret: '[SIRET — 14 chiffres — à renseigner]',
  adresse: '[Adresse du siège social — à renseigner]',
  email: 'apigo360.apiculture@gmail.com',
  site: 'apigo.fr',
  /** Assujettie à la TVA → afficher le n° de TVA intracommunautaire (pas la franchise). */
  tvaMention: 'TVA intracommunautaire : [FR + clé + SIREN — à renseigner]',
  directeurPublication: "[Représentant légal d'APIGO — à renseigner]",
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
