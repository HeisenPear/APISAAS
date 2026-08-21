import { describe, it, expect } from 'vitest';
import {
  influenceA,
  deplacementVers,
  echellesDepuisInfluences,
  AMPLITUDE,
  RAYON,
  MAGNETISME,
} from '~/utils/magnetismeAlveoles';

/**
 * Ce calcul a produit deux défauts visibles, aucun lisible dans le code.
 * L'apiculteur qui les a vus a écrit « le positionnement et la réaction des
 * alvéoles ne ressemble à rien » — ce qui est exactement ce qu'on ressent
 * devant une physique fausse : on sait que c'est faux, on ne sait pas dire où.
 *
 * D'où des bancs qui décrivent le COMPORTEMENT attendu à la main, pas la
 * formule. Une formule se réécrit ; ce qu'on veut protéger, c'est la sensation.
 */

/** Norme du déplacement, la seule grandeur qui compte pour l'œil. */
function norme([x, y]: [number, number]): number {
  return Math.hypot(x, y);
}

describe('influence — la cloche', () => {
  it('vaut 1 quand le curseur est sur l’alvéole', () => {
    expect(influenceA(0)).toBe(1);
  });

  it('décroît sans jamais remonter', () => {
    let prec = Infinity;
    for (let d = 0; d <= 20; d += 0.5) {
      const v = influenceA(d);
      expect(v, `remontée à d=${d}`).toBeLessThanOrEqual(prec);
      prec = v;
    }
  });

  it('est devenue négligeable au-delà du double de la portée', () => {
    expect(influenceA(RAYON * 2)).toBeLessThan(0.02);
  });
});

describe('déplacement — l’attirance vers le curseur', () => {
  it('EST NUL quand le curseur est pile au centre de l’alvéole', () => {
    /**
     * LE DÉFAUT QUI A COÛTÉ LA SENSATION.
     *
     * En normalisant par la distance, `dx / d` gardait une norme de 1 même en
     * tendant vers zéro : l'alvéole visée sautait du magnétisme maximal — 11,8 px
     * mesurés sur la landing — au moment exact où on la pointait, et tremblait
     * d'un bord à l'autre au moindre sous-pixel.
     *
     * On ne peut pas être attiré vers un point où l'on se trouve déjà.
     */
    expect(norme(deplacementVers(0, 0, 1))).toBe(0);
  });

  it('reste infime à un sous-pixel du centre — pas de saut, pas de tremblement', () => {
    // C'est LE cas que l'ancienne formule ratait : ici elle rendait 1,05.
    const infime = norme(deplacementVers(0.001, 0, influenceA(0.001)));
    expect(infime).toBeLessThan(0.01);
  });

  it('ne dépasse jamais le magnétisme annoncé, à aucune distance', () => {
    let maxVu = 0;
    for (let d = 0; d <= 40; d += 0.05) {
      const n = norme(deplacementVers(d, 0, influenceA(d)));
      maxVu = Math.max(maxVu, n);
    }
    // `MAGNETISME` doit se lire comme le déplacement MAXIMAL, sans quoi le
    // réglage devient un nombre magique qu'on tâtonne.
    expect(maxVu).toBeLessThanOrEqual(MAGNETISME + 1e-9);
    // 4 décimales, pas 6 : le balayage avance par pas de 0,05 et ne tombe pas
    // pile sur le sommet. Exiger mieux, ce serait mesurer la finesse du pas,
    // pas la justesse du calcul.
    expect(maxVu, 'le pic doit bien atteindre le magnétisme annoncé').toBeCloseTo(MAGNETISME, 4);
  });

  it('culmine entre le centre et le bord, pas à l’un des deux', () => {
    const auCentre = norme(deplacementVers(0, 0, influenceA(0)));
    const auPic = norme(deplacementVers(RAYON / Math.SQRT2, 0, influenceA(RAYON / Math.SQRT2)));
    const auLoin = norme(deplacementVers(25, 0, influenceA(25)));
    expect(auPic).toBeGreaterThan(auCentre);
    expect(auPic).toBeGreaterThan(auLoin);
  });

  it('s’éteint au loin — une alvéole lointaine ne part pas à l’autre bout', () => {
    expect(norme(deplacementVers(30, 0, influenceA(30)))).toBeLessThan(0.01);
  });

  it('pointe vers le curseur, jamais à l’opposé', () => {
    // dx > 0 signifie « le curseur est à droite » : l'alvéole doit aller à droite.
    const [x, y] = deplacementVers(3, -4, influenceA(5));
    expect(x).toBeGreaterThan(0);
    expect(y).toBeLessThan(0);
  });

  it('est continu EN VECTEUR — c’est le retournement qui fait trembler', () => {
    /**
     * ⚠️ Comparer les NORMES ne suffit pas, et c'est ce qui rendait ce défaut si
     * difficile à voir. L'ancienne formule gardait une norme quasi constante de
     * part et d'autre du centre : 1,05 à gauche, 1,05 à droite. C'est le VECTEUR
     * qui se retournait d'un bloc, de (−1,05 ; 0) à (+1,05 ; 0) — un écart de
     * 2,1 unité en un sous-pixel de souris. À l'œil : un tremblement.
     *
     * On balaie donc le centre en comparant les vecteurs eux-mêmes.
     */
    let precedent = deplacementVers(-3, 0, influenceA(3));
    for (let dx = -3; dx <= 3; dx += 0.02) {
      const v = deplacementVers(dx, 0, influenceA(Math.abs(dx)));
      const ecart = Math.hypot(v[0] - precedent[0], v[1] - precedent[1]);
      expect(ecart, `saut du vecteur à dx=${dx.toFixed(2)}`).toBeLessThan(0.05);
      precedent = v;
    }
  });
});

describe('échelles — ce qu’une alvéole prend, les autres le rendent', () => {
  /**
   * LE DÉFAUT QUE CE BLOC EMPÊCHE DE REVENIR.
   *
   * Le rayon n'a pas de place pour grossir : au repos, deux alvéoles voisines
   * sont séparées de 0,945 unité et leur bord touche déjà le trait de
   * l'hexagone. Un gonflement uniforme de 34 % — la version précédente — les
   * faisait déborder de 1,1 unité et se chevaucher de 2,8. « Les alvéoles sont
   * trop grosses, elles se chevauchent et sortent. »
   *
   * L'invariant qui rend ça impossible : la somme des écarts à la moyenne est
   * nulle. Ce n'est pas un réglage, c'est une propriété — et elle tient quelle
   * que soit la position du curseur.
   */
  it('la somme des écarts à 1 est nulle : l’encombrement total ne bouge pas', () => {
    const cas = [
      [1, 0.37, 0.37, 0.37, 0.37, 0.37, 0.37], // curseur au centre
      [0.37, 1, 0.37, 0.05, 0.02, 0.05, 0.37], // curseur sur une alvéole de couronne
      [0.6, 0.8, 0.5, 0.1, 0.05, 0.1, 0.5], // curseur entre deux
    ];
    for (const infs of cas) {
      const somme = echellesDepuisInfluences(infs).reduce((t, e) => t + (e - 1), 0);
      expect(somme, `écarts non compensés pour ${infs.join(',')}`).toBeCloseTo(0, 10);
    }
  });

  it('rend exactement 1 partout quand le curseur est loin', () => {
    // Toutes les influences égales ⇒ écart nul ⇒ repos EXACT, pas approché.
    expect(echellesDepuisInfluences([0, 0, 0, 0, 0, 0, 0])).toEqual([1, 1, 1, 1, 1, 1, 1]);
    for (const e of echellesDepuisInfluences([0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2])) {
      expect(e).toBeCloseTo(1, 10);
    }
  });

  it('l’alvéole la plus influencée grandit, la moins influencée cède', () => {
    const ech = echellesDepuisInfluences([1, 0.37, 0.37, 0.05, 0.02, 0.05, 0.37]);
    expect(ech[0]!, 'la visée doit grandir').toBeGreaterThan(1);
    expect(Math.min(...ech), 'une autre doit céder').toBeLessThan(1);
  });

  it('ne déborde jamais de l’hexagone, quelle que soit l’influence', () => {
    /**
     * Contrainte géométrique dure, en unités du viewBox (0→24) :
     *   entraxe couronne DC = 3,75 × 1,732 = 6,495
     *   rayon d'alvéole  r  = 3,75 × 0,74  = 2,775
     *   bord extérieur du trait de l'hexagone = 10,6 × cos30° + 1 = 10,18
     * Le pire cas est une alvéole de couronne à l'échelle maximale, poussée vers
     * l'extérieur par le magnétisme.
     */
    const DC = 3.75 * 1.732;
    const r = 3.75 * 0.74;
    const echelleMax = Math.max(...echellesDepuisInfluences([1, 0, 0, 0, 0, 0, 0]));
    expect(DC + r * echelleMax + MAGNETISME).toBeLessThanOrEqual(10.18);
  });

  it('deux voisines ne se touchent jamais, magnétisme compris', () => {
    const DC = 3.75 * 1.732;
    const r = 3.75 * 0.74;
    // Curseur pile entre deux voisines : les deux sont tirées l'une vers l'autre.
    const d = DC / 2;
    const rapproche = 2 * Math.hypot(...deplacementVers(d, 0, influenceA(d)));
    const echelleMax = Math.max(...echellesDepuisInfluences([1, 0.78, 0.78, 0.1, 0.05, 0.1, 0.78]));
    expect(DC - rapproche - 2 * r * echelleMax).toBeGreaterThan(0);
  });
});

describe('réglages — ce que l’œil accepte', () => {
  it('l’amplitude reste dans les proportions d’un logo, pas d’un ballon', () => {
    expect(AMPLITUDE).toBeGreaterThan(0.05);
    expect(AMPLITUDE).toBeLessThan(0.25);
  });

  it('la portée couvre le rayon sans déborder du viewBox', () => {
    // Le viewBox fait 24 : une portée qui le dépasse ferait réagir la mark à
    // un curseur qui n'en approche même pas.
    expect(RAYON).toBeGreaterThan(3);
    expect(RAYON).toBeLessThan(12);
  });
});
