import { describe, it, expect } from 'vitest';
import {
  consequencesDe,
  MARQUEURS_CERTITUDE,
  MARQUEURS_ATTENUATION,
} from '~~/server/utils/maya-consequences';
import { predictSante } from '~~/server/utils/santePredictive';
import type { InspectionRow } from '~~/server/utils/santeScore';

/**
 * Deux garanties, et la seconde compte autant que la première.
 *
 *  1. COUVERTURE : tout risque que le moteur sait produire doit trouver sa
 *     conséquence. La table s'accroche à des libellés ; si l'un d'eux change
 *     dans `santePredictive`, la correspondance cesse EN SILENCE. Ce banc
 *     exécute donc le moteur pour lui faire cracher ses risques, au lieu de
 *     recopier une liste qui dériverait avec lui.
 *
 *  2. LANGAGE : Maya ne dit jamais qu'une chose VA arriver. Une projection à
 *     trente jours calculée sur trois visites n'autorise pas le futur de
 *     l'indicatif. Le jour où l'annonce ne se réalise pas, l'apiculteur cesse
 *     de croire tout le reste — y compris les alertes qui étaient justes.
 */

const MAINTENANT = new Date('2026-06-15T09:00:00Z');

function visite(p: Partial<InspectionRow> = {}): InspectionRow {
  return {
    rucheId: 'r-1',
    numero: '12',
    rucherId: 'ru-1',
    statut: 'active',
    qualiteReine: null,
    dateVisite: '2026-06-10T09:00:00Z',
    forceColonie: 6,
    couvain: 5,
    reserves: 6,
    reineVue: true,
    varroa: 1,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
    ...p,
  };
}

/** Chaque situation déclenche une branche de risque distincte du moteur. */
const SITUATIONS: Array<[string, InspectionRow]> = [
  ['varroa critique', visite({ varroa: 9 })],
  ['varroa élevé', visite({ varroa: 4 })],
  ['colonie faible', visite({ forceColonie: 1 })],
  ['reine non vue', visite({ reineVue: false })],
  ['réserves basses', visite({ reserves: 1 })],
  ['essaimage', visite({ signeEssaimage: true })],
  ['maladie', visite({ maladieObservee: 'loque américaine' })],
  ['visite ancienne', visite({ dateVisite: '2026-04-01T09:00:00Z' })],
  ['aucune date de visite', visite({ dateVisite: null })],
];

describe('couverture — aucun risque du moteur ne reste sans conséquence', () => {
  it.each(SITUATIONS)('%s', (_nom, row) => {
    const { risques } = predictSante([row], [row], MAINTENANT);
    expect(risques.length, 'la situation ne déclenche aucun risque').toBeGreaterThan(0);

    const couvertes = consequencesDe(risques);
    const orphelins = risques.filter((r) => !couvertes.some((c) => c.risque === r));
    expect(
      orphelins,
      'risque produit par santePredictive mais absent de la table de conséquences — ' +
        'un libellé a dû changer d’un côté sans l’autre',
    ).toEqual([]);
  });

  it('balaie toutes les situations d’un coup, pour attraper une dérive globale', () => {
    const tous = new Set<string>();
    for (const [, row] of SITUATIONS) {
      for (const r of predictSante([row], [row], MAINTENANT).risques) tous.add(r);
    }
    expect(tous.size, 'le moteur ne produit presque aucun risque — banc inopérant').toBeGreaterThan(
      5,
    );
    const orphelins = [...tous].filter((r) => consequencesDe([r]).length === 0);
    expect(orphelins).toEqual([]);
  });
});

describe('langage — jamais une certitude, toujours une possibilité', () => {
  /** Toutes les conséquences que la table sait produire. */
  function toutesLesConsequences(): string[] {
    const risques = new Set<string>();
    for (const [, row] of SITUATIONS) {
      for (const r of predictSante([row], [row], MAINTENANT).risques) risques.add(r);
    }
    return consequencesDe([...risques]).map((c) => c.consequence);
  }

  it('aucune conséquence n’annonce le futur comme acquis', () => {
    const phrases = toutesLesConsequences();
    expect(phrases.length).toBeGreaterThan(5);
    const fautives = phrases.filter((p) => MARQUEURS_CERTITUDE.test(p));
    expect(
      fautives,
      'une projection ne peut pas s’écrire au futur de l’indicatif : « peut », pas « va »',
    ).toEqual([]);
  });

  it('chaque conséquence porte une forme atténuée', () => {
    const phrases = toutesLesConsequences();
    const sansNuance = phrases.filter((p) => !MARQUEURS_ATTENUATION.test(p));
    expect(sansNuance, 'phrase sans « peut », « risque », « si »…').toEqual([]);
  });

  it('les deux détecteurs font bien leur travail', () => {
    /**
     * Sans ce contrôle, deux expressions mal écrites rendraient les deux bancs
     * précédents vacuement verts — ils passeraient en ne détectant jamais rien.
     */
    expect(MARQUEURS_CERTITUDE.test('votre colonie va essaimer')).toBe(true);
    expect(MARQUEURS_CERTITUDE.test('vous perdrez la moitié des butineuses')).toBe(true);
    expect(MARQUEURS_CERTITUDE.test('la colonie sera perdue')).toBe(true);
    expect(MARQUEURS_CERTITUDE.test('la colonie peut essaimer')).toBe(false);
    // « aggrave » contient « va » : le détecteur doit travailler sur des MOTS.
    expect(MARQUEURS_CERTITUDE.test('l’infestation s’aggrave')).toBe(false);

    expect(MARQUEURS_ATTENUATION.test('la colonie peut manquer de nourriture')).toBe(true);
    expect(MARQUEURS_ATTENUATION.test('la colonie manque de nourriture')).toBe(false);
  });
});

describe('consequencesDe — comportement aux bords', () => {
  it('ignore un risque inconnu plutôt que d’inventer une généralité', () => {
    // Mieux vaut ne rien dire qu'une phrase passe-partout qui aurait l'air
    // d'un diagnostic. La couverture est garantie par les bancs ci-dessus.
    expect(consequencesDe(['Quelque chose que le moteur ne produit pas'])).toEqual([]);
  });

  it('sans risque, aucune conséquence', () => {
    expect(consequencesDe([])).toEqual([]);
  });

  it('distingue le varroa critique du varroa élevé', () => {
    // L'ordre de la table compte : « varroa élevé » ne doit pas attraper le cas
    // critique, dont le conseil est nettement plus pressant.
    const critique = consequencesDe(['Infestation varroa critique'])[0]!.consequence;
    const eleve = consequencesDe(['Niveau varroa élevé'])[0]!.consequence;
    expect(critique).not.toBe(eleve);
    expect(critique).toMatch(/hivernage/);
  });

  it('conserve le libellé du risque tel quel', () => {
    // La conséquence s'affiche SOUS son risque : les deux doivent se répondre.
    const r = 'Maladie observée : loque américaine';
    expect(consequencesDe([r])[0]!.risque).toBe(r);
  });
});
