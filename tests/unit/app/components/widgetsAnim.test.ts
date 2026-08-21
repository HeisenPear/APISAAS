import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { WIDGET_CATALOG } from '~/config/widgets';

/**
 * L'animation de widgets de la page d'accueil annonce un NOMBRE et affiche des
 * NOMS. Les deux viennent du catalogue réel — et ni l'un ni l'autre ne doit
 * être cru sur parole.
 *
 * Le nombre est particulièrement traître : les raccourcis ne sont pas écrits à
 * la main mais dérivés de la navigation (`NAV_SECTIONS.flatMap`). On ne peut
 * donc pas le compter en lisant le fichier — il faut exécuter le catalogue.
 * C'est aussi pour ça qu'il bougera sans que personne n'y pense : ajouter une
 * entrée de menu ajoute un widget.
 */
const SOURCE = readFileSync('app/components/ui/webmockup/WmWidgetsAnim.vue', 'utf-8');

describe('WmWidgetsAnim — ce qu’elle annonce existe', () => {
  it('le total affiché est celui du catalogue', () => {
    const m = SOURCE.match(/const TOTAL_WIDGETS = (\d+);/);
    expect(m, 'TOTAL_WIDGETS introuvable dans le composant').not.toBeNull();
    expect(
      Number(m![1]),
      `Le catalogue compte ${WIDGET_CATALOG.length} widgets. Les raccourcis étant ` +
        'dérivés de NAV_SECTIONS, ce nombre change dès qu’on touche à la navigation — ' +
        'mettre à jour WmWidgetsAnim.vue.',
    ).toBe(WIDGET_CATALOG.length);
  });

  it('chaque widget montré existe vraiment dans le catalogue', () => {
    /**
     * Neuf noms sont affichés. S'ils étaient inventés, la page d'accueil
     * promettrait des widgets que le produit n'a pas — l'erreur exacte que j'ai
     * commise cinq fois sur la page Maya cette nuit.
     */
    const montres = [...SOURCE.matchAll(/\{ nom: '([^']+)'/g)].map((m) => m[1]!.replace(/’/g, "'"));
    expect(montres.length, 'aucun widget listé dans le composant').toBeGreaterThanOrEqual(9);

    const connus = new Set(WIDGET_CATALOG.map((w) => w.label.replace(/’/g, "'")));
    const inventes = montres.filter((n) => !connus.has(n));
    expect(
      inventes,
      'widget(s) affiché(s) sur la page d’accueil mais absent(s) du catalogue',
    ).toEqual([]);
  });

  it('les plans annoncés sont ceux du catalogue', () => {
    const paires = [...SOURCE.matchAll(/\{ nom: '([^']+)', plan: '([^']+)'/g)].map((m) => ({
      nom: m[1]!.replace(/’/g, "'"),
      plan: m[2]!,
    }));
    const parLabel = new Map(WIDGET_CATALOG.map((w) => [w.label.replace(/’/g, "'"), w]));

    const faux: string[] = [];
    for (const { nom, plan } of paires) {
      const w = parLabel.get(nom);
      if (!w) continue; // couvert par le banc précédent
      // « Découverte » = aucun verrou de fonctionnalité sur le widget.
      const libre = !w.feature;
      if (libre !== (plan === 'Découverte')) {
        faux.push(`${nom} annoncé « ${plan} » mais ${libre ? 'libre' : 'verrouillé'} au catalogue`);
      }
    }
    expect(faux, 'un verrou de plan annoncé ne correspond pas au produit').toEqual([]);
  });
});
