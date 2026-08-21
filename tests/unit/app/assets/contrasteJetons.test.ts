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

const CSS = readFileSync('app/assets/css/main.css', 'utf-8');
const jeton = (nom: string): string => {
  const m = CSS.match(new RegExp(`\\n\\s*${nom}:\\s*(#[0-9a-fA-F]{6});`));
  if (!m) throw new Error(`jeton ${nom} introuvable dans main.css`);
  return m[1]!.toLowerCase();
};

/** Les trois fonds de la charte sur lesquels du texte est réellement posé. */
const FONDS = { blanc: '#ffffff', creme: '#fafaf8', mielPale: '#fef6e4' };

describe('--honey-deep — lisible sur les trois fonds de la charte', () => {
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

describe('la valeur retirée ne doit revenir NULLE PART', () => {
  /**
   * `#a86a13` donnait 4,12:1 sur le miel pâle. Elle a été retirée du dépôt.
   * Ce banc n'est pas de la coquetterie : la même couleur avait été recopiée à
   * la main dans dix-neuf fichiers, et c'est exactement comme ça qu'elle
   * reviendra — un copier-coller depuis un vieux composant.
   */
  const ANCIENNE = '#a86a13';

  function fichiers(dir: string, out: string[] = []): string[] {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) fichiers(p, out);
      else if (/\.(vue|css|ts)$/.test(e)) out.push(p);
    }
    return out;
  }

  it('n’apparaît dans aucun fichier de app/', () => {
    const coupables = fichiers('app')
      .filter((f) => {
        const src = readFileSync(f, 'utf-8');
        // La note qui documente le changement a le droit de la citer.
        return src.toLowerCase().includes(ANCIENNE) && !src.includes('Assombri de 4 %');
      })
      .map((f) => f.replace(/^app\//, ''));

    expect(
      coupables,
      `${ANCIENNE} est revenue. Utiliser var(--honey-deep), ou #9f6412 quand une ` +
        'variable CSS est impossible (attribut SVG).',
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
});
