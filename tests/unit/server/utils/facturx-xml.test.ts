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

describe('generateFacturXml — mentions & conformité EN 16931', () => {
  it('BR-CO-25 : porte des conditions de paiement même SANS date d’échéance', () => {
    // base.echeance === null → sans conditions de paiement, la facture violerait
    // BR-CO-25 (ni échéance BT-9 ni conditions BT-20). Elles doivent être présentes.
    const xml = generateFacturXml(base);
    expect(xml).toContain('<ram:SpecifiedTradePaymentTerms>');
    expect(xml).toContain('<ram:Description>');
  });

  it('porte les mentions L441 obligatoires entre professionnels', () => {
    const xml = generateFacturXml(base);
    expect(xml).toContain('Pénalités de retard');
    expect(xml).toContain('40 €');
    expect(xml).toMatch(/Escompte/);
  });

  it('déclare l’adresse électronique vendeur (SIRET, schemeID 0225) pour le routage 2026', () => {
    const xml = generateFacturXml(base);
    expect(xml).toContain('<ram:URIID schemeID="0225">12345678900012</ram:URIID>');
  });

  it('ajoute la date d’échéance quand elle est fournie', () => {
    const xml = generateFacturXml({ ...base, echeance: '2026-07-30' });
    expect(xml).toContain('<ram:DueDateDateTime>');
    expect(xml).toContain('20260730');
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
