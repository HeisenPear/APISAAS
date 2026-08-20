import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * LE PIÈGE PARENT/ENFANT DE NUXT.
 *
 * `pages/elevage/reines.vue` + `pages/elevage/reines/[id].vue` ne donnent PAS
 * deux routes sœurs. Nuxt en fait un parent et son enfant — vérifié dans le
 * bundle livré :
 *
 *   { path:"/elevage/reines", component: reines.vue,
 *     children:[ { path:":id()", component: [id].vue } ] }
 *
 * L'enfant ne s'affiche QUE si le parent rend un `<NuxtPage />`. Sans exutoire,
 * la route existe, l'URL répond, et il ne se passe rien : la page enfant n'est
 * jamais montée. Quatre pages étaient dans ce cas — la fiche d'une reine, les
 * fenêtres de Maya, le détail d'une récolte, le rapport d'une ruche — toutes
 * les quatre liées depuis l'interface. Quatre culs-de-sac.
 *
 * Le remède est de les rendre sœurs (`reines/index.vue`), pas d'ajouter un
 * `<NuxtPage />` : sur une page de liste, l'exutoire afficherait la liste ET le
 * détail l'un sous l'autre.
 *
 * Ce banc lit le DISQUE, comme Nuxt : une page existe parce que le fichier est
 * là. Il n'inspecte pas du texte à la recherche d'une chaîne — il compare une
 * arborescence à une règle.
 */

const PAGES = join(process.cwd(), 'app', 'pages');

/** Fichiers `X.vue` ayant un dossier `X/` frère — donc des enfants de route. */
function parentsDeRoute(dossier: string = PAGES): string[] {
  const trouves: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      trouves.push(...parentsDeRoute(chemin));
      continue;
    }
    if (!nom.endsWith('.vue') || nom === 'index.vue') continue;
    const jumeau = chemin.slice(0, -'.vue'.length);
    try {
      if (statSync(jumeau).isDirectory()) trouves.push(chemin);
    } catch {
      // pas de dossier du même nom : route simple, rien à vérifier
    }
  }
  return trouves;
}

describe('routes imbriquées — aucun enfant sans exutoire', () => {
  it('le banc voit bien l’arborescence des pages (garde-fou de lui-même)', () => {
    const toutes = readdirSync(PAGES);
    expect(toutes.length).toBeGreaterThan(20);
    expect(toutes).toContain('index.vue');
  });

  it('tout parent de route rend un <NuxtPage />, sinon ses enfants sont injoignables', () => {
    const sansExutoire = parentsDeRoute()
      .filter((f) => !readFileSync(f, 'utf-8').includes('NuxtPage'))
      .map((f) => {
        const rel = f.slice(PAGES.length + 1);
        const enfants = readdirSync(f.slice(0, -'.vue'.length)).join(', ');
        return `${rel} (enfants injoignables : ${enfants})`;
      });

    expect(
      sansExutoire,
      'Ces pages ont un dossier du même nom : Nuxt en fait des PARENTS, et leurs ' +
        'enfants ne s’affichent que via un <NuxtPage />. Sans exutoire, l’URL répond ' +
        'et la page reste vide. Remède habituel : renommer le parent en index.vue ' +
        'pour que les routes deviennent sœurs.',
    ).toEqual([]);
  });
});
