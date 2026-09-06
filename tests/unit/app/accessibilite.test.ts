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

/**
 * ⚠️ `[^>]*` NE SUFFIT PAS POUR LES ATTRIBUTS D'UNE BALISE VUE.
 *
 * `:disabled="annee >= currentYear"` contient un `>` : la version précédente
 * s'arrêtait dessus, prenait la fin de l'expression pour du contenu de bouton,
 * et accusait un `aria-label` parfaitement correct de « masquer » le texte
 * « = currentYear" @click="annee ». Le banc a signalé un défaut qui n'existait
 * pas — le plus coûteux des faux positifs, puisqu'on corrige le code sain.
 *
 * On consomme donc les valeurs entre guillemets d'un bloc, et seuls les `>`
 * hors chaîne ferment la balise.
 */
const BALISE_BOUTON = /<button\b((?:"[^"]*"|'[^']*'|[^>"'])*)>([\s\S]*?)<\/button>/g;

/** Un bouton dépourvu de tout libellé accessible. */
interface BoutonMuet {
  fichier: string;
  extrait: string;
}

function boutonsMuets(): BoutonMuet[] {
  const muets: BoutonMuet[] = [];
  for (const fichier of FICHIERS) {
    const source = readFileSync(fichier, 'utf-8');
    for (const m of source.matchAll(BALISE_BOUTON)) {
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
      for (const m of source.matchAll(BALISE_BOUTON)) {
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

// ═══════════════════════════════════════════════════════════════════════════
// « RÉDUIRE LES ANIMATIONS » EST UN RÉGLAGE DE SANTÉ, PAS UNE PRÉFÉRENCE
// ═══════════════════════════════════════════════════════════════════════════

describe('accessibilité — mouvement réduit', () => {
  const mainCss = readFileSync('app/assets/css/main.css', 'utf-8');

  it('la neutralisation est GLOBALE, pas limitée à quelques classes', () => {
    // Le produit anime beaucoup — c'est un parti pris assumé (« animations
    // fluides sur TOUT », 250 ms ease-out-expo). Il n'en a que plus besoin d'un
    // interrupteur qui marche.
    //
    // Les règles historiques ne visaient que des classes NOMMÉES : les
    // utilitaires du design system et celles de Maya. Tout le reste passait au
    // travers — les `transition-*` de Tailwind, les `transition:` de composant,
    // et les squelettes `animate-pulse` qui pulsent en continu sur chaque écran
    // en attente. Pour qui a activé ce réglage, ce n'est pas un détail
    // esthétique : c'est ce qui déclenche les vertiges.
    const blocs = mainCss.split('@media (prefers-reduced-motion: reduce)').slice(1);
    expect(blocs.length, 'aucune règle de mouvement réduit').toBeGreaterThan(0);

    // Au moins un bloc doit viser le sélecteur universel — c'est ce qui
    // distingue une couverture complète d'une liste de cas particuliers.
    const universel = blocs.some((b) => /^\s*\{?\s*\*\s*,/m.test(b.slice(0, 200)));
    expect(universel, 'aucun bloc ne vise `*` : la couverture reste partielle').toBe(true);
  });

  it('la durée est écrasée mais JAMAIS mise à zéro', () => {
    // Une animation de durée nulle n'émet pas `animationend`. Aucun code
    // n'écoute cet événement aujourd'hui, mais le jour où l'un le fera, il
    // resterait bloqué sans que personne ne fasse le lien avec un réglage
    // système. 0,01 ms coûte le même effet visuel et garde l'événement.
    const bloc = mainCss
      .split('@media (prefers-reduced-motion: reduce)')
      .find((b) => /\*\s*,/.test(b.slice(0, 200)));
    expect(bloc).toBeTruthy();
    expect(bloc).toMatch(/animation-duration:\s*0\.01ms/);
    expect(bloc).toMatch(/transition-duration:\s*0\.01ms/);
    expect(bloc).not.toMatch(/(animation|transition)-duration:\s*0s/);
  });

  it('le défilement doux est neutralisé lui aussi', () => {
    // `scroll-behavior: smooth` est actif dans cette feuille. Un défilement qui
    // glisse est un mouvement, au même titre qu'un fondu.
    expect(mainCss).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AU CLAVIER, IL FAUT VOIR OÙ L'ON EST
// ═══════════════════════════════════════════════════════════════════════════

describe('accessibilité — le focus reste visible', () => {
  it('la règle globale de focus existe', () => {
    // `:focus-visible` avec l'anneau miel est le filet de sécurité : tout
    // élément qui ne dit rien de particulier en hérite. C'est ce qui rend les
    // 98 `outline-none` acceptables — à condition qu'ils rendent la pareille.
    const mainCss = readFileSync('app/assets/css/main.css', 'utf-8');
    expect(mainCss).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid/);
  });

  it('un `outline-none` s’accompagne toujours d’un repère de remplacement', () => {
    // Retirer le contour sans rien mettre à la place rend la navigation au
    // clavier aveugle : la tabulation avance, et rien ne bouge à l'écran.
    //
    // Constat de départ : 98 `outline-none`, dont 91 fournissaient déjà un
    // anneau. Les six manquants étaient des champs de saisie transparents et
    // sans bordure — recherche de l'administration, composeur de Maya, palette
    // de commandes, quantité de matériel — posés dans un conteneur qui ne
    // réagit pas au focus. On y entrait sans le moindre signe.
    const nus: string[] = [];
    for (const fichier of FICHIERS) {
      const source = readFileSync(fichier, 'utf-8');
      for (const m of source.matchAll(/class="([^"]*\boutline-none\b[^"]*)"/g)) {
        const classes = m[1] ?? '';
        if (/focus:ring|focus-visible:|focus:border|focus:outline-|focus-within:/.test(classes)) {
          continue;
        }
        nus.push(`${fichier} — ${classes.slice(0, 60)}`);
      }
    }

    // Une seule tolérance, et elle est justifiée : une carte de présentation
    // décorative de la page « fonctionnalités ». C'est un `<div>` sans
    // `tabindex`, donc jamais focusable — son `outline-none` ne retire rien.
    const restants = nus.filter((n) => !n.includes('fonctionnalites.vue'));
    expect(restants).toEqual([]);
  });
});
