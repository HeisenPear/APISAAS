// ═══════════════════════════════════════════════════════════════════════════
// COHÉRENCE robots.txt ↔ sitemap.xml ↔ prérendu
//
// Trois fichiers décrivent la même chose — ce qui est public, ce qui ne l'est
// pas — et rien ne les tenait ensemble. La dérive est SILENCIEUSE : le build
// passe, les pages répondent 200, et c'est Google qui arbitre des semaines
// plus tard.
//
// Ce banc est né d'un vrai défaut trouvé sur le preview : `/conformite` était
// devenue une page marketing publique (prérendue, priorité 0.8 au sitemap) et
// `public/robots.txt` gardait son `Disallow: /conformite` d'avant. On soumettait
// à Google une URL qu'on lui interdisait de lire.
//
// Il lit les VRAIS fichiers — pas une copie de leurs règles. Un banc qui
// redéclare ce qu'il mesure ne mesure rien.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ARTICLES } from '~~/app/utils/articles';
import { USAGES } from '~~/app/utils/usages';

const robots = readFileSync('public/robots.txt', 'utf-8');
const sourceSitemap = readFileSync('server/routes/sitemap.xml.ts', 'utf-8');
const sourceNuxt = readFileSync('nuxt.config.ts', 'utf-8');

/** Chemins interdits aux robots, dans l'ordre du fichier. */
const INTERDITS = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map((m) => m[1]!);

/**
 * Pages listées au sitemap. Le handler est un `defineEventHandler` (auto-import
 * Nitro, indisponible ici) : on relit sa table statique, et on recompose les
 * deux familles dynamiques depuis les mêmes constantes que la production.
 */
const SITEMAP = [
  ...[...sourceSitemap.matchAll(/\{\s*loc:\s*'([^']+)'/g)].map((m) => m[1]!),
  ...USAGES.map((u) => `/utilisations/${u.slug}`),
  ...ARTICLES.map((a) => `/blog/${a.slug}`),
];

/** Un `Disallow: /x` bloque `/x` ET tout ce qui vit dessous. */
function bloquePar(chemin: string): string | undefined {
  return INTERDITS.find((d) => chemin === d || chemin.startsWith(`${d.replace(/\/$/, '')}/`));
}

// Retire les lignes de commentaire, ligne à ligne.
//
// Surtout PAS une regex de bloc appliquée au fichier entier : `nuxt.config.ts`
// contient des motifs de fichiers (`app/…/*.vue`) dont les délimiteurs forment
// un faux commentaire qui avalerait la moitié du fichier — et ferait
// disparaître la liste qu'on cherche. Le premier jet de ce banc est tombé
// exactement là-dessus.
function sansCommentaires(source: string): string {
  return source
    .split('\n')
    .filter((ligne) => !/^\s*(\/\/|\*|\/\*)/.test(ligne))
    .join('\n');
}

/** Chemins exclus du prérendu (`nitro.prerender.ignore`). */
const IGNORE_PRERENDU = (() => {
  const bloc = sansCommentaires(sourceNuxt).match(/ignore:\s*\[([\s\S]*?)\]/);
  if (!bloc) throw new Error('nitro.prerender.ignore introuvable dans nuxt.config.ts');
  return [...bloc[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
})();

describe('robots.txt et sitemap.xml décrivent le même site', () => {
  it('lit bien les trois sources', () => {
    // Si un jour un de ces fichiers est déplacé ou réécrit autrement, les
    // regex ci-dessus renverraient des listes vides et TOUT passerait au vert
    // sans plus rien vérifier. Ce garde-fou l'empêche.
    expect(INTERDITS.length).toBeGreaterThan(10);
    expect(SITEMAP.length).toBeGreaterThan(30);
    expect(IGNORE_PRERENDU.length).toBeGreaterThan(10);
  });

  it('aucune page du sitemap n’est interdite aux robots', () => {
    // LE défaut qui a motivé ce banc.
    const contradictions = SITEMAP.map((page) => ({ page, par: bloquePar(page) })).filter(
      (c) => c.par,
    );
    expect(
      contradictions,
      `soumises à Google puis bloquées : ${contradictions.map((c) => `${c.page} (Disallow: ${c.par})`).join(', ')}`,
    ).toEqual([]);
  });

  it('le sitemap ne contient aucun doublon', () => {
    const vus = new Set<string>();
    const doublons = SITEMAP.filter((p) => (vus.has(p) ? true : (vus.add(p), false)));
    expect(doublons).toEqual([]);
  });

  it('toutes les URL du sitemap sont des chemins absolus du site', () => {
    // `SITE_URL` est préfixé à la volée : une entrée déjà absolue produirait
    // `https://apigo.frhttps://…`.
    for (const page of SITEMAP) {
      expect(page.startsWith('/'), page).toBe(true);
      expect(page.includes('://'), page).toBe(false);
    }
  });

  it('robots.txt annonce le sitemap', () => {
    expect(robots).toMatch(/^Sitemap:\s*https:\/\/\S+\/sitemap\.xml$/m);
  });
});

describe('l’espace applicatif privé reste hors des robots', () => {
  // `nitro.prerender.ignore` se décrit lui-même comme le « miroir des Disallow
  // du robots.txt ». Le miroir n'était vérifié par rien.
  //
  // EXCEPTION UNIQUE, et elle est documentée des deux côtés : `/demo` est une
  // page marketing publique (cible du CTA de l'en-tête, du hero et du bandeau
  // final). Elle est hors prérendu parce que son `useFetch` de créneaux les
  // figerait dans le HTML statique — pas parce qu'elle serait privée.
  const PUBLIQUE_MAIS_HORS_PRERENDU = new Set(['/demo']);

  it('chaque chemin exclu du prérendu est interdit aux robots', () => {
    const oublis = IGNORE_PRERENDU.filter(
      (chemin) => !PUBLIQUE_MAIS_HORS_PRERENDU.has(chemin) && !bloquePar(chemin),
    );
    expect(oublis, `privées côté prérendu mais crawlables : ${oublis.join(', ')}`).toEqual([]);
  });

  it('l’exception publique est bien servie, pas seulement tolérée', () => {
    // Sans ça, on pourrait retirer `/demo` du sitemap et le banc précédent
    // resterait vert grâce à l'exception — l'inverse de ce qu'elle signifie.
    for (const chemin of PUBLIQUE_MAIS_HORS_PRERENDU) {
      expect(SITEMAP, `${chemin} est déclarée publique : elle doit être au sitemap`).toContain(
        chemin,
      );
      expect(
        bloquePar(chemin),
        `${chemin} est déclarée publique : robots.txt ne doit pas la bloquer`,
      ).toBeUndefined();
    }
  });
});
