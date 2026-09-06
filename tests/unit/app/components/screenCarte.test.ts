import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { couleurStade, labelStade } from '~/config/floraisons';

/**
 * L'écran « Carte mellifère » du simulateur affiche des couleurs de stade et une
 * pondération de score. Les deux existent dans le produit — et les deux
 * dériveront si personne ne les tient.
 *
 * La couleur d'un stade n'est pas décorative : c'est ce qui permet de lire la
 * carte d'un coup d'œil. Montrer un ambre pour « pleine floraison » là où
 * l'application affiche un miel apprend au visiteur une grille de lecture
 * fausse, qu'il devra désapprendre à l'inscription.
 */
const SOURCE = readFileSync('app/components/ui/webmockup/WmScreenCarte.vue', 'utf-8');

describe('WmScreenCarte — les couleurs de stade sont celles du produit', () => {
  it('chaque stade montré porte la couleur et le libellé de l’app', () => {
    const bloc = SOURCE.slice(SOURCE.indexOf('const STADES'), SOURCE.indexOf('} as const'));
    const montres = [...bloc.matchAll(/(\w+): \{ couleur: '([^']+)', libelle: '([^']+)' \}/g)];

    expect(montres.length, 'aucun stade lisible dans le composant').toBeGreaterThanOrEqual(3);

    for (const [, stade, couleur, libelle] of montres) {
      expect(
        couleur!.toLowerCase(),
        `stade « ${stade} » : le simulateur affiche ${couleur}, l’app ${couleurStade(stade as never)}`,
      ).toBe(couleurStade(stade as never).toLowerCase());
      expect(libelle, `libellé du stade « ${stade} »`).toBe(labelStade(stade as never));
    }
  });
});

describe('WmScreenCarte — la pondération du score est celle du moteur', () => {
  /**
   * `POIDS` n'est pas exporté par scoreEmplacement.ts : on lit donc la ligne
   * source. C'est fragile par nature, et c'est assumé — l'alternative serait de
   * recopier trois nombres dans le composant sans que rien ne les relie au
   * calcul réel, ce qui est exactement le défaut qu'on veut éviter.
   */
  it('butinage 0,45 · floraisons 0,35 · météo 0,20', () => {
    const moteur = readFileSync('app/utils/scoreEmplacement.ts', 'utf-8');
    const m = moteur.match(
      /const POIDS = \{ butinage: ([\d.]+), floraisons: ([\d.]+), meteo: ([\d.]+) \}/,
    );
    expect(m, 'POIDS introuvable dans scoreEmplacement.ts — sa forme a changé').not.toBeNull();
    const reels = { Butinage: Number(m![1]), Floraisons: Number(m![2]), Météo: Number(m![3]) };

    const bloc = SOURCE.slice(SOURCE.indexOf('const POIDS'), SOURCE.indexOf('function posPoint'));
    const montres = Object.fromEntries(
      [...bloc.matchAll(/\{ nom: '([^']+)', part: ([\d.]+) \}/g)].map((x) => [x[1]!, Number(x[2])]),
    );

    expect(montres, 'la pondération affichée ne correspond pas au moteur').toEqual(reels);
  });
});

describe('WmScreenCarte — ce que le produit ne fait PAS', () => {
  /**
   * La cartographie du code a été formelle sur trois points, et ils sont
   * tentants à mettre sur une carte : aucun calendrier de floraison n'existe,
   * aucune prévision phénologique (ni degrés-jours ni modèle), et une
   * observation ne déclenche aucune alerte. Les promettre ici serait vendre ce
   * qui n'est pas livré.
   */
  it('ne promet ni calendrier, ni prévision, ni alerte de floraison', () => {
    const visible = SOURCE.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const interdit of [
      /calendrier de floraison/i,
      /pr[ée]vision de (miell[ée]e|floraison)/i,
      /degr[ée]s?-jours/i,
      /alerte de floraison/i,
    ]) {
      expect(visible, `formulation interdite : ${interdit}`).not.toMatch(interdit);
    }
  });
});
