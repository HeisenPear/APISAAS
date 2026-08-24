import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * LA PORTE DE CI NE PEUT PAS VOIR CETTE PAGE. C'EST TOUT L'OBJET DE CE BANC.
 *
 * `scripts/audit-mise-en-page.mjs` mesure le contraste en résolvant le fond
 * réel d'un texte. Trois de ses filtres, chacun parfaitement justifié, se
 * cumulent ici pour l'aveugler sur /maya :
 *
 * 1. Il refuse de conclure quand le fond est TRANSLUCIDE (`f.a > 0.05`) — et
 *    les panneaux de cette page sont en `rgba(255,255,255,0.05)`.
 * 2. Il écarte le texte semi-transparent (`av.a < 0.95`) — or tout le texte
 *    secondaire de ces chapitres est du blanc à opacité réduite.
 * 3. `dansSurcouche` écarte tout descendant d'un ancêtre `sticky` ou `fixed` —
 *    ce qui met le chapitre « Comment elle raisonne » et la barre de
 *    navigation ENTIÈREMENT hors mesure.
 *
 * Résultat : la page pouvait afficher huit niveaux de gris dont cinq illisibles
 * sans qu'aucune porte ne bronche. Ce banc mesure donc à la source, en
 * composant les couleurs à la main.
 */

const CHAPITRES_SOMBRES = ['MayaVeille.vue', 'MayaAnticipe.vue'];

/** Fond du chapitre sombre, puis du panneau posé dessus. */
const FOND_CHAPITRE: [number, number, number] = [0x1a, 0x1a, 0x1c];

const composer = (
  couche: [number, number, number],
  alpha: number,
  fond: [number, number, number],
): [number, number, number] =>
  [0, 1, 2].map((i) => Math.round(couche[i]! * alpha + fond[i]! * (1 - alpha))) as [
    number,
    number,
    number,
  ];

const canal = (c: number): number => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: [number, number, number]): number =>
  0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
const contraste = (a: [number, number, number], b: [number, number, number]): number => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
};

/** Le fond effectif d'un texte de panneau : le panneau composé sur le chapitre. */
const FOND_PANNEAU = composer([255, 255, 255], 0.05, FOND_CHAPITRE);

/** Les opacités de blanc utilisées comme COULEUR DE TEXTE dans un gabarit. */
function opacitesDeTexte(source: string): number[] {
  const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
  const trouvees = new Set<number>();
  /**
   * ⚠️ `border-color:` SE TERMINE PAR `color:`.
   *
   * Mon premier motif attrapait les bordures à 0,12 et 0,14 et les comptait
   * comme du texte illisible — deux faux positifs, et un banc qui aurait fait
   * « corriger » des bordures parfaitement légitimes. La limite de mot évite
   * ça : seule une déclaration `color:` autonome est du texte.
   */
  for (const m of gabarit.matchAll(
    /(?:^|[;"\s])color:\s*rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/g,
  )) {
    trouvees.add(Number(m[1]));
  }
  return [...trouvees].sort((a, b) => b - a);
}

describe('les chapitres sombres de /maya restent lisibles', () => {
  it.each(CHAPITRES_SOMBRES)('%s — aucun texte sous le seuil de lisibilité', (fichier) => {
    /**
     * Le seuil est calculé, pas choisi : sur ce fond, il faut 0,50 d'opacité
     * pour atteindre 4,5:1. La page portait du texte à 0,45 · 0,42 · 0,40 ·
     * 0,38 · 0,30 — cinq niveaux tous en dessous, et personne pour le voir.
     */
    const source = readFileSync(`app/components/landing/maya/${fichier}`, 'utf-8');
    const echecs = opacitesDeTexte(source)
      .map((a) => ({
        a,
        ratio: contraste(composer([255, 255, 255], a, FOND_PANNEAU), FOND_PANNEAU),
      }))
      .filter((x) => x.ratio < 4.5);
    expect(
      echecs.map((x) => `opacité ${x.a} → ${x.ratio.toFixed(2)}:1`),
      'du texte illisible que la porte de CI ne peut pas voir',
    ).toEqual([]);
  });

  it.each(CHAPITRES_SOMBRES)(
    '%s — trois niveaux de gris au plus, sinon ce n’est plus une hiérarchie',
    (fichier) => {
      /**
       * Ton symptôme : « tout est à la même taille, on ne discerne rien, l'œil
       * n'est guidé nulle part ». Il ne venait pas d'une taille unique mais de
       * l'inverse — HUIT opacités dont 0,42 · 0,40 · 0,38, que personne ne
       * distingue. Multiplier les niveaux ne crée pas de hiérarchie : ça la
       * détruit, parce qu'aucun écart ne se lit plus.
       */
      const source = readFileSync(`app/components/landing/maya/${fichier}`, 'utf-8');
      const niveaux = opacitesDeTexte(source);
      expect(niveaux.length, `niveaux de gris : ${niveaux.join(', ')}`).toBeLessThanOrEqual(3);

      /**
       * ⚠️ COMPTER LES NIVEAUX NE SUFFIT PAS — vérifié par mutation.
       *
       * Ma première version s'arrêtait au nombre. En remplaçant 0,78 par 0,55, on
       * restait à trois niveaux et le banc passait — alors que 0,60 et 0,55 sont
       * indiscernables, ce qui est PRÉCISÉMENT le défaut d'origine (0,42 · 0,40 ·
       * 0,38 côte à côte). Un niveau qui ne se voit pas n'est pas un niveau : il
       * faut un écart perceptible entre deux marches.
       */
      for (let i = 1; i < niveaux.length; i++) {
        expect(
          niveaux[i - 1]! - niveaux[i]!,
          `${niveaux[i - 1]} et ${niveaux[i]} : écart imperceptible, ce n’est pas une hiérarchie`,
        ).toBeGreaterThanOrEqual(0.12);
      }
    },
  );

  it('le chapitre 01 garde une vraie échelle de tailles', () => {
    // Avant : sept tailles entassées entre 10,5 et 14 px, plus un chiffre à 34.
    // L'œil n'avait qu'un point d'entrée, puis une masse indifférenciée.
    const source = readFileSync('app/components/landing/maya/MayaVeille.vue', 'utf-8');
    const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
    const tailles = [
      ...new Set([...gabarit.matchAll(/text-\[([0-9.]+)px\]/g)].map((m) => Number(m[1]))),
    ];
    const corps = tailles.filter((t) => t < 20).sort((a, b) => a - b);
    expect(corps.length, `tailles de corps : ${corps.join(', ')}`).toBeLessThanOrEqual(3);
    // Un écart d'au moins 1,5 px entre deux niveaux voisins : en dessous,
    // la différence ne se voit pas et le niveau ne sert à rien.
    for (let i = 1; i < corps.length; i++) {
      expect(
        corps[i]! - corps[i - 1]!,
        `${corps[i - 1]} → ${corps[i]} : écart trop faible`,
      ).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('aucun balayage animé ne traverse plus un panneau de chiffres', () => {
    /**
     * Une barre miel parcourait le panneau de haut en bas toutes les 5,2 s, en
     * boucle. Sur un encadré qu'on vient lire — des chiffres et des exemples —
     * un mouvement perpétuel tire l'œil hors du texte à chaque passage.
     */
    /**
     * On cherche la RÈGLE, pas le mot : un autre chapitre emploie « balayage »
     * dans une note de rédaction (le balayage du matin, côté produit). Un banc
     * qui interdit un mot français interdit aussi d'en parler.
     */
    for (const f of readdirSync('app/components/landing/maya')) {
      const src = readFileSync(`app/components/landing/maya/${f}`, 'utf-8');
      const styles = src.slice(src.indexOf('<style'));
      expect(styles, `${f} porte encore une animation de balayage`).not.toMatch(
        /animation:\s*[\w-]*balayage/i,
      );
    }
  });
});
