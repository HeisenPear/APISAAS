import { describe, it, expect } from 'vitest';
import {
  libelleTypeIntervention,
  CATEGORIES_INTERVENTION,
  CATEGORIES_META,
} from '~/types/interventions';

/**
 * `interventions.type` est une colonne TEXTE LIBRE : plusieurs routes y écrivent
 * des valeurs qui ne sont pas des catégories de colonie (le déplacement en masse
 * pose `deplacement_rucher`, la transhumance `visite_emplacement`…).
 *
 * La liste des interventions affichait la valeur brute : après un déplacement de
 * ruchers, l'apiculteur lisait « deplacement_rucher » sur chaque ligne. Ce banc
 * verrouille le fait qu'AUCUN type ne ressorte jamais sous sa forme technique.
 */
describe('libellé d’un type d’intervention', () => {
  it('traduit toutes les catégories de colonie', () => {
    for (const c of CATEGORIES_INTERVENTION) {
      expect(libelleTypeIntervention(c)).toBe(CATEGORIES_META[c].label);
    }
  });

  it('traduit les types posés par la transhumance et l’agenda', () => {
    expect(libelleTypeIntervention('deplacement_rucher')).toBe('Déplacement de rucher');
    expect(libelleTypeIntervention('visite_emplacement')).toBe("Visite d'emplacement");
    expect(libelleTypeIntervention('visite_rucher')).toBe('Visite du rucher');
    expect(libelleTypeIntervention('rendez_vous_pro')).toBe('Rendez-vous pro');
    expect(libelleTypeIntervention('multi')).toBe('Visite complète');
  });

  it('reste lisible sur un type inconnu, sans jamais rendre le slug brut', () => {
    // Une route future qui écrirait un type non répertorié ne doit pas laisser
    // un identifiant technique remonter jusqu'à l'écran.
    const rendu = libelleTypeIntervention('nouveau_type_inconnu');
    expect(rendu).toBe('Nouveau type inconnu');
    expect(rendu).not.toContain('_');
  });

  it('retombe sur « Intervention » quand le type est absent', () => {
    expect(libelleTypeIntervention(null)).toBe('Intervention');
    expect(libelleTypeIntervention(undefined)).toBe('Intervention');
    expect(libelleTypeIntervention('')).toBe('Intervention');
  });
});
