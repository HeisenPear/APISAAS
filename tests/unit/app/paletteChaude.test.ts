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
