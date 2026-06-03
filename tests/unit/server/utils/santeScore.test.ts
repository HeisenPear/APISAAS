import { describe, it, expect } from 'vitest';
import {
  computeHiveScore,
  computeScore,
  computeRucherScore,
  scoreLabel,
  type InspectionRow,
  type EvenementSante,
} from '~/server/utils/santeScore';

const REF = new Date('2025-06-15T12:00:00Z');

function base(partial: Partial<InspectionRow> = {}): InspectionRow {
  return {
    rucheId: 'r1',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2025-06-10T10:00:00Z', // 5 jours avant REF
    forceColonie: 4,
    couvain: 4,
    reserves: 4,
    reineVue: true,
    varroa: 1,
    comportement: 'calme',
    signeEssaimage: false,
    maladieObservee: null,
    ...partial,
  };
}

describe('server/utils/santeScore', () => {
  describe('états terminaux', () => {
    it('colonie morte → 0', () => {
      expect(computeHiveScore(base({ statut: 'morte' })).score).toBe(0);
      expect(computeScore(base({ statut: 'morte' }))).toBe(0);
    });
    it('vendue / fusionnée → non comptabilisée (null)', () => {
      expect(computeHiveScore(base({ statut: 'vendue' })).score).toBeNull();
      expect(computeHiveScore(base({ statut: 'fusionnee' })).score).toBeNull();
    });
  });

  describe('colonie saine', () => {
    it('toutes constantes au vert → score élevé', () => {
      const r = computeHiveScore(base({ aujourdhui: REF }));
      expect(r.score).toBeGreaterThanOrEqual(85);
      expect(r.niveau).toBe('Excellent');
    });
  });

  describe('varroa', () => {
    it('infestation critique (>5%) effondre la composante varroa', () => {
      const sain = computeHiveScore(base({ aujourdhui: REF, varroa: 1 })).score!;
      const infeste = computeHiveScore(base({ aujourdhui: REF, varroa: 8 })).score!;
      expect(infeste).toBeLessThan(sain - 15);
    });
    it('un traitement varroa récent remonte la trajectoire', () => {
      const evenements: EvenementSante[] = [{ type: 'varroa', date: '2025-06-08T10:00:00Z' }];
      const sans = computeHiveScore(base({ aujourdhui: REF, varroa: 4 })).score!;
      const avec = computeHiveScore(base({ aujourdhui: REF, varroa: 4, evenements })).score!;
      expect(avec).toBeGreaterThan(sans);
    });
  });

  describe('essaimage et reprise (cas métier clé)', () => {
    it('colonie essaimée sans reine → plafonnée bas', () => {
      const r = computeHiveScore(
        base({
          aujourdhui: REF,
          statut: 'essaimee',
          couvain: 0,
          reineVue: false,
          qualiteReine: 'absente',
        }),
      );
      expect(r.score!).toBeLessThanOrEqual(30);
    });
    it('reine réintroduite après essaimage → reprise (plafond relevé)', () => {
      const evenements: EvenementSante[] = [
        { type: 'essaimage', date: '2025-06-01T10:00:00Z' },
        { type: 'introduction', date: '2025-06-08T10:00:00Z' },
      ];
      const r = computeHiveScore(
        base({ aujourdhui: REF, statut: 'essaimee', couvain: 0, evenements }),
      );
      expect(r.score!).toBeGreaterThan(30);
      expect(r.score!).toBeLessThanOrEqual(60);
    });
    it('reprise de ponte confirmée → plafond levé, le score repart', () => {
      const evenements: EvenementSante[] = [
        { type: 'essaimage', date: '2025-05-20T10:00:00Z' },
        { type: 'ponte_vue', date: '2025-06-10T10:00:00Z', ponteConfirmee: true },
      ];
      const r = computeHiveScore(base({ aujourdhui: REF, statut: 'active', evenements }));
      expect(r.score!).toBeGreaterThan(60);
    });
  });

  describe('orpheline', () => {
    it('colonie orpheline → plafonnée', () => {
      expect(
        computeHiveScore(base({ aujourdhui: REF, statut: 'orpheline', couvain: 0 })).score!,
      ).toBeLessThanOrEqual(30);
    });
  });

  describe('maladies', () => {
    it('loque → pénalité sévère', () => {
      const sain = computeHiveScore(base({ aujourdhui: REF })).score!;
      const loque = computeHiveScore(
        base({ aujourdhui: REF, maladieObservee: 'Loque américaine' }),
      ).score!;
      expect(sain - loque).toBeGreaterThanOrEqual(40);
    });
  });

  describe('fraîcheur', () => {
    it('un contrôle ancien (>30j) décote le score', () => {
      const recent = computeHiveScore(
        base({ aujourdhui: REF, dateVisite: '2025-06-10T10:00:00Z' }),
      ).score!;
      const ancien = computeHiveScore(
        base({ aujourdhui: REF, dateVisite: '2025-04-01T10:00:00Z' }),
      ).score!;
      expect(ancien).toBeLessThan(recent);
    });
    it('aucun contrôle → confiance faible', () => {
      const r = computeHiveScore(base({ aujourdhui: REF, dateVisite: null }));
      expect(r.confiance).toBe('faible');
      expect(r.score!).toBeLessThanOrEqual(60);
    });
  });

  describe('computeRucherScore', () => {
    it('moyenne des ruches comptabilisées, exclut vendue/fusionnée', () => {
      const agg = computeRucherScore([
        { score: 90, statut: 'active' },
        { score: 50, statut: 'faible' },
        { score: null, statut: 'vendue' },
      ]);
      expect(agg.score).toBe(70);
      expect(agg.nbRuches).toBe(2);
    });
    it('une ruche morte (0) pèse sur le rucher', () => {
      const agg = computeRucherScore([
        { score: 90, statut: 'active' },
        { score: 0, statut: 'morte' },
      ]);
      expect(agg.score).toBe(45);
      expect(agg.nbCritiques).toBe(1);
    });
    it('rucher sans ruche comptabilisée → null', () => {
      expect(computeRucherScore([{ score: null, statut: 'vendue' }]).score).toBeNull();
    });
  });

  describe('scoreLabel', () => {
    it('paliers', () => {
      expect(scoreLabel(85)).toBe('Excellent');
      expect(scoreLabel(65)).toBe('Bon');
      expect(scoreLabel(45)).toBe('Correct');
      expect(scoreLabel(25)).toBe('Fragile');
      expect(scoreLabel(10)).toBe('Critique');
    });
  });
});
