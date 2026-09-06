// ═══════════════════════════════════════════════════════════════════════════
// « WARM PRECISION » — LA PALETTE RESTE CHAUDE.
//
// C'est la décision d'identité du produit : couleur signature miel #F5A623,
// fonds blanc cassé chaud, jamais de blanc pur. Un vert qui réapparaît ne casse
// rien et ne se voit pas en revue de code — il se voit à l'écran, une fois
// livré, et il jure.
//
// ─── CE QUE CE BANC A ÉTÉ ÉCRIT POUR CONSTATER ─────────────────────────────
// Le plan de tests portait « `var(--sage)`, 179 occurrences, à arbitrer fichier
// par fichier : toléré pour la sémantique, proscrit pour l'identité ».
//
// L'arbitrage était sans objet. `--sage` n'est plus un vert depuis l'abandon du
// vert sauge : c'est un ambre bronze (#c9873d). Le nom du jeton a été gardé pour
// ne pas réécrire une cinquantaine de fichiers. Ce qui restait, c'était une
// règle de design écrite 700 lignes plus bas qui parlait encore « du vert
// (--sage) » — de quoi faire croire à un lecteur pressé qu'une couleur froide
// traînait dans la palette, et de quoi l'inviter à en réintroduire une.
//
// La règle est corrigée. Ce banc constate l'état de fait plutôt que de le
// répéter en commentaire : aucun jeton n'est vert, et si l'un le redevient, il
// faudra que ce soit une décision, pas une inadvertance.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync('app/assets/css/main.css', 'utf-8');

/** Toutes les couleurs hexadécimales déclarées comme JETONS (`--nom: #…`). */
function jetonsCouleur(): { nom: string; hex: string }[] {
  return [...CSS.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => ({
    nom: m[1] as string,
    hex: (m[2] as string).toLowerCase(),
  }));
}

/** Vert au sens perceptif : le canal vert domine NETTEMENT les deux autres. */
function estVert(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const v = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return v > r + 18 && v > b + 18;
}

describe('design system — la palette reste chaude', () => {
  it('les jetons de couleur sont bien lus (garde-fou du banc)', () => {
    // Une expression qui ne trouve plus rien rendrait le cas suivant vert sur
    // une liste vide : le banc affirmerait une palette conforme sans l'avoir
    // regardée.
    const jetons = jetonsCouleur();
    expect(jetons.length).toBeGreaterThan(20);
    expect(jetons.map((j) => j.nom)).toContain('--honey');
  });

  it('aucun jeton n’est vert', () => {
    // Y compris `--sage`, dont le NOM le laisserait croire : c'est le piège que
    // ce banc rend inoffensif.
    const verts = jetonsCouleur()
      .filter((j) => estVert(j.hex))
      .map((j) => `${j.nom}: ${j.hex}`);
    expect(verts).toEqual([]);
  });

  it('la couleur signature est bien le miel', () => {
    // Contre-test : sans lui, une palette vidée de ses couleurs satisferait le
    // cas précédent.
    expect(CSS).toMatch(/--honey:\s*#f5a623/i);
  });

  it('`--sage` est chaud malgré son nom', () => {
    // On épingle le cas nommément. Si quelqu'un « rétablit » le vert sauge en
    // croyant réparer une régression, il verra ce banc et lira pourquoi.
    const sage = jetonsCouleur().find((j) => j.nom === '--sage');
    expect(sage, 'le jeton --sage a disparu').toBeTruthy();
    expect(estVert(sage!.hex), `--sage vaut ${sage!.hex} et redevient vert`).toBe(false);
  });

  it('la règle écrite ne contredit plus la palette', () => {
    // Le vrai défaut trouvé ici n'était pas une couleur, c'était une PHRASE :
    // « le vert (--sage) reste réservé à la sémantique », maintenue 700 lignes
    // sous une définition qui n'a plus rien de vert. Une consigne fausse coûte
    // plus cher qu'une consigne absente — on la suit.
    expect(CSS).not.toMatch(/[Ll]e vert \(--sage\) reste réservé/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTRASTES — ce qui est lisible, et ce qui ne l'est pas
//
// APIGO se consulte DEHORS, sur un téléphone, en plein soleil, par quelqu'un
// qui a des gants et une fumée devant les yeux. Le contraste n'y est pas une
// case à cocher : c'est la différence entre lire un numéro de ruche et le
// deviner.
// ═══════════════════════════════════════════════════════════════════════════

/** Luminance relative (WCAG 2.x). */
function luminance(hex: string): number {
  const canal = (v: number) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  const [r, v, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Valeur d'un jeton, lue dans la feuille plutôt que recopiée. */
function jeton(nom: string): string {
  const m = new RegExp(`${nom}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS);
  if (!m?.[1]) throw new Error(`jeton ${nom} introuvable`);
  return m[1].toLowerCase();
}

describe('design system — contrastes', () => {
  const FOND = () => jeton('--surface-primary');

  it('le texte principal et le secondaire passent AA très largement', () => {
    // 16,3:1 et 7,3:1 — aucune inquiétude, et c'est ce qui porte l'essentiel de
    // l'information. On l'épingle pour que ça reste vrai.
    expect(contraste(jeton('--text-primary'), FOND())).toBeGreaterThanOrEqual(4.5);
    expect(contraste(jeton('--text-secondary'), FOND())).toBeGreaterThanOrEqual(4.5);
  });

  it('les deux gris pâles ne se dégradent JAMAIS davantage', () => {
    // DETTE MESURÉE, tenue par un cliquet — pas une conformité affirmée.
    //
    // `--text-tertiary` (#a8a29e) est à 2,41:1 et sert 993 fois, presque
    // toujours en 11, 12 ou 13 px : de la PETITE typographie, celle qui exige
    // 4,5:1 et non l'indulgence des 3:1 réservée aux grands caractères.
    // `--text-quaternary` (#d6d3d1) est à 1,43:1 — à la limite du visible.
    //
    // Les corriger change l'aspect de presque tous les écrans : c'est une
    // décision d'identité, elle revient au produit, pas à ce banc. Ce qu'il
    // interdit, c'est que ça EMPIRE en silence — et il gardera la trace du
    // chiffre le jour où la décision se prendra.
    //
    // Pour information, si le choix est fait : #7a726d atteint 4,5:1 et #97908b
    // atteint 3:1, tous deux en conservant la chaleur de la teinte actuelle.
    expect(contraste(jeton('--text-tertiary'), FOND())).toBeGreaterThanOrEqual(2.4);
    expect(contraste(jeton('--text-quaternary'), FOND())).toBeGreaterThanOrEqual(1.42);
  });

  it('les couleurs d’état restent distinguables du fond', () => {
    // Une alerte critique doit se voir. 3:1 est le seuil des composants
    // d'interface — c'est bien de cela qu'il s'agit : une pastille, une bordure.
    for (const nom of ['--status-bad', '--status-warn', '--status-info']) {
      expect(contraste(jeton(nom), FOND()), `${nom} trop pâle`).toBeGreaterThanOrEqual(3);
    }
  });
});
