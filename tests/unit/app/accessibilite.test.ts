// ═══════════════════════════════════════════════════════════════════════════
// UN BOUTON SANS LIBELLÉ N'EXISTE PAS POUR QUI NE VOIT PAS L'ICÔNE.
//
// Un lecteur d'écran annonce « bouton ». Rien d'autre. L'apiculteur ne sait ni
// ce qu'il déclenche, ni s'il ferme, supprime ou envoie. C'est aussi ce que voit
// quiconque navigue au clavier sans survoler, et ce que lisent les outils
// d'audit qui notent le site.
//
// Le produit est plein de boutons à icône seule — fermer une fenêtre, retirer
// une ligne, incrémenter une quantité. Ils sont parfaitement lisibles à l'œil et
// muets pour tout le reste.
//
// ─── CE QUI COMPTE COMME LIBELLÉ ───────────────────────────────────────────
// Un `aria-label` (fixe ou lié), un `title`, un `sr-only` dans le contenu, ou
// du texte visible. N'importe lequel suffit — il s'agit de nommer l'action, pas
// d'imposer une technique.
// ═══════════════════════════════════════════════════════════════════════════

import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FICHIERS = [...globSync('app/components/**/*.vue'), ...globSync('app/pages/**/*.vue')].sort();

/** Un bouton dépourvu de tout libellé accessible. */
interface BoutonMuet {
  fichier: string;
  extrait: string;
}

function boutonsMuets(): BoutonMuet[] {
  const muets: BoutonMuet[] = [];
  for (const fichier of FICHIERS) {
    const source = readFileSync(fichier, 'utf-8');
    for (const m of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const [, attributs = '', contenu = ''] = m;
      if (/aria-label|:aria-label|\btitle=|:title=/.test(attributs)) continue;
      if (/sr-only|aria-label/.test(contenu)) continue;
      // Texte visible : on retire les balises, il doit rester quelque chose.
      // Une interpolation `{{ … }}` compte — c'est un libellé, même calculé.
      if (contenu.replace(/<[^>]+>/g, '').trim()) continue;
      muets.push({ fichier, extrait: m[0].replace(/\s+/g, ' ').slice(0, 80) });
    }
  }
  return muets;
}

describe('accessibilité — les boutons ont un nom', () => {
  it('le balayage voit bien les composants (garde-fou du banc)', () => {
    // Sans ce contrôle, un chemin erroné rendrait la liste vide et le cas
    // suivant vert : le banc affirmerait une conformité qu'il n'a pas mesurée.
    expect(FICHIERS.length).toBeGreaterThan(150);
    const avecBoutons = FICHIERS.filter((f) => readFileSync(f, 'utf-8').includes('<button'));
    expect(avecBoutons.length).toBeGreaterThan(50);
  });

  it('aucun bouton n’est annoncé « bouton » et rien d’autre', () => {
    const muets = boutonsMuets();
    const parFichier = muets.map((b) => `${b.fichier} — ${b.extrait}`);
    expect(parFichier).toEqual([]);
  });

  it('aucun libellé ne CONTREDIT le texte visible du bouton', () => {
    // Règle distincte, et je l'ai apprise en la cassant : en posant les libellés
    // manquants, mon script en a mis sur des boutons qui portaient déjà leur
    // texte — « Accueil » s'est retrouvé annoncé « Aperçu : revenir au tableau
    // de bord ».
    //
    // Ce n'est pas une redondance inoffensive : `aria-label` REMPLACE le texte
    // visible. Un lecteur d'écran n'entend plus « Accueil », et surtout la
    // commande vocale ne fonctionne plus — dire « cliquer sur Accueil » ne
    // correspond alors à aucun nom exposé. C'est le critère « Label in Name »
    // du WCAG, et il se viole précisément en croyant bien faire.
    const contradictions: string[] = [];
    for (const fichier of FICHIERS) {
      const source = readFileSync(fichier, 'utf-8');
      for (const m of source.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
        const [, attributs = '', contenu = ''] = m;
        const libelle = /\baria-label="([^"]*)"/.exec(attributs)?.[1];
        if (!libelle) continue;
        const visible = contenu.replace(/<[^>]+>/g, '').trim();
        // Pas de texte visible : le libellé est la seule source, tout va bien.
        if (!visible) continue;
        // Le texte visible doit se retrouver dans le nom annoncé.
        if (!visible.toLowerCase().includes(libelle.toLowerCase())) {
          contradictions.push(`${fichier} — « ${libelle} » masque « ${visible.slice(0, 40)} »`);
        }
      }
    }
    expect(contradictions).toEqual([]);
  });
});
