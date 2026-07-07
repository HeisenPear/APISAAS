import { describe, it, expect } from 'vitest';
import {
  projeterTresorerie,
  moisLabel,
  type HistoriqueMois,
  type ChargeRecurrente,
  type PrevisionItem,
} from '../../../../server/utils/tresorerie';

describe('moisLabel', () => {
  it('formate le mois calendaire', () => {
    expect(moisLabel(2026, 1)).toBe('janv. 2026');
    expect(moisLabel(2026, 12)).toBe('déc. 2026');
  });
});

describe('projeterTresorerie', () => {
  it('utilise les charges récurrentes quand il n’y a pas d’historique', () => {
    const recurrents: ChargeRecurrente[] = [
      { libelle: 'Assurance', montant: 30, intervalle: 'mensuel', moisProchain: 6 },
      { libelle: 'Cotisation', montant: 120, intervalle: 'annuel', moisProchain: 9 },
    ];
    const r = projeterTresorerie({
      historique: [],
      recurrents,
      soldeActuel: 1000,
      horizonMois: 12,
      anneeCourante: 2026,
      moisCourant: 6, // projection démarre en juillet
    });

    // mensuel partout, annuel une seule fois (septembre)
    const septembre = r.projection.find((p) => p.mois === 9)!;
    expect(septembre.sorties).toBe(150); // 30 + 120
    const juillet = r.projection.find((p) => p.mois === 7)!;
    expect(juillet.sorties).toBe(30);
    expect(juillet.entrees).toBe(0);
    expect(juillet.source).toBe('recurrents');

    // 12 mois × 30 + 1 × 120 = 480 de sorties ; aucune entrée
    expect(r.sortiesTotales).toBe(480);
    expect(r.entreesTotales).toBe(0);
    expect(r.soldeFinal).toBe(1000 - 480);
  });

  it('projette la moyenne saisonnière depuis l’historique', () => {
    const historique: HistoriqueMois[] = [
      { annee: 2024, mois: 7, ventes: 800, achats: 200 },
      { annee: 2025, mois: 7, ventes: 1200, achats: 300 },
    ];
    const r = projeterTresorerie({
      historique,
      recurrents: [],
      soldeActuel: 0,
      horizonMois: 1,
      anneeCourante: 2026,
      moisCourant: 6, // → juillet 2026
    });
    const m = r.projection[0]!;
    expect(m.mois).toBe(7);
    expect(m.entrees).toBe(1000); // (800+1200)/2
    expect(m.sorties).toBe(250); // (200+300)/2
    expect(m.net).toBe(750);
    expect(m.source).toBe('historique');
    expect(m.confiance).toBe('moyenne'); // 2 années
  });

  it('classe la confiance selon le nombre d’années', () => {
    const trois: HistoriqueMois[] = [
      { annee: 2023, mois: 7, ventes: 100, achats: 0 },
      { annee: 2024, mois: 7, ventes: 100, achats: 0 },
      { annee: 2025, mois: 7, ventes: 100, achats: 0 },
    ];
    const r = projeterTresorerie({
      historique: trois,
      recurrents: [],
      soldeActuel: 0,
      horizonMois: 1,
      anneeCourante: 2026,
      moisCourant: 6,
    });
    expect(r.projection[0]!.confiance).toBe('haute');
  });

  it('calcule le solde cumulé, le point bas et les mois en déficit', () => {
    // historique : juillet net négatif, août net positif
    const historique: HistoriqueMois[] = [
      { annee: 2025, mois: 7, ventes: 0, achats: 500 },
      { annee: 2025, mois: 8, ventes: 900, achats: 100 },
    ];
    const r = projeterTresorerie({
      historique,
      recurrents: [],
      soldeActuel: 200,
      horizonMois: 2,
      anneeCourante: 2026,
      moisCourant: 6, // → juillet puis août
    });
    // juillet : 200 - 500 = -300 ; août : -300 + 800 = 500
    expect(r.projection[0]!.soldeCumule).toBe(-300);
    expect(r.projection[1]!.soldeCumule).toBe(500);
    expect(r.pointBas).toEqual({ label: 'juil. 2026', solde: -300 });
    expect(r.moisDeficit).toBe(1);
    expect(r.soldeFinal).toBe(500);
  });

  it('ajoute les postes planifiés (dépense ponctuelle, investissement, recette, mensuel)', () => {
    const previsions: PrevisionItem[] = [
      // investissement ponctuel en août 2026
      { montant: 5000, type: 'investissement', recurrence: 'ponctuel', annee: 2026, mois: 8 },
      // recette ponctuelle (subvention) en août 2026
      { montant: 2000, type: 'recette', recurrence: 'ponctuel', annee: 2026, mois: 8 },
      // dépense mensuelle à partir de juillet 2026
      { montant: 50, type: 'depense', recurrence: 'mensuel', annee: 2026, mois: 7 },
    ];
    const r = projeterTresorerie({
      historique: [],
      recurrents: [],
      previsions,
      soldeActuel: 10000,
      horizonMois: 2,
      anneeCourante: 2026,
      moisCourant: 6, // → juillet puis août 2026
    });
    const juillet = r.projection[0]!;
    expect(juillet.sortiesPrevues).toBe(50); // mensuel actif
    expect(juillet.entreesPrevues).toBe(0);
    const aout = r.projection[1]!;
    expect(aout.sortiesPrevues).toBe(5050); // investissement 5000 + mensuel 50
    expect(aout.entreesPrevues).toBe(2000); // subvention
    // solde : 10000 - 50 (juil) + (2000 - 5050) (août) = 6900
    expect(r.soldeFinal).toBe(6900);
  });

  it('n’applique PAS un poste planifié avant sa date (ponctuel dans le futur)', () => {
    const previsions: PrevisionItem[] = [
      { montant: 999, type: 'depense', recurrence: 'ponctuel', annee: 2027, mois: 3 },
    ];
    const r = projeterTresorerie({
      historique: [],
      recurrents: [],
      previsions,
      soldeActuel: 0,
      horizonMois: 2,
      anneeCourante: 2026,
      moisCourant: 6, // juillet/août 2026 → le poste de mars 2027 ne tombe pas
    });
    expect(r.sortiesTotales).toBe(0);
  });

  it('gère le passage d’année sur l’horizon', () => {
    const r = projeterTresorerie({
      historique: [],
      recurrents: [],
      soldeActuel: 0,
      horizonMois: 8,
      anneeCourante: 2026,
      moisCourant: 11, // novembre → projection déc. 2026 … juil. 2027
    });
    expect(r.projection[0]!.label).toBe('déc. 2026');
    expect(r.projection[1]!.label).toBe('janv. 2027');
    expect(r.projection.at(-1)!.label).toBe('juil. 2027');
  });
});
