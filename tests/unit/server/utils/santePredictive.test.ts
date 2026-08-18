import { describe, it, expect } from 'vitest';
import { predictSante } from '~/server/utils/santePredictive';
import type { InspectionRow } from '~/server/utils/santeScore';

// Instant de référence injecté : c'est lui qui traverse jusqu'à la décote de
// fraîcheur de `computeScore`. Sans ce paramètre, la prédiction se calait sur
// l'horloge réelle et le module était intestable.
const REF = new Date('2026-06-15T12:00:00Z');

function base(partial: Partial<InspectionRow> = {}): InspectionRow {
  return {
    rucheId: 'r1',
    numero: 'R-01',
    rucherId: 'a1',
    statut: 'active',
    qualiteReine: 'bonne',
    dateVisite: '2026-06-10T10:00:00Z', // 5 jours avant REF
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

describe('server/utils/santePredictive', () => {
  describe('tendance', () => {
    it('colonie stable → tendance stable et prédiction ≈ score actuel', () => {
      const rows = [base()];
      const r = predictSante(rows, [base(), base(), base()], REF);
      expect(r.tendance).toBe('stable');
      expect(r.scorePrediction30j).toBe(r.scoreActuel);
    });

    it('colonie qui se dégrade → tendance baisse et prédiction plus basse', () => {
      // L'historique est du plus RÉCENT au plus ancien : la plus récente est la
      // plus faible, donc la trajectoire descend.
      const historique = [
        base({ forceColonie: 2, couvain: 2, reserves: 2 }),
        base({ forceColonie: 3, couvain: 3, reserves: 3 }),
        base({ forceColonie: 5, couvain: 5, reserves: 5 }),
      ];
      const r = predictSante([historique[0]!], historique, REF);
      expect(r.tendance).toBe('baisse');
      expect(r.scorePrediction30j).toBeLessThan(r.scoreActuel);
    });

    it('colonie qui se renforce → tendance hausse', () => {
      const historique = [
        base({ forceColonie: 5, couvain: 5, reserves: 5 }),
        base({ forceColonie: 3, couvain: 3, reserves: 3 }),
        base({ forceColonie: 2, couvain: 2, reserves: 2 }),
      ];
      const r = predictSante([historique[0]!], historique, REF);
      expect(r.tendance).toBe('hausse');
      expect(r.scorePrediction30j).toBeGreaterThan(r.scoreActuel);
    });

    it('la prédiction reste bornée à 0-100', () => {
      const historique = [
        base({ statut: 'morte' }),
        base({ forceColonie: 5 }),
        base({ forceColonie: 5 }),
      ];
      const r = predictSante([historique[0]!], historique, REF);
      expect(r.scorePrediction30j).toBeGreaterThanOrEqual(0);
      expect(r.scorePrediction30j).toBeLessThanOrEqual(100);
    });
  });

  describe('risques et suggestions', () => {
    it('varroa critique → risque + traitement urgent suggéré', () => {
      const r = predictSante([base({ varroa: 7 })], [base({ varroa: 7 })], REF);
      expect(r.risques).toContain('Infestation varroa critique');
      expect(r.suggestions).toContain('Traitement varroa urgent recommandé');
    });

    it('réserves basses et colonie faible → deux risques distincts', () => {
      const row = base({ forceColonie: 1, reserves: 1 });
      const r = predictSante([row], [row], REF);
      expect(r.risques).toContain('Colonie faible');
      expect(r.risques).toContain('Réserves insuffisantes');
    });

    it('aucune inspection → le premier contrôle est suggéré', () => {
      const row = base({ dateVisite: null });
      const r = predictSante([row], [row], REF);
      expect(r.risques).toContain('Aucune inspection enregistrée');
      expect(r.suggestions).toContain('Effectuer une première inspection et saisir les données');
    });

    it('colonie saine → aucune suggestion alarmiste', () => {
      const r = predictSante([base()], [base()], REF);
      expect(r.risques).toHaveLength(0);
      expect(r.suggestions).toEqual(['Colonie en bonne santé — continuer le suivi régulier']);
    });
  });

  describe('l’instant de référence est bien celui qu’on injecte', () => {
    it('compte les jours depuis la dernière visite à partir de `maintenant`', () => {
      // 40 jours après la visite du 10 juin : au-delà du seuil de 21 j, le
      // risque « pas de visite depuis N jours » doit apparaître avec le bon N.
      const tard = new Date('2026-07-20T12:00:00Z');
      const r = predictSante([base()], [base()], tard);
      expect(r.risques).toContain('Pas de visite depuis 40 jours');
      expect(r.suggestions).toContain('Planifier une visite prochainement');
    });

    it('à `maintenant` proche de la visite, aucun risque de retard', () => {
      const r = predictSante([base()], [base()], REF);
      expect(r.risques.some((x) => x.startsWith('Pas de visite depuis'))).toBe(false);
    });
  });

  describe('urgence', () => {
    it('trois facteurs de risque ou plus → urgente', () => {
      // Orpheline, reine non vue, colonie faible ET réserves à sec : trois
      // risques distincts suffisent à passer en urgence même si le score seul
      // reste au-dessus de 30 (plafond « orpheline »).
      const row = base({
        statut: 'orpheline',
        reineVue: false,
        couvain: 0,
        forceColonie: 1,
        reserves: 1,
      });
      const r = predictSante([row], [row], REF);
      expect(r.risques.length).toBeGreaterThanOrEqual(3);
      expect(r.urgence).toBe('urgente');
    });

    it('colonie saine → normale', () => {
      expect(predictSante([base()], [base()], REF).urgence).toBe('normale');
    });
  });
});
