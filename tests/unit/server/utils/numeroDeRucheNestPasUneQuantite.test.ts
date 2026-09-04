// ═══════════════════════════════════════════════════════════════════════════
// « J'AI RETIRÉ LA GRILLE À REINE SUR LA 8 » ENREGISTRAIT HUIT GRILLES.
//
// Le lecteur de slots retire la désignation de ruche de la phrase avant d'y
// chercher des nombres — sans quoi le NUMÉRO DE LA RUCHE est le nombre trouvé.
// Le principe était juste, et son commentaire nommait déjà deux cas réparés
// (« ruche 4, j'ai posé 2 hausses » → quatre hausses). Mais son motif
// RECOPIAIT la première des trois formes que `extraireRuche` reconnaît.
//
// Ce que la forme elliptique — celle qu'on emploie au rucher, les mains
// prises — produisait, sur CINQ gestes différents :
//
//   « j'ai retiré la grille à reine sur la 8 »  → HUIT grilles
//   « j'ai compté les varroas sur la 8 »        → HUIT varroas
//   « j'ai pesé la 8 »                          → HUIT kilos
//   « j'ai divisé la 8 »                        → HUIT divisions
//   « j'ai nourri la 8 »                        → HUIT (unité inconnue)
//   « j'ai posé des hausses sur la 12 »         → DOUZE hausses
//
// Les mêmes phrases avec le mot « ruche » étaient justes. C'est la signature
// d'une liste recopiée partiellement : ce qu'elle couvre marche, ce qu'elle a
// oublié écrit n'importe quoi — en silence, et avec l'assurance d'un aperçu à
// confirmer, puisque l'apiculteur voit « 8 grilles à reine » et lit surtout
// le « 8 » qu'il vient de prononcer.
//
// LA CORRECTION EST STRUCTURELLE : les trois motifs vivent en un seul endroit
// et `sansDesignationRuche` s'en sert. Une quatrième façon de désigner une
// ruche bénéficiera aux deux d'un coup.
//
// ⚠️ CE BANC MESURE LE COMPORTEMENT, PAS LA SOURCE. Une première tentation
// était de vérifier que le motif est bien partagé — mais un motif partagé mal
// appliqué reste faux, et c'est le contenu écrit en base qui compte.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { extraireRuche, sansDesignationRuche } from '~~/server/utils/copilote-actions';

/** Les `donnees` réellement écrites pour une phrase dictée. */
function donneesEcrites(phrase: string): Record<string, unknown> | null {
  const d = classifierTour([{ role: 'user', content: phrase }]);
  if (d.kind !== 'ecriture' || d.ecriture.action !== 'intervention') return null;
  const parse = d.ecriture.parse as { donnees?: Record<string, unknown> };
  return parse.donnees ?? {};
}

function rucheEcrite(phrase: string): string | undefined {
  const d = classifierTour([{ role: 'user', content: phrase }]);
  if (d.kind !== 'ecriture' || d.ecriture.action !== 'intervention') return undefined;
  return (d.ecriture.parse as { rucheNumero?: string }).rucheNumero;
}

describe('garde-fou : la dictée écrit bien quelque chose', () => {
  it('une phrase complète est lue, ruche ET quantité', () => {
    /**
     * Sans ce cas, un moteur qui ne lirait plus AUCUN nombre satisferait
     * toutes les exigences ci-dessous — il suffirait de casser la lecture des
     * quantités pour que le « 8 » disparaisse aussi.
     */
    expect(rucheEcrite('j ai pose 2 hausses sur la ruche 8')).toBe('8');
    expect(donneesEcrites('j ai pose 2 hausses sur la ruche 8')).toEqual({
      elements: [{ element: 'hausses', quantite: 2 }],
    });
  });

  it('le retrait de désignation ne mange pas toute la phrase', () => {
    const sans = sansDesignationRuche('j ai pose 2 hausses sur la ruche 8');
    expect(sans, 'la quantité doit survivre au retrait').toContain('2');
    expect(sans, 'la désignation doit partir').not.toContain('ruche 8');
  });
});

describe('la RÈGLE : le numéro de ruche n’est jamais une quantité', () => {
  /**
   * Les six phrases mesurées, dans la forme ELLIPTIQUE qui les cassait — et
   * leur jumelle explicite, qui marchait déjà. Les deux doivent donner le même
   * résultat : c'est la même phrase, dite par le même apiculteur.
   */
  const CAS: { elliptique: string; explicite: string; interdit: number }[] = [
    {
      elliptique: 'j ai retire la grille a reine sur la 8',
      explicite: 'j ai retire la grille a reine sur la ruche 8',
      interdit: 8,
    },
    {
      elliptique: 'j ai compte les varroas sur la 8',
      explicite: 'j ai compte les varroas sur la ruche 8',
      interdit: 8,
    },
    { elliptique: 'j ai pese la 8', explicite: 'j ai pese la ruche 8', interdit: 8 },
    { elliptique: 'j ai divise la 8', explicite: 'j ai divise la ruche 8', interdit: 8 },
    { elliptique: 'j ai nourri la 8', explicite: 'j ai nourri la ruche 8', interdit: 8 },
    {
      elliptique: 'j ai pose des hausses sur la 12',
      explicite: 'j ai pose des hausses sur la ruche 12',
      interdit: 12,
    },
  ];

  it('la ruche est bien reconnue dans les deux formes', () => {
    // Sans ce cas, une phrase qui ne désignerait plus AUCUNE ruche passerait
    // les exigences suivantes sans rien mesurer.
    for (const { elliptique, explicite, interdit } of CAS) {
      expect(extraireRuche(elliptique), `« ${elliptique} »`).toBe(String(interdit));
      expect(extraireRuche(explicite), `« ${explicite} »`).toBe(String(interdit));
    }
  });

  it('le numéro n’apparaît dans AUCUNE valeur écrite', () => {
    const fautes: string[] = [];
    for (const { elliptique, interdit } of CAS) {
      const d = donneesEcrites(elliptique);
      if (!d) continue;
      const valeurs = JSON.stringify(d);
      // On cherche le numéro en position de VALEUR numérique.
      const nombres = [...valeurs.matchAll(/:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
      if (nombres.includes(interdit)) {
        fautes.push(`« ${elliptique} » écrit ${interdit} : ${valeurs}`);
      }
    }
    expect(
      fautes,
      'Le numéro de la ruche est devenu une quantité. L’apiculteur relit son aperçu, ' +
        'y voit le chiffre qu’il vient de prononcer, et confirme — c’est le pire ' +
        'moment pour se tromper, celui où tout a l’air juste.',
    ).toEqual([]);
  });

  it('la forme elliptique écrit la MÊME chose que la forme explicite', () => {
    /**
     * ⚠️ CETTE EXIGENCE EST PLUS FORTE QUE LA PRÉCÉDENTE, et c'est voulu.
     * « aucun 8 nulle part » serait satisfait par un moteur qui aurait cessé
     * de lire les quantités ; « les deux formes disent pareil » ne l'est que
     * si les deux chemins se rejoignent vraiment.
     */
    for (const { elliptique, explicite } of CAS) {
      expect(
        donneesEcrites(elliptique),
        `« ${elliptique} » et « ${explicite} » sont la même phrase`,
      ).toEqual(donneesEcrites(explicite));
    }
  });
});

describe('les quantités RÉELLES continuent d’être lues', () => {
  /**
   * ⚠️ LA RÈGLE MARCHE DANS LES DEUX SENS. Un correctif qui aurait retiré les
   * trois formes d'un coup mangerait une quantité légitime : dans « j'ai posé
   * 2 hausses sur la ruche 8 », la forme elliptique (« la 8 ») vise le même
   * texte que la forme explicite — mais dans une phrase où la ruche est nommée,
   * un nombre plus loin est un nombre.
   */
  const ATTENDUS: [string, Record<string, unknown>][] = [
    ['j ai pose 2 hausses sur la ruche 8', { elements: [{ element: 'hausses', quantite: 2 }] }],
    ['j ai divise la ruche 12 en 3', { nombreDivisions: 3 }],
  ];

  it('elles arrivent intactes', () => {
    for (const [phrase, attendu] of ATTENDUS) {
      expect(donneesEcrites(phrase), `« ${phrase} »`).toMatchObject(attendu);
    }
  });

  it('le poids et le comptage aussi', () => {
    expect(donneesEcrites('la ruche 8 pese 42 kg')).toMatchObject({ poidsKg: 42 });
    expect(donneesEcrites('j ai compte 12 varroas sur la 8')).toMatchObject({ nombreVarroas: 12 });
    expect(donneesEcrites('j ai nourri la ruche 4 avec 3 litres de sirop')).toMatchObject({
      quantite: 3,
      unite: 'litres',
    });
  });
});
