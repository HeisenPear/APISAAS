import { describe, it, expect } from 'vitest';
import { scoreFloraisons, scoreEmplacement } from '../../../../app/utils/scoreEmplacement';

describe('scoreFloraisons', () => {
  it('cumule le potentiel, plafonné à 100', () => {
    expect(scoreFloraisons([])).toBe(0);
    expect(scoreFloraisons([{ potentielProductionKgRuche: '25' }])).toBe(50);
    expect(
      scoreFloraisons([
        { potentielProductionKgRuche: '25' },
        { potentielProductionKgRuche: '25' },
        { potentielProductionKgRuche: '25' },
      ]),
    ).toBe(100); // 75 kg → plafonné
  });
});

describe('scoreEmplacement', () => {
  it('combine les 3 axes pondérés', () => {
    const s = scoreEmplacement({ butinage: 80, floraisons: 60, meteo: 40 });
    // 80*.45 + 60*.35 + 40*.2 = 36 + 21 + 8 = 65
    expect(s.global).toBe(65);
    expect(s.label).toBe('bon');
  });

  it('renormalise les poids si une composante manque (météo non chargée)', () => {
    const s = scoreEmplacement({ butinage: 80, floraisons: 60, meteo: null });
    // (80*.45 + 60*.35) / (.45+.35) = 57/.8 = 71.25 → 71
    expect(s.global).toBe(71);
  });

  it('floraisons seules si butinage et météo absents', () => {
    const s = scoreEmplacement({ butinage: null, floraisons: 50, meteo: null });
    expect(s.global).toBe(50);
  });

  it('attribue les bons paliers', () => {
    expect(scoreEmplacement({ butinage: 90, floraisons: 90, meteo: 90 }).label).toBe('excellent');
    expect(scoreEmplacement({ butinage: 10, floraisons: 10, meteo: 10 }).label).toBe('faible');
  });
});
