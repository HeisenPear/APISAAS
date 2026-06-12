import { SITE_NAME, absoluteUrl } from '~/utils/seo';

interface SeoPageOptions {
  /** Titre de la page (balise <title> + og:title + twitter:title). */
  title: string;
  /** Méta description (+ og/twitter description). */
  description: string;
  /** Chemin de la page (« /faq ») — sert à la canonical et à og:url. */
  path: string;
  /** Image OG (chemin ou URL absolue). Défaut : /og-image.jpg. */
  image?: string;
  /** Type Open Graph. Défaut : website. */
  type?: 'website' | 'article';
  /** true = empêche l'indexation (pages privées/utilitaires). */
  noindex?: boolean;
}

/**
 * SEO d'une page : titre, description, canonical, Open Graph (URL absolue),
 * Twitter Card et robots — en un seul appel. À utiliser sur toutes les pages
 * publiques pour des métas uniques et des partages soignés.
 */
export function useSeoPage(opts: SeoPageOptions): void {
  const url = absoluteUrl(opts.path);
  const image = absoluteUrl(opts.image ?? '/og-image.jpg');

  useSeoMeta({
    title: opts.title,
    description: opts.description,
    ogTitle: opts.title,
    ogDescription: opts.description,
    ogUrl: url,
    ogType: opts.type ?? 'website',
    ogImage: image,
    ogSiteName: SITE_NAME,
    ogLocale: 'fr_FR',
    twitterCard: 'summary_large_image',
    twitterTitle: opts.title,
    twitterDescription: opts.description,
    twitterImage: image,
    robots: opts.noindex ? 'noindex, nofollow' : 'index, follow',
  });

  useHead({ link: [{ rel: 'canonical', href: url }] });
}

/**
 * Injecte un (ou plusieurs) bloc(s) JSON-LD de données structurées dans le
 * <head>. Indispensable pour les rich results Google et pour être cité par les
 * moteurs génératifs (GEO).
 */
export function useJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): void {
  const blocs = Array.isArray(data) ? data : [data];
  useHead({
    script: blocs.map((bloc) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(bloc),
    })),
  });
}
