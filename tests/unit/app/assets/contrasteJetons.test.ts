import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * Contraste des jetons de couleur — la lisibilité comme invariant, pas comme
 * intention.
 *
 * Ce banc existe parce que la dérive a déjà eu lieu : `--honey-deep` était
 * défini une fois dans main.css… et recopié EN DUR dans dix-neuf fichiers, à
 * quarante-cinq endroits. Corriger le jeton ne corrigeait donc rien. Un jeton
 * contourné n'est pas un système de design, c'est une suggestion.
 */

/** Luminance relative WCAG 2.1. */
function luminance([r, g, b]: [number, number, number]): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

function hex(h: string): [number, number, number] {
  const v = h.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function contraste(a: string, b: string): number {
  const [la, lb] = [luminance(hex(a)), luminance(hex(b))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function fichiersApp(dir = 'app', out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) fichiersApp(p, out);
    else if (/\.(vue|css|ts)$/.test(e)) out.push(p);
  }
  return out;
}

const CSS = readFileSync('app/assets/css/main.css', 'utf-8');
const jeton = (nom: string): string => {
  const m = CSS.match(new RegExp(`\\n\\s*${nom}:\\s*(#[0-9a-fA-F]{6});`));
  if (!m) throw new Error(`jeton ${nom} introuvable dans main.css`);
  return m[1]!.toLowerCase();
};

/**
 * Les fonds de la charte, DÉRIVÉS de main.css — jamais recopiés à la main.
 *
 * Pourquoi cette dérivation plutôt qu'une liste : elle a déjà échoué en tant
 * que liste. Un premier correctif du tertiaire s'était validé sur trois fonds
 * écrits ici en dur, et laissait passer 4,35:1 sur `--surface-muted` — un fond
 * bien réel (barres segmentées, onglets de tarifs) que la liste ignorait. Le
 * banc mesurait mon inventaire, pas la charte.
 *
 * Répartition des rôles, à garder en tête : ce banc verrouille les fonds
 * DÉCLARÉS ; c'est `npm run audit:mise-en-page` qui découvre les fonds non
 * déclarés, en mesurant les pixels réellement rendus. Les deux sont
 * nécessaires — le banc est rapide et bloque la CI, l'audit voit ce que le
 * banc ne peut pas deviner.
 */
const PREFIXES_FOND = /^--(surface|honey-soft|honey-light|sage-soft|clay-soft)/;

/** Tout le code de l'app, concaténé une fois : sert à savoir qui consomme quoi. */
const SOURCES_APP = fichiersApp()
  .map((f) => readFileSync(f, 'utf-8'))
  .join('\n');

function fondsDeLaCharte(): Record<string, string> {
  const out: Record<string, string> = {};
  // Dernière définition gagnante, comme la cascade CSS : `--surface-muted` est
  // déclaré deux fois dans main.css, et c'est la seconde qui s'applique.
  for (const m of CSS.matchAll(/\n\s*(--[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    const [, nom, valeur] = m;
    if (!PREFIXES_FOND.test(nom!)) continue;
    // La sidebar est noire : ce n'est pas un fond de texte courant.
    if (luminance(hex(valeur!)) < 0.5) continue;
    /**
     * DÉCLARÉ ne suffit pas — il faut CONSOMMÉ.
     *
     * `--honey-light` est dans la charte et n'a aucun consommateur : mesurer
     * `--honey-deep` dessus faisait échouer le banc sur une association que
     * rien ne peut afficher. Un banc qui bloque la CI sur un pixel inexistant
     * finit désactivé, et emporte avec lui les mesures qui, elles, comptaient.
     *
     * Le filtre est aussi ce qui rend la couverture automatique dans l'autre
     * sens : le jour où quelqu'un pose du texte sur ce fond, il entre dans la
     * mesure au run suivant — au moment précis où l'association devient réelle.
     */
    if (!SOURCES_APP.includes(`var(${nom})`)) continue;
    out[nom!] = valeur!.toLowerCase();
  }
  return out;
}

const FONDS = fondsDeLaCharte();

describe('les fonds mesurés viennent bien de la charte', () => {
  it('la dérivation ramène les fonds connus, et pas une liste vide', () => {
    // Un banc qui mesure zéro fond passe toutes ses assertions sans rien
    // vérifier. C'est le seul mode d'échec silencieux de cette dérivation.
    expect(Object.keys(FONDS).length, 'aucun fond dérivé de main.css').toBeGreaterThanOrEqual(4);
    expect(Object.values(FONDS)).toContain('#ffffff');
    expect(
      Object.keys(FONDS),
      'un fond déclaré mais sans consommateur ne doit pas bloquer la CI',
    ).not.toContain('--honey-light');
    expect(Object.values(FONDS)).toContain('#fafaf8');
    expect(Object.values(FONDS), 'le fond des barres segmentées manque').toContain('#f4f2ed');
  });
});

describe('--honey-deep — lisible sur les fonds de la charte', () => {
  it('atteint 4,5:1 partout où il sert de couleur de texte', () => {
    const c = jeton('--honey-deep');
    for (const [nom, fond] of Object.entries(FONDS)) {
      expect(
        contraste(c, fond),
        `--honey-deep (${c}) sur ${nom} (${fond}) : sous le seuil de texte courant. ` +
          'Mesuré sur la page d’accueil par `npm run audit:mise-en-page`.',
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('--text-tertiary — lisible sur les fonds de la charte', () => {
  /**
   * Ce jeton portait de l'INFORMATION à 10-11 px — « Ruches actives », « Poids
   * en direct », les mois d'un graphique — à 2,52:1 sur blanc. Un libellé qu'on
   * ne peut pas lire n'est pas un détail de style : c'est du contenu perdu.
   */
  it('atteint 4,5:1 partout où il sert de couleur de texte', () => {
    const c = jeton('--text-tertiary');
    for (const [nom, fond] of Object.entries(FONDS)) {
      expect(
        contraste(c, fond),
        `--text-tertiary (${c}) sur ${nom} (${fond}) : sous le seuil de texte courant.`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('reste distinct de --text-secondary — la hiérarchie doit survivre', () => {
    /**
     * Le piège de cette correction : assombrir jusqu'à passer le seuil peut
     * aplatir l'échelle typographique. Un tertiaire indiscernable du secondaire
     * ne hiérarchise plus rien, et on aura échangé un défaut contre un autre.
     */
    const t = jeton('--text-tertiary');
    const sec = jeton('--text-secondary');
    expect(t, 'tertiaire et secondaire sont devenus la même couleur').not.toBe(sec);
    expect(
      contraste(t, sec),
      'tertiaire et secondaire ne se distinguent plus assez pour hiérarchiser',
    ).toBeGreaterThan(1.15);
  });
});

describe('les valeurs retirées ne doivent revenir NULLE PART', () => {
  /**
   * `#a86a13` donnait 4,12:1 sur le miel pâle. Elle a été retirée du dépôt.
   * Ce banc n'est pas de la coquetterie : la même couleur avait été recopiée à
   * la main dans dix-neuf fichiers, et c'est exactement comme ça qu'elle
   * reviendra — un copier-coller depuis un vieux composant.
   */
  const ANCIENNES = [
    { hex: '#a86a13', jeton: '--honey-deep', neuf: '#925b0f' },
    { hex: '#9f6412', jeton: '--honey-deep', neuf: '#925b0f' },
    { hex: '#a8a29e', jeton: '--text-tertiary', neuf: '#706963' },
  ];

  it.each(ANCIENNES)('$hex n’apparaît dans aucun fichier de app/', ({ hex, jeton: nom, neuf }) => {
    /**
     * Exclusion LIGNE PAR LIGNE, pas fichier par fichier.
     *
     * main.css cite les deux anciennes valeurs dans les notes qui expliquent
     * pourquoi elles ont été retirées — c'est légitime. Mais exclure le fichier
     * entier pour autant y créerait un angle mort : une vraie régression posée
     * trois lignes plus bas passerait inaperçue, dans le seul fichier où une
     * couleur a le plus de chances d'être touchée.
     */
    const coupables: string[] = [];
    for (const f of fichiersApp()) {
      sansCommentaires(readFileSync(f, 'utf-8'))
        .split('\n')
        .forEach((ligne, i) => {
          if (!ligne.toLowerCase().includes(hex)) return;
          coupables.push(`${f.replace(/^app\//, '')}:${i + 1}`);
        });
    }

    expect(
      coupables,
      `${hex} est revenue. Utiliser var(${nom}), ou ${neuf} quand une variable CSS ` +
        'est impossible (attribut SVG).',
    ).toEqual([]);
  });
});

describe('texte blanc sur fond miel — décision de design, assumée', () => {
  /**
   * DÉCISION PRODUIT, PRISE CONTRE LA MESURE. À LIRE AVANT DE « CORRIGER ».
   *
   * Le miel (#f5a623) est une couleur CLAIRE : du blanc dessus donne 2,03:1,
   * là où WCAG 2.1 demande 4,5 pour du texte courant. Un correctif a donc passé
   * une cinquantaine de boutons en texte sombre (8,39:1) — et le résultat a été
   * refusé : « en noir ça fait vraiment moche ». Les boutons sont repassés en
   * blanc, en connaissance de cause.
   *
   * Ce n'est pas un oubli, et ce banc existe pour que personne ne le retrouve
   * comme tel dans six mois. L'aller-retour a déjà eu lieu ; le refaire se
   * ferait refuser de la même manière.
   *
   * IL N'Y A PAS DE TROISIÈME VOIE, et c'est le point important. Garder le
   * texte blanc en fonçant le FOND ne marche qu'à partir de ~64 % de la
   * luminosité du miel (#9d6a16, 4,66:1) : à ce niveau le bouton n'est plus
   * miel, il est brun. Les deux seules options réelles sont donc « miel + blanc
   * à 2,03:1 » et « miel + sombre à 8,39:1 ». C'est la première qui est
   * retenue.
   *
   * Ce que le banc garde : la COHÉRENCE. Un bouton miel porte du blanc, tous
   * les boutons miel portent du blanc. C'est l'incohérence — la moitié en
   * blanc, l'autre en sombre — qui avait déclenché tout ceci.
   */
  const HONEY = '#f5a623';

  it('les deux options sont bien celles-là, et pas une troisième', () => {
    expect(contraste('#ffffff', HONEY), 'blanc sur miel').toBeLessThan(4.5);
    expect(contraste(jeton('--text-primary'), HONEY), 'sombre sur miel').toBeGreaterThanOrEqual(
      4.5,
    );
    // Le miel assombri jusqu'à porter du blanc n'est plus du miel : on le
    // mesure ici pour que l'argument ne repose pas sur une impression.
    expect(contraste('#ffffff', '#a77118'), 'miel à 68 %').toBeLessThan(4.5);
    expect(contraste('#ffffff', '#9d6a16'), 'miel à 64 % — déjà brun').toBeGreaterThanOrEqual(4.5);
  });

  it('aucun bouton miel ne repasse en texte sombre', () => {
    /**
     * Le garde tourné dans l'AUTRE SENS : le risque n'est plus qu'on pose du
     * blanc sur du miel — c'est ce qu'on veut — mais qu'un audit
     * d'accessibilité bien intentionné repasse quelques boutons en sombre et
     * rétablisse l'incohérence de départ.
     *
     * ⚠️ MÊME LIGNE, pas une fenêtre de voisinage. Le garde d'origine regardait
     * onze lignes autour du fond miel ; ça marchait pour du texte BLANC, qui
     * est rare et presque toujours posé sur une couleur. Retourné vers le texte
     * sombre — la valeur par défaut de toute la charte — le même voisinage
     * remontait onze faux coupables : l'autre branche d'un ternaire, un libellé
     * voisin, un bord de carte. Un garde qui crie au loup finit désactivé.
     *
     * Ces boutons s'écrivent d'un seul tenant (`background: var(--honey);
     * color: …`, ou `bg-amber-500 … text-…`). La même ligne suffit, et ne
     * ment pas.
     */
    const FOND_MIEL = /background:\s*var\(--honey\)|\bbg-amber-[3-6]00\b|bg-\[#[fF]5[aA]623\]/;
    const TEXTE_SOMBRE = /text-\[var\(--text-primary\)\]|color:\s*var\(--text-primary\)/;
    const coupables: string[] = [];

    for (const f of fichiersApp().filter((x) => x.endsWith('.vue'))) {
      sansCommentaires(readFileSync(f, 'utf-8'))
        .split('\n')
        .forEach((ligne, i) => {
          // `--honey-soft` et `--honey-light` sont des fonds PÂLES : le texte
          // sombre y est correct, et c'est le seul choix lisible.
          if (/honey-(soft|light)/.test(ligne)) return;
          if (!FOND_MIEL.test(ligne) || !TEXTE_SOMBRE.test(ligne)) return;
          coupables.push(`${f.replace(/^app\//, '')}:${i + 1}`);
        });
    }

    /**
     * DEUXIÈME PASSE : les règles CSS.
     *
     * La règle « même ligne » suffit pour un attribut `style=` ou une liste de
     * classes, mais rate complètement la forme la plus courante dans ce dépôt :
     *
     *     .wm-badge { background: var(--honey); color: #fff; }
     *
     * où les deux déclarations sont sur DEUX lignes. Le bon périmètre n'est
     * alors ni la ligne ni un voisinage arbitraire : c'est le bloc de
     * déclarations. `[^{}]*` ne capture que les blocs INTERNES — donc le corps
     * d'une règle, jamais l'enveloppe d'un `@media`.
     */
    for (const f of fichiersApp()) {
      const src = sansCommentaires(readFileSync(f, 'utf-8'));
      for (const bloc of src.matchAll(/\{([^{}]*)\}/g)) {
        const corps = bloc[1]!;
        if (!/background(-color)?:\s*var\(--honey\)/.test(corps)) continue;
        if (!/(^|[;\s])color:\s*var\(--text-primary\)/.test(corps)) continue;
        /**
         * `::selection` n'est pas un bouton : c'est le surlignage de sélection
         * de texte. Le texte sélectionné doit rester LISIBLE, et du blanc sur
         * miel y serait pire qu'ailleurs — on lit encore ce qu'on vient de
         * sélectionner. Seule exception, nommée pour qu'elle reste une
         * exception.
         */
        const avant = src.slice(0, bloc.index);
        const selecteur = avant.slice(Math.max(0, avant.lastIndexOf('}') + 1));
        if (/::selection/.test(selecteur)) continue;
        const ligne = avant.split('\n').length;
        coupables.push(`${f.replace(/^app\//, '')}:${ligne}`);
      }
    }

    expect(
      coupables,
      'texte sombre sur un fond miel : décision produit contraire (voir le commentaire ' +
        'de ce banc). Les boutons miel portent du texte BLANC.',
    ).toEqual([]);
  });
});
