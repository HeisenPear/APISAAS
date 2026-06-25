import { describe, it, expect } from 'vitest';
import {
  couleurMiel,
  calculerZonesDepartements,
  opaciteRichesse,
  MIEL_ZONES,
  COULEUR_MIEL,
} from '../../../../app/utils/zonesMelliferes';
import type { Floraison } from '../../../../app/utils/floraisons';

function flo(typeMiel: string, potentiel: string, emoji = '🌼'): Floraison {
  return {
    id: typeMiel,
    nom: typeMiel,
    nomLatin: null,
    typeMiel,
    regionPrincipale: null,
    moisDebut: 5,
    jourDebutTypique: 1,
    dureeJoursTypique: 30,
    altitudeMin: null,
    altitudeMax: null,
    latitudeMin: null,
    latitudeMax: null,
    potentielProductionKgRuche: potentiel,
    emoji,
  };
}

const floraisons: Floraison[] = [
  flo('lavande', '22', '💜'),
  flo('châtaignier', '18', '🌰'),
  flo('acacia', '25', '🌳'),
  flo('tournesol', '25', '🌻'),
];

describe('couleurMiel', () => {
  it('renvoie la couleur du type, gris sinon', () => {
    expect(couleurMiel('lavande')).toBe(COULEUR_MIEL.lavande);
    expect(couleurMiel('inconnu')).toBe('#cbd5e1');
    expect(couleurMiel(null)).toBe('#cbd5e1');
  });
});

describe('calculerZonesDepartements', () => {
  const { zones, maxRichesse } = calculerZonesDepartements(floraisons);

  it('attribue un dominant et des % qui somment ~100', () => {
    const drome = zones['26']; // Drôme : lavande forte
    expect(drome).toBeTruthy();
    const somme = drome!.types.reduce((s, t) => s + t.pct, 0);
    expect(somme).toBeGreaterThanOrEqual(98);
    expect(somme).toBeLessThanOrEqual(102);
  });

  it('la lavande domine en Drôme (intensité forte × potentiel)', () => {
    expect(zones['26']!.dominant).toBe('lavande');
    expect(zones['26']!.couleur).toBe(COULEUR_MIEL.lavande);
  });

  it('trie les types par % décroissant', () => {
    const t = zones['26']!.types;
    for (let i = 1; i < t.length; i++) expect(t[i - 1]!.pct).toBeGreaterThanOrEqual(t[i]!.pct);
  });

  it('expose maxRichesse > 0', () => {
    expect(maxRichesse).toBeGreaterThan(0);
  });

  it('ne crée pas de zone pour un département hors curation', () => {
    expect(zones['75']).toBeUndefined(); // Paris : aucun miel curé
  });
});

describe('opaciteRichesse', () => {
  it('croît avec la richesse, bornée 0.35–0.8', () => {
    expect(opaciteRichesse(0, 100)).toBeCloseTo(0.35, 2);
    expect(opaciteRichesse(100, 100)).toBeCloseTo(0.8, 2);
    expect(opaciteRichesse(50, 100)).toBeGreaterThan(0.35);
  });
});

describe('cohérence des données curées', () => {
  it('chaque type de zone a une couleur définie', () => {
    for (const type of Object.keys(MIEL_ZONES)) {
      expect(COULEUR_MIEL[type], `couleur manquante pour ${type}`).toBeTruthy();
    }
  });
});
