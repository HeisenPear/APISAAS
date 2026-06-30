import { describe, it, expect } from 'vitest';
import { generateFacturXml, type FactureData } from '~~/server/utils/facturx-xml';

const base: FactureData = {
  numero: 'FA-2026-0001',
  date: '2026-06-30',
  echeance: null,
  categorieOperation: 'livraison_biens',
  emetteur: {
    denomination: 'Rucher Test',
    siren: '123456789',
    siret: '12345678900012',
    tvaIntra: 'FR40123456789',
    adresse: '1 rue des Abeilles',
    codePostal: '01000',
    ville: 'Bourg',
    pays: 'FR',
  },
  client: {
    denomination: 'Client Test',
    adresse: '2 rue du Miel',
    codePostal: '69000',
    ville: 'Lyon',
    pays: 'FR',
  },
  lignes: [
    { description: 'Miel 500g', quantite: 10, prixUnitaireHt: 8, tauxTva: 5.5, montantHt: 80 },
  ],
  totaux: {
    totalHt: 80,
    totalTva: 4.4,
    totalTtc: 84.4,
    ventilationTva: [{ taux: 5.5, baseHt: 80, montantTva: 4.4 }],
  },
  optionTvaDebits: false,
  franchiseTva: false,
};

describe('generateFacturXml — TVA standard', () => {
  it('utilise la catégorie S et pas de mention 293 B', () => {
    const xml = generateFacturXml(base);
    expect(xml).toContain('<ram:CategoryCode>S</ram:CategoryCode>');
    expect(xml).not.toContain('293 B');
  });
});

describe('generateFacturXml — franchise en base (art. 293 B)', () => {
  const xml = generateFacturXml({
    ...base,
    franchiseTva: true,
    totaux: { totalHt: 80, totalTva: 0, totalTtc: 80, ventilationTva: [] },
  });

  it('porte la mention obligatoire et la catégorie d’exonération E', () => {
    expect(xml).toContain('TVA non applicable, art. 293 B du CGI');
    expect(xml).toContain('<ram:CategoryCode>E</ram:CategoryCode>');
    expect(xml).toContain('<ram:ExemptionReason>');
    expect(xml).not.toContain('<ram:CategoryCode>S</ram:CategoryCode>');
  });
});
