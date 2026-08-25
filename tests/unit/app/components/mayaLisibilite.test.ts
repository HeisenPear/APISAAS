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

  /**
   * Les trois chapitres repris pour la hiérarchie typographique.
   *
   * ⚠️ LES AUTRES N'Y SONT PAS ENCORE, et le dire vaut mieux que le taire :
   * « Ses limites » porte huit tailles, « Elle anticipe » sept, « Elle réagit »
   * cinq. Les inscrire ici ferait rougir la porte sur du travail non commencé ;
   * les passer sous silence ferait croire que la page entière est tenue.
   */
  const CHAPITRES_REPRIS = ['MayaVeille.vue', 'MayaPropose.vue', 'MayaParle.vue'];

  /**
   * ⚠️ ON LIT AUSSI LE BLOC `<style>`, ET C'EST LUI QUI CACHAIT LE DÉSORDRE.
   *
   * La première version ne regardait que le gabarit : le chapitre 01 y montrait
   * trois tailles bien nettes… pendant que ses pastilles vivaient à 10 px dans
   * la feuille de style, et les marches du chapitre 02 à 11 px à côté d'un
   * 11,5 px. Un niveau qu'on ne distingue pas n'est pas un niveau, et une porte
   * qui ne regarde que la moitié du fichier ne le voit jamais.
   */
  function taillesDeCorps(fichier: string): number[] {
    const source = readFileSync(`app/components/landing/maya/${fichier}`, 'utf-8');
    const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
    const styles = source.slice(source.indexOf('<style'));
    const trouvees = [
      ...[...gabarit.matchAll(/text-\[([0-9.]+)px\]/g)].map((m) => Number(m[1])),
      ...[...styles.matchAll(/font-size:\s*([0-9.]+)px/g)].map((m) => Number(m[1])),
    ];
    // Au-delà de 20 px on est sur un CHIFFRE ou un titre : ce n'est plus du
    // corps de texte, et ces pièces-là ont le droit de trancher.
    return [...new Set(trouvees)].filter((t) => t < 20).sort((a, b) => a - b);
  }

  it.each(CHAPITRES_REPRIS)('%s — trois tailles de corps au plus, et qui se voient', (fichier) => {
    // Ton symptôme, mot pour mot : « tout est à la même taille de police, on ne
    // discerne rien, notre œil n'est guidé nulle part ». Le défaut n'est pas
    // une taille unique — c'est SEPT tailles entre 10 et 15 px, qu'aucun œil ne
    // sépare. Trois marches franches valent mieux que sept nuances.
    const corps = taillesDeCorps(fichier);
    expect(corps.length, `tailles de corps : ${corps.join(', ')}`).toBeLessThanOrEqual(3);
    for (let i = 1; i < corps.length; i++) {
      expect(
        corps[i]! - corps[i - 1]!,
        `${corps[i - 1]} → ${corps[i]} : écart trop faible pour se voir`,
      ).toBeGreaterThanOrEqual(1.5);
    }
  });

  it.each(CHAPITRES_REPRIS)(
    '%s — la première colonne s’annonce avant sa première carte',
    (fichier) => {
      /**
       * L'AUTRE MOITIÉ DE « ON N'EST GUIDÉ NULLE PART ».
       *
       * Ces trois chapitres tiennent en deux colonnes. Celle de droite s'annonçait
       * toujours — « Exemple · nuit du 17 au 18 mai », l'en-tête du fil, l'entête
       * de la carte. Celle de gauche, jamais : trois ou quatre cartes tombaient là
       * sans dire ce qu'elles sont. Un seul point d'entrée pour deux colonnes.
       *
       * ⚠️ ET ON NE COMPTE PAS LES SUR-TITRES, ON REGARDE L'ORDRE. Compter aurait
       * été vacillant dans les deux sens : le chapitre 01 en avait déjà UN avant
       * ce lot (celui du panneau de droite), et exiger DEUX aurait forcé le fil de
       * discussion du chapitre 05 à porter une petite capitale dont il n'a aucun
       * besoin — il s'annonce par son avatar. Ce qui compte, c'est qu'un sur-titre
       * arrive AVANT la première carte de la grille.
       */
      const source = readFileSync(`app/components/landing/maya/${fichier}`, 'utf-8');
      const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));

      const grille = gabarit.search(/class="[^"]*\bgrid\b/);
      expect(
        grille,
        'ce chapitre n’est plus en colonnes : ce banc ne veut plus rien dire',
      ).toBeGreaterThan(-1);

      const surtitre = gabarit
        .slice(grille)
        .search(/class="[^"]*text-\[11\.5px\][^"]*uppercase[^"]*tracking-/);
      const premiereCarte = gabarit.slice(grille).search(/v-for=/);

      expect(surtitre, 'aucun sur-titre dans la grille').toBeGreaterThan(-1);
      expect(premiereCarte, 'aucune liste dans la grille').toBeGreaterThan(-1);
      expect(
        surtitre,
        'la première colonne montre ses cartes avant d’avoir dit ce qu’elles sont',
      ).toBeLessThan(premiereCarte);
    },
  );

  it('chapitre 02 — les marches désignent VRAIMENT une ligne de la carte', () => {
    /**
     * Le clic sur une marche éclaire la ligne correspondante de la carte. Le
     * lien passe par une CHAÎNE (`actif === l.cle`) : si l'une des deux listes
     * est reformulée sans l'autre, le clic ne fait plus rien — et rien ne le
     * signale, ni au compilateur, ni à l'écran. C'est exactement le genre de
     * panne muette que cette session a passé son temps à débusquer.
     */
    const source = readFileSync('app/components/landing/maya/MayaPropose.vue', 'utf-8');
    const cles = (bloc: string): string[] =>
      [...bloc.matchAll(/cle:\s*'([^']+)'/g)].map((m) => m[1]!);
    const script = source.slice(source.indexOf('<script setup'));
    const etapes = cles(
      script.slice(script.indexOf('const etapes'), script.indexOf('const lecture')),
    );
    const lecture = cles(script.slice(script.indexOf('const lecture')));

    expect(etapes.length, 'les quatre marches de la chaîne').toBe(4);
    expect(lecture.length, 'les trois lignes de lecture de la carte').toBe(3);
    for (const l of lecture) {
      expect(etapes, `« ${l} » n’est désigné par aucune marche : le clic ne fera rien`).toContain(
        l,
      );
    }
    // La quatrième marche vise les boutons, pas une ligne de lecture : elle est
    // câblée en dur dans le gabarit, donc on vérifie que la chaîne existe.
    const derniere = etapes[etapes.length - 1]!;
    expect(source, `la dernière marche « ${derniere} » ne désigne rien dans le gabarit`).toContain(
      `actif === '${derniere}'`,
    );
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
