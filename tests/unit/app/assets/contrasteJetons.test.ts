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
