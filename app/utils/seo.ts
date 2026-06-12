/**
 * Constantes SEO partagées (importables côté app ET côté serveur via ~~/app/utils/seo).
 * L'URL canonique est TOUJOURS le domaine de production, indépendamment de
 * l'environnement (preview, localhost), pour des balises canonical correctes.
 */
export const SITE_URL = 'https://www.apigo.fr';
export const SITE_NAME = 'APIGO';
export const SITE_DESCRIPTION =
  'APIGO est le logiciel de gestion apicole tout-en-un : suivi des ruches, interventions, santé des colonies, production, conformité et facturation — sur mobile et web, même hors-ligne.';

/** Construit une URL absolue à partir d'un chemin (« /tarifs » → « https://www.apigo.fr/tarifs »). */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
