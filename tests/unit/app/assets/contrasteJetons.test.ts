import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

/**
 * Blanchit les commentaires en CONSERVANT les numéros de ligne.
 *
 * Pourquoi pas une heuristique par ligne : elle a échoué deux fois de suite.
 * Une première version excluait le fichier entier dès qu'il citait la valeur
 * retirée — ce qui aveuglait main.css, précisément le fichier où une couleur a
 * le plus de chances d'être touchée. La deuxième excluait les lignes
 * COMMENÇANT par `/*`, `*` ou `//` ; mais un bloc CSS multi-ligne écrit dans le
 * style de ce dépôt a des lignes de continuation qui commencent par du texte,
 * et elles étaient donc lues comme du code. Il a fallu un mot magique
 * (`/Assombri/`) pour compenser — un mot qui aurait cessé de fonctionner à la
 * première note rédigée autrement.
 *
 * Suivre l'état ouvert/fermé du commentaire coûte vingt lignes et supprime les
 * deux modes d'échec d'un coup.
 */
function sansCommentaires(src: string): string {
  let out = '';
  let bloc = false; // dans /* … */
  let html = false; // dans <!-- … -->
  for (let i = 0; i < src.length; i++) {
    const deux = src.slice(i, i + 2);
    if (bloc) {
      if (deux === '*/') {
        bloc = false;
        out += '  ';
        i++;
        continue;
      }
      out += src[i] === '\n' ? '\n' : ' ';
      continue;
    }
    if (html) {
      if (src.slice(i, i + 3) === '-->') {
        html = false;
        out += '   ';
        i += 2;
        continue;
      }
      out += src[i] === '\n' ? '\n' : ' ';
      continue;
    }
    if (deux === '/*') {
      bloc = true;
      out += '  ';
      i++;
      continue;
    }
    if (src.slice(i, i + 4) === '<!--') {
      html = true;
      out += '    ';
      i += 3;
      continue;
    }
    if (deux === '//') {
      // Jusqu'à la fin de la ligne. Une URL `https://…` est blanchie elle aussi :
      // sans conséquence ici, on n'y cherche que des codes hexadécimaux.
      while (i < src.length && src[i] !== '\n') {
        out += ' ';
        i++;
      }
      out += '\n';
      continue;
    }
    out += src[i];
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

describe('texte blanc sur fond miel — l’association est retirée', () => {
  /**
   * LE DÉFAUT LE PLUS COÛTEUX TROUVÉ PAR L'AUDIT, et le plus discret.
   *
   * Le miel (#f5a623) est une couleur CLAIRE : du blanc dessus donne 2,03:1
   * là où le texte courant exige 4,5. Ça touchait une cinquantaine de boutons,
   * dont « Commencer gratuitement » — le bouton de conversion de la page
   * d'accueil, présent trois fois. Le texte sombre donne 8,39:1.
   *
   * Le produit faisait déjà les deux : la section Maya utilisait du sombre sur
   * miel. C'était donc autant une incohérence interne qu'un défaut
   * d'accessibilité — et c'est exactement par là que ça reviendra, en copiant
   * un vieux bouton.
   */
  const HONEY = '#f5a623';

  function fichiers(dir: string, out: string[] = []): string[] {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) fichiers(p, out);
      else if (e.endsWith('.vue')) out.push(p);
    }
    return out;
  }

  it('le contraste blanc/miel est bien sous le seuil — d’où l’interdiction', () => {
    expect(contraste('#ffffff', HONEY)).toBeLessThan(4.5);
    expect(contraste(jeton('--text-primary'), HONEY)).toBeGreaterThanOrEqual(4.5);
  });

  it('aucun composant ne pose du blanc sur un fond miel', () => {
    const coupables: string[] = [];

    for (const f of fichiers('app')) {
      const lignes = readFileSync(f, 'utf-8').split('\n');
      lignes.forEach((ligne, i) => {
        // On ne regarde que le voisinage immédiat : en Vue, l'attribut `class`
        // et l'attribut `style` d'un même élément tiennent en quelques lignes.
        const fenetre = lignes.slice(Math.max(0, i - 6), i + 5).join('\n');
        if (!/background:\s*var\(--honey\)/.test(fenetre)) return;
        // `--honey-soft` et `--honey-light` sont des fonds PÂLES : du texte
        // sombre y va de soi, et du blanc n'y a jamais été posé.
        if (/honey-(soft|light)/.test(ligne)) return;
        if (/\btext-white\b|color:\s*(white|#fff{1,4})\b/.test(ligne)) {
          coupables.push(`${f.replace(/^app\//, '')}:${i + 1}`);
        }
      });
    }

    expect(
      coupables,
      'texte blanc sur fond miel : 2,03:1 au lieu de 4,5. Utiliser ' +
        'var(--text-primary) (8,39:1), comme la section Maya le fait déjà.',
    ).toEqual([]);
  });

  it('aucun composant ne pose du blanc sur un fond miel écrit en classe', () => {
    /**
     * LE MÊME DÉFAUT, DANS SES AUTRES ORTHOGRAPHES.
     *
     * Le premier garde ne cherchait que `background: var(--honey)`. Il a laissé
     * passer quinze boutons et badges peints autrement :
     *
     *   · `bg-amber-500 … text-white` — « Passer au plan Starter »,
     *     « Le plus populaire », « Plan actuel ». #fe9a00, 2,13:1.
     *   · `bg-[#F5A623] … text-white` — le bouton de conversion RÉPÉTÉ sur cinq
     *     pages de référencement (/faq, /blog/*, /utilisations/*,
     *     /alternative-beekube, /meilleur-logiciel-apiculture). 2,03:1, et ce
     *     sont précisément les pages qui reçoivent le trafic organique.
     *
     * Même couleur, même défaut, trois graphies. Un garde qui n'en connaît
     * qu'une ne garde pas le défaut : il garde une façon de l'écrire.
     *
     * Ambre 300 à 600 : au-delà, la teinte est assez sombre pour porter du blanc.
     */
    const FONDS_MIEL = /\bbg-amber-[3-6]00\b|bg-\[#[fF]5[aA]623\]/;
    const coupables: string[] = [];
    for (const f of fichiersApp().filter((x) => x.endsWith('.vue'))) {
      sansCommentaires(readFileSync(f, 'utf-8'))
        .split('\n')
        .forEach((ligne, i) => {
          if (!FONDS_MIEL.test(ligne)) return;
          if (!/\btext-white\b/.test(ligne)) return;
          coupables.push(`${f.replace(/^app\//, '')}:${i + 1}`);
        });
    }

    expect(
      coupables,
      'blanc sur miel : 2,0-2,1:1 au lieu de 4,5. Utiliser text-[var(--text-primary)].',
    ).toEqual([]);
  });
});
