import { ARTICLES } from '~~/app/utils/articles';
import { USAGES } from '~~/app/utils/usages';
import { SITE_URL } from '~~/app/utils/seo';

/**
 * Sitemap XML dynamique (zéro dépendance) : pages publiques + articles du blog.
 * Servi sur /sitemap.xml et référencé par /robots.txt.
 */

interface Entree {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const PAGES: Entree[] = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/tarifs', changefreq: 'monthly', priority: '0.9' },
  { loc: '/fonctionnalites', changefreq: 'monthly', priority: '0.85' },
  { loc: '/conformite', changefreq: 'monthly', priority: '0.8' },
  { loc: '/meilleur-logiciel-apiculture', changefreq: 'monthly', priority: '0.9' },
  { loc: '/alternative-beekube', changefreq: 'monthly', priority: '0.8' },
  { loc: '/utilisations', changefreq: 'monthly', priority: '0.8' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.8' },
  { loc: '/lexique-apicole', changefreq: 'monthly', priority: '0.7' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
  { loc: '/notre-histoire', changefreq: 'yearly', priority: '0.5' },
  { loc: '/cgu', changefreq: 'yearly', priority: '0.3' },
  { loc: '/mentions-legales', changefreq: 'yearly', priority: '0.3' },
  { loc: '/politique-confidentialite', changefreq: 'yearly', priority: '0.3' },
];

function urlXml(e: Entree): string {
  const parts = [`    <loc>${SITE_URL}${e.loc}</loc>`];
  if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

export default defineEventHandler((event) => {
  const articles: Entree[] = ARTICLES.map((a) => ({
    loc: `/blog/${a.slug}`,
    lastmod: a.miseAJour ?? a.date,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const usages: Entree[] = USAGES.map((u) => ({
    loc: `/utilisations/${u.slug}`,
    changefreq: 'monthly',
    priority: '0.8',
  }));

  const urls = [...PAGES, ...usages, ...articles].map(urlXml).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return xml;
});
