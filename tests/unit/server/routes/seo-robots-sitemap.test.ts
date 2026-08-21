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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ARTICLES } from '~~/app/utils/articles';
import { USAGES } from '~~/app/utils/usages';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

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

// ═══════════════════════════════════════════════════════════════════════════
// L'ESPACE PRIVÉ EST-IL COUVERT PAR LES TROIS LISTES ?
//
// Le banc ci-dessus vérifie que les listes ne se contredisent pas. Il ne
// vérifiait pas qu'elles sont COMPLÈTES — et neuf pages applicatives
// n'étaient dans aucune des trois.
//
// Preuve au build Vercel du 19/08 : « Prerendered 128 routes » incluait
// `/balances/nouvelle`, découverte par `crawlLinks` depuis un lien de
// l'espace applicatif. Le preview servait `/balances` en fichier STATIQUE
// (etag, last-modified, cache CDN) : la coquille déconnectée d'une page
// privée, publiquement lisible, indexable — et sans redirection vers
// `/login`, donc sans aucune porte de sortie pour le visiteur.
//
// Trois listes, trois conséquences distinctes, et rien ne les reliait à
// l'arborescence réelle des pages :
//   · `supabase.redirectOptions.include` → le déconnecté est-il renvoyé vers
//     `/login` ? Sinon il voit une page vide dont les appels répondent 401.
//   · `nitro.prerender.ignore`           → la page est-elle figée au build ?
//   · `robots.txt`                       → Google peut-il l'indexer ?
//
// Ce banc lit `app/pages/` : toute nouvelle page applicative doit être
// déclarée dans les trois, sinon il tombe.
// ═══════════════════════════════════════════════════════════════════════════

// Pages du tunnel d'authentification : publiques par nature — on ne peut pas
// exiger d'être connecté pour se connecter. Elles portent le layout applicatif
// ou pas de layout du tout, d'où cette liste explicite.
const TUNNEL_AUTH = new Set([
  '/login',
  '/register',
  '/reset-password',
  '/confirm',
  '/onboarding',
  '/activer-essai',
]);

// `/public/campagne/[token]` : page publique servie sur jeton, pas une page
// applicative — son dossier porte d'ailleurs le mot.
const HORS_ESPACE_APP = new Set(['/public']);

/** Routes de premier niveau, telles que Nuxt les dérive de `app/pages/`. */
function routesDePremierNiveau(): { route: string; fichier: string }[] {
  const racine = 'app/pages';
  const sorties: { route: string; fichier: string }[] = [];

  for (const entree of readdirSync(racine).sort()) {
    const chemin = join(racine, entree);
    if (statSync(chemin).isDirectory()) {
      // Un dossier peut n'avoir aucun `index.vue` (ex. `declarations/napi.vue`) :
      // on prend alors la première page trouvée, elle porte le même layout.
      const premiere = existsSync(join(chemin, 'index.vue'))
        ? join(chemin, 'index.vue')
        : premiereVueRecursive(chemin);
      if (premiere) sorties.push({ route: `/${entree}`, fichier: premiere });
    } else if (entree.endsWith('.vue')) {
      const nom = entree.slice(0, -'.vue'.length);
      sorties.push({ route: nom === 'index' ? '/' : `/${nom}`, fichier: chemin });
    }
  }
  return sorties;

  function premiereVueRecursive(dossier: string): string | null {
    for (const e of readdirSync(dossier).sort()) {
      const c = join(dossier, e);
      if (statSync(c).isDirectory()) {
        const trouve = premiereVueRecursive(c);
        if (trouve) return trouve;
      } else if (e.endsWith('.vue')) return c;
    }
    return null;
  }
}

/**
 * Une page est APPLICATIVE si elle n'a pas son propre chrome. `layout: false`
 * marque les pages qui se dessinent entièrement elles-mêmes — landing,
 * marketing, tunnel d'auth. Tout le reste hérite du layout `default`, celui
 * de l'espace connecté (barre latérale, en-tête de compte).
 */
const ROUTES_PRIVEES = [
  ...new Set(
    routesDePremierNiveau()
      .filter(
        ({ route }) => route !== '/' && !TUNNEL_AUTH.has(route) && !HORS_ESPACE_APP.has(route),
      )
      .filter(({ fichier }) => !/layout:\s*false/.test(readFileSync(fichier, 'utf-8')))
      .map(({ route }) => route),
  ),
  // Sous-pages privées d'une racine publique : `/conformite` est une page
  // marketing, mais ce qu'il y a dessous est le registre de l'exploitation.
  '/conformite/mortalites',
  '/conformite/ordonnances',
  '/conformite/veterinaires',
  '/conformite/visites-sanitaires',
];

/** Motifs de `redirectOptions.include`, normalisés en préfixes de chemin. */
const PROTEGEES = (() => {
  const bloc = sansCommentaires(sourceNuxt).match(/include:\s*\[([\s\S]*?)\]/);
  if (!bloc) throw new Error('supabase.redirectOptions.include introuvable');
  return [...bloc[1]!.matchAll(/'([^']+)'/g)].map((m) =>
    m[1]!.replace('(/*)?', '').replace(/\/\*$/, ''),
  );
})();

/** `/x` couvre `/x` et tout ce qui vit dessous. */
function couvertPar(liste: string[], route: string): boolean {
  return liste.some(
    (entree) => route === entree || route.startsWith(`${entree.replace(/\/$/, '')}/`),
  );
}

describe('toute page de l’espace applicatif est déclarée dans les trois listes', () => {
  it('reconnaît bien l’arborescence des pages', () => {
    // Sans ce garde, un `app/pages/` déplacé rendrait `ROUTES_PRIVEES` vide et
    // les trois assertions suivantes passeraient au vert sans rien vérifier.
    expect(ROUTES_PRIVEES.length).toBeGreaterThan(20);
    expect(ROUTES_PRIVEES).toContain('/dashboard');
    expect(ROUTES_PRIVEES).toContain('/balances');
    // Et l'inverse : une page marketing ne doit jamais y entrer, sinon on
    // finirait par la bloquer aux robots.
    expect(ROUTES_PRIVEES).not.toContain('/tarifs');
    expect(ROUTES_PRIVEES).not.toContain('/conformite');
    expect(ROUTES_PRIVEES).not.toContain('/demo');
  });

  it('renvoie le visiteur déconnecté vers /login — jamais de page vide', () => {
    const sansPorteDeSortie = ROUTES_PRIVEES.filter((r) => !couvertPar(PROTEGEES, r));
    expect(
      sansPorteDeSortie,
      `un déconnecté y verrait une coquille aux appels 401 : ${sansPorteDeSortie.join(', ')}`,
    ).toEqual([]);
  });

  it('n’est jamais figée au build', () => {
    const prerendues = ROUTES_PRIVEES.filter((r) => !couvertPar(IGNORE_PRERENDU, r));
    expect(prerendues, `prérendues en coquille déconnectée : ${prerendues.join(', ')}`).toEqual([]);
  });

  it('n’est jamais indexable', () => {
    const crawlables = ROUTES_PRIVEES.filter((r) => !bloquePar(r));
    expect(crawlables, `indexables par Google : ${crawlables.join(', ')}`).toEqual([]);
  });
});
