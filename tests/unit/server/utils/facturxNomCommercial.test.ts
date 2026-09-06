// ═══════════════════════════════════════════════════════════════════════════
// BT-27 CONTRE BT-28 — la distinction qui fait rejeter une facture, ou pas.
//
// ─── CE QUI SE JOUE ────────────────────────────────────────────────────────
// Sur une facture électronique, le nom du vendeur n'est pas UNE information,
// c'en est DEUX :
//
//   BT-27 « Seller name »          → ram:SellerTradeParty/ram:Name
//   BT-28 « Seller trading name »  → …/ram:SpecifiedLegalOrganization/
//                                     ram:TradingBusinessName
//
// Le chemin de BT-28 est celui qu'extrait l'implémentation de référence
// ZUGFeRD (`cii-xr.xsl` : `./ram:SpecifiedLegalOrganization/
// ram:TradingBusinessName`) — vérifié sur la source, pas supposé.
//
// ⚠️ POURQUOI ON NE PEUT PAS METTRE LE NOM COMMERCIAL EN BT-27. Une plateforme
// agréée recoupe le SIREN déclaré avec l'annuaire des entreprises. Le SIREN de
// l'apiculteur y répond « Maël Dupont » ; une facture qui annonce « Le Rucher
// de Maël » en BT-27 présente une incohérence sur la mention obligatoire
// d'identité du vendeur. L'apiculteur exerce EN NOM PROPRE : son nom
// patronymique est le nom légal, le nom commercial s'y ajoute.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · émettre `nomCommercial` dans `<ram:Name>` ;
//   · émettre `<ram:TradingBusinessName>` même quand il est vide ;
//   · retirer l'échappement XML du nom commercial.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { generateFacturXml, type FactureData } from '~~/server/utils/facturx-xml';

const base: FactureData = {
  numero: 'FA-2026-0001',
  date: '2026-06-30',
  echeance: null,
  categorieOperation: 'livraison_biens',
  emetteur: {
    denomination: 'Maël Dupont',
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

/** Le bloc vendeur, isolé — pour ne pas confondre avec celui de l'acheteur. */
function blocVendeur(xml: string): string {
  const debut = xml.indexOf('<ram:SellerTradeParty>');
  const fin = xml.indexOf('</ram:SellerTradeParty>');
  expect(debut, 'le bloc vendeur doit exister').toBeGreaterThan(-1);
  expect(fin).toBeGreaterThan(debut);
  return xml.slice(debut, fin);
}

/** Le XML se relit-il vraiment ? Un document mal formé est refusé sans appel. */
function bienForme(xml: string): boolean {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return doc.getElementsByTagName('parsererror').length === 0;
}

describe('BT-28 — le nom commercial, à sa place et nulle part ailleurs', () => {
  it('GARDE-FOU : sans nom commercial, le XML reste ce qu’il était', () => {
    // Sans ce cas, un générateur qui n'émettrait PLUS RIEN passerait les règles
    // suivantes — « le balayage vide » de CLAUDE.md.
    const vendeur = blocVendeur(generateFacturXml(base));
    expect(vendeur).toContain('<ram:Name>Maël Dupont</ram:Name>');
    expect(vendeur, 'pas de balise vide quand il n’y a rien à dire').not.toContain(
      'TradingBusinessName',
    );
  });

  it('LA RÈGLE : BT-27 garde le nom LÉGAL, BT-28 porte le commercial', () => {
    const xml = generateFacturXml({
      ...base,
      emetteur: { ...base.emetteur, nomCommercial: 'Le Rucher de Maël' },
    });
    const vendeur = blocVendeur(xml);

    expect(vendeur, 'BT-27 = nom patronymique').toContain('<ram:Name>Maël Dupont</ram:Name>');
    expect(vendeur, 'le nom commercial n’a RIEN à faire en BT-27').not.toContain(
      '<ram:Name>Le Rucher de Maël</ram:Name>',
    );
    expect(vendeur).toContain(
      '<ram:TradingBusinessName>Le Rucher de Maël</ram:TradingBusinessName>',
    );
  });

  it('BT-28 est DANS l’organisation légale, après son identifiant', () => {
    // Le chemin compte autant que la valeur : `TradingBusinessName` posé
    // ailleurs dans le bloc vendeur ne serait pas lu comme BT-28, et l'ordre
    // des enfants est imposé par le schéma (ID puis TradingBusinessName).
    const xml = generateFacturXml({
      ...base,
      emetteur: { ...base.emetteur, nomCommercial: 'Le Rucher de Maël' },
    });
    const orga = xml.slice(
      xml.indexOf('<ram:SpecifiedLegalOrganization>'),
      xml.indexOf('</ram:SpecifiedLegalOrganization>'),
    );
    expect(orga).toContain('TradingBusinessName');
    expect(orga.indexOf('<ram:ID'), 'l’identifiant vient en premier').toBeLessThan(
      orga.indexOf('<ram:TradingBusinessName>'),
    );
  });

  it('l’acheteur n’hérite JAMAIS du nom commercial du vendeur', () => {
    const xml = generateFacturXml({
      ...base,
      emetteur: { ...base.emetteur, nomCommercial: 'Le Rucher de Maël' },
    });
    const acheteur = xml.slice(
      xml.indexOf('<ram:BuyerTradeParty>'),
      xml.indexOf('</ram:BuyerTradeParty>'),
    );
    expect(acheteur).not.toContain('Le Rucher de Maël');
  });

  it('un nom commercial avec une esperluette ne casse pas le document', () => {
    // « Dupont & Fils » est un nom d'exploitation parfaitement ordinaire, et un
    // `&` non échappé rend le XML illisible — la facture serait refusée à
    // l'ouverture, sans que rien n'ait signalé le problème à l'émission.
    const xml = generateFacturXml({
      ...base,
      emetteur: { ...base.emetteur, nomCommercial: 'Dupont & Fils <miel>' },
    });
    expect(bienForme(xml), 'le XML doit rester analysable').toBe(true);
    expect(xml).toContain('Dupont &amp; Fils &lt;miel&gt;');
  });

  it('le document reste bien formé dans les deux cas', () => {
    expect(bienForme(generateFacturXml(base))).toBe(true);
    expect(
      bienForme(
        generateFacturXml({
          ...base,
          emetteur: { ...base.emetteur, nomCommercial: 'Le Rucher de Maël' },
        }),
      ),
    ).toBe(true);
  });

  it('GARDE-FOU du contrôle de forme : un XML cassé est bien vu comme cassé', () => {
    // Sans lui, un `bienForme` qui rendrait toujours `true` — c'est arrivé avec
    // d'autres analyseurs — validerait n'importe quoi.
    expect(bienForme('<a><b></a>')).toBe(false);
  });
});
