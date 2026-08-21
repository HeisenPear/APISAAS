import { describe, it, expect } from 'vitest';
import {
  influenceA,
  deplacementVers,
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

describe('réglages — ce que l’œil accepte', () => {
  it('le gonflement reste dans les proportions d’un logo, pas d’un ballon', () => {
    expect(AMPLITUDE).toBeGreaterThan(0.15);
    expect(AMPLITUDE).toBeLessThan(0.6);
  });

  it('la portée couvre le rayon sans déborder du viewBox', () => {
    // Le viewBox fait 24 : une portée qui le dépasse ferait réagir la mark à
    // un curseur qui n'en approche même pas.
    expect(RAYON).toBeGreaterThan(3);
    expect(RAYON).toBeLessThan(12);
  });
});
