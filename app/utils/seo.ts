/**
 * Constantes SEO partagées (importables côté app ET côté serveur via ~~/app/utils/seo).
 * L'URL canonique est TOUJOURS le domaine de production — l'APEX apigo.fr, qui est
 * l'hôte réellement servi par Vercel (le reste du code utilise apigo.fr partout) —
 * indépendamment de l'environnement (preview, localhost), pour des canonical/og/
 * sitemap cohérents. ⚠️ Vérifier côté Vercel que www.apigo.fr redirige (301) vers l'apex.
 */
export const SITE_URL = 'https://apigo.fr';
export const SITE_NAME = 'APIGO';
export const SITE_DESCRIPTION =
  'APIGO est le logiciel de gestion apicole tout-en-un : suivi des ruches, interventions, santé des colonies, production, conformité et facturation — sur mobile et web, même hors-ligne.';

/** Construit une URL absolue à partir d'un chemin (« /tarifs » → « https://apigo.fr/tarifs »). */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
