import { describe, expect, it } from 'vitest';
import { factureVersForm } from '../../../../app/types/facture';

describe('factureVersForm — pré-remplissage du formulaire d’édition', () => {
  it('mappe les champs principaux et les dates (ISO → YYYY-MM-DD)', () => {
    const form = factureVersForm({
      clientId: 'c-1',
      dateTransaction: '2026-06-10T09:00:00.000Z',
      dateEcheance: '2026-07-10T09:00:00.000Z',
      remise: '5',
      notes: 'Merci',
      categorieOperation: 'prestation_services',
      lignes: [
        {
          description: 'Miel toutes fleurs',
          quantite: 10,
          prixUnitaire: 8,
          total: 80,
          tauxTva: 5.5,
        },
      ],
    });
    expect(form.clientId).toBe('c-1');
    expect(form.dateTransaction).toBe('2026-06-10');
    expect(form.dateEcheance).toBe('2026-07-10');
    expect(form.remise).toBe(5);
    expect(form.notes).toBe('Merci');
    expect(form.categorieOperation).toBe('prestation_services');
    expect(form.lignes).toHaveLength(1);
    expect(form.lignes[0]).toMatchObject({
      description: 'Miel toutes fleurs',
      quantite: 10,
      prixUnitaire: 8,
    });
  });

  it('préserve la tarification au poids et la traçabilité miel', () => {
    const form = factureVersForm({
      dateTransaction: '2026-06-10',
      lignes: [
        {
          description: 'Seau 25 kg',
          quantite: 2,
          prixUnitaire: 10,
          total: 500,
          tauxTva: 5.5,
          modePrix: 'poids',
          contenance: 25,
          typeMiel: 'acacia',
          numLot: 'L-2026-01',
        },
      ],
    });
    expect(form.lignes[0]?.modePrix).toBe('poids');
    expect(form.lignes[0]?.contenance).toBe(25);
    expect(form.lignes[0]?.typeMiel).toBe('acacia');
    expect(form.lignes[0]?.numLot).toBe('L-2026-01');
  });

  it('fournit une ligne vide et des défauts quand la facture est minimale', () => {
    const form = factureVersForm({ lignes: [] });
    expect(form.lignes).toHaveLength(1);
    expect(form.categorieOperation).toBe('livraison_biens');
    expect(form.remise).toBeUndefined();
    expect(form.clientId).toBeUndefined();
  });
});
