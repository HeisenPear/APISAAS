/**
 * Source UNIQUE des informations légales de l'éditeur + versions des documents.
 *
 * ✅ Valeurs RÉELLES issues des documents officiels (Kbis RCS Tours + synthèse INPI,
 *    15–17/07/2026). L'éditeur est une ENTREPRISE INDIVIDUELLE (micro-entreprise)
 *    d'Eliot GUEGAN, exploitée sous le nom commercial APIGO — ce n'est PAS une
 *    société, donc PAS de capital social, et les mentions nomment la personne
 *    physique. Régime TVA : FRANCHISE EN BASE (art. 293 B du CGI).
 *
 * ⚠️ Faire relire par un professionnel du droit avant toute commercialisation : la
 *    conformité « logicielle » (champs/mentions présents) ne vaut pas validation
 *    juridique. Le médiateur de la consommation (vente B2C) reste à désigner.
 */
export const LEGAL_EDITOR = {
  /** Personne physique exploitante (l'éditeur légal). */
  raisonSociale: 'Eliot GUEGAN',
  /** Nom commercial / d'exploitation. */
  nomCommercial: 'APIGO',
  formeJuridique: 'Entreprise individuelle (EI) — régime micro-entreprise',
  rcs: 'RCS Tours 985 243 872',
  siren: '985 243 872',
  siret: '985 243 872 00027',
  codeApe: '5829C — Édition de logiciels applicatifs',
  adresse: '46 rue Cérès, 37250 Veigné, France',
  email: 'apigo360.apiculture@gmail.com',
  site: 'apigo.fr',
  /** Micro-entreprise en franchise en base : pas de TVA facturée, mention obligatoire. */
  tvaMention: 'TVA non applicable, art. 293 B du CGI',
  franchiseTva: true,
  directeurPublication: 'Eliot GUEGAN',
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
