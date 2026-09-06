import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

/**
 * LE MANIFESTE PWA N'AVAIT AUCUN BANC.
 *
 * C'est pourtant un fichier qui casse en SILENCE : une icône renommée, un
 * raccourci vers une page supprimée, une couleur de thème qui dérive de la
 * charte — rien de tout cela ne fait échouer un build. Ça se voit à
 * l'installation, sur le téléphone de quelqu'un, souvent des semaines plus tard.
 *
 * Ce banc ne juge pas le contenu (« ce raccourci est-il pertinent ? » est une
 * question produit). Il vérifie que ce que le manifeste PROMET existe vraiment.
 */
const MANIFESTE = JSON.parse(readFileSync('public/manifest.json', 'utf-8')) as {
  id: string;
  start_url: string;
  theme_color: string;
  background_color: string;
  display: string;
  icons: Array<{ src: string; sizes: string; type?: string; purpose?: string }>;
  shortcuts: Array<{ name: string; url: string; icons?: Array<{ src: string }> }>;
};

const CSS = readFileSync('app/assets/css/main.css', 'utf-8');
const jeton = (nom: string): string => {
  const m = CSS.match(new RegExp(`\\n\\s*${nom}:\\s*(#[0-9a-fA-F]{6});`));
  if (!m) throw new Error(`jeton ${nom} introuvable`);
  return m[1]!.toLowerCase();
};

/** Une URL d'application correspond-elle à une page qui existe ? */
function pageExiste(url: string): boolean {
  const chemin = url.split('?')[0]!.replace(/^\/+|\/+$/g, '');
  if (!chemin) return existsSync('app/pages/index.vue');
  return existsSync(`app/pages/${chemin}.vue`) || existsSync(`app/pages/${chemin}/index.vue`);
}

describe('manifeste — ce qu’il promet doit exister', () => {
  it('chaque icône déclarée est présente sur le disque', () => {
    const manquantes = MANIFESTE.icons
      .map((i) => i.src)
      .filter((src) => !existsSync(`public${src}`));
    expect(
      manquantes,
      'icône déclarée mais absente — l’installation affiche un carré vide',
    ).toEqual([]);
  });

  it('fournit les deux tailles ET la variante maskable', () => {
    /**
     * Sans icône `maskable`, Android applique sa propre découpe à une icône
     * carrée : le logo se retrouve rogné dans un cercle. C'est le défaut le
     * plus visible d'une PWA, et le plus facile à ne jamais remarquer sur son
     * propre téléphone.
     */
    const parPurpose = (p: string) =>
      MANIFESTE.icons.filter((i) => (i.purpose ?? 'any').includes(p));
    expect(parPurpose('any').length, 'aucune icône standard').toBeGreaterThanOrEqual(2);
    expect(parPurpose('maskable').length, 'aucune icône maskable').toBeGreaterThanOrEqual(1);
    for (const taille of ['192x192', '512x512']) {
      expect(
        MANIFESTE.icons.some((i) => i.sizes === taille),
        `taille ${taille} absente`,
      ).toBe(true);
    }
  });

  it('chaque raccourci mène à une page qui existe', () => {
    const casses = MANIFESTE.shortcuts.filter((s) => !pageExiste(s.url));
    expect(
      casses.map((s) => `${s.name} → ${s.url}`),
      'raccourci vers une page supprimée : appui long sur l’icône → écran d’erreur',
    ).toEqual([]);
  });

  it('les icônes des raccourcis existent aussi', () => {
    const manquantes: string[] = [];
    for (const s of MANIFESTE.shortcuts) {
      for (const i of s.icons ?? []) {
        if (!existsSync(`public${i.src}`)) manquantes.push(`${s.name} → ${i.src}`);
      }
    }
    expect(manquantes).toEqual([]);
  });

  it('le point de démarrage est une vraie page', () => {
    expect(pageExiste(MANIFESTE.start_url), MANIFESTE.start_url).toBe(true);
  });

  it('Maya est accessible depuis l’icône de l’application', () => {
    /**
     * La fonctionnalité phare de cette version n'était joignable qu'en ouvrant
     * l'app puis en naviguant. Sur un téléphone, l'appui long sur l'icône est
     * le chemin le plus court vers ce qu'on fait souvent — et « demander à
     * Maya » est précisément ce qu'on fait sans savoir d'avance quoi chercher.
     */
    const maya = MANIFESTE.shortcuts.find((s) => s.url === '/copilote');
    expect(maya, 'aucun raccourci vers Maya').toBeDefined();
    expect(pageExiste('/copilote')).toBe(true);
  });
});

describe('manifeste — les couleurs suivent la charte, sans copie qui dérive', () => {
  it('la couleur de thème EST le miel de la charte', () => {
    // Elle teinte la barre système sur Android. Recopiée à la main, elle
    // dériverait sans que personne ne s'en aperçoive — la barre d'une app
    // installée n'est pas ce qu'on regarde en développant.
    expect(MANIFESTE.theme_color.toLowerCase()).toBe(jeton('--honey'));
  });

  it('la couleur de fond EST le crème de la charte', () => {
    // C'est l'écran de démarrage. Un blanc pur y flasherait au lancement,
    // exactement ce que la charte interdit partout ailleurs.
    expect(MANIFESTE.background_color.toLowerCase()).toBe(jeton('--surface-primary'));
  });

  it('s’affiche en application, pas en onglet déguisé', () => {
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(MANIFESTE.display);
  });
});
