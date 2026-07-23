/**
 * Génération XML CII (Cross-Industry Invoice) conforme Factur-X 1.08 / profil BASIC
 * Norme EN 16931 — utilisé en fallback local si FactPulse n'est pas configuré
 */

export interface FactureData {
  numero: string;
  date: string;
  echeance?: string | null;
  categorieOperation: 'livraison_biens' | 'prestation_services' | 'mixte';

  emetteur: {
    denomination: string;
    siren: string;
    siret: string;
    tvaIntra: string;
    adresse: string;
    codePostal: string;
    ville: string;
    pays: string;
  };

  client: {
    denomination: string;
    siren?: string | null;
    siret?: string | null;
    tvaIntra?: string | null;
    adresse: string;
    codePostal: string;
    ville: string;
    pays: string;
    adresseLivraison?: string | null;
    codePostalLivraison?: string | null;
    villeLivraison?: string | null;
  };

  lignes: {
    description: string;
    quantite: number;
    prixUnitaireHt: number;
    tauxTva: number;
    montantHt: number;
  }[];

  totaux: {
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    ventilationTva: { taux: number; baseHt: number; montantTva: number }[];
  };

  optionTvaDebits: boolean;
  /** Franchise en base de TVA (art. 293 B CGI) : exonération catégorie E + mention obligatoire. */
  franchiseTva: boolean;
}

const MENTION_FRANCHISE = 'TVA non applicable, art. 293 B du CGI';

// Mentions de paiement obligatoires entre professionnels (Code de commerce
// art. L441-10 & D441-5). Portées comme conditions de paiement (BT-20) : elles
// satisfont aussi BR-CO-25 (une facture à payer doit porter une échéance OU des
// conditions de paiement — donc toujours présentes, même sans date d'échéance).
const MENTIONS_PAIEMENT =
  'Pénalités de retard exigibles sans rappel au taux directeur de la BCE majoré de 10 points ' +
  '(art. L441-10 C. com.). Indemnité forfaitaire pour frais de recouvrement : 40 € (art. D441-5 C. com.). ' +
  'Escompte pour paiement anticipé : néant.';

export function generateFacturXml(facture: FactureData): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(facture.numero)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate102(facture.date)}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${
      facture.optionTvaDebits
        ? `<ram:IncludedNote>
      <ram:Content>Option pour le paiement de la taxe d'après les débits</ram:Content>
      <ram:SubjectCode>REG</ram:SubjectCode>
    </ram:IncludedNote>`
        : ''
    }
    ${
      facture.franchiseTva
        ? `<ram:IncludedNote>
      <ram:Content>${MENTION_FRANCHISE}</ram:Content>
      <ram:SubjectCode>AAI</ram:SubjectCode>
    </ram:IncludedNote>`
        : ''
    }
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(facture.emetteur.denomination)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${facture.emetteur.siren}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${facture.emetteur.codePostal}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(facture.emetteur.adresse)}</ram:LineOne>
          <ram:CityName>${escapeXml(facture.emetteur.ville)}</ram:CityName>
          <ram:CountryID>${facture.emetteur.pays}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication>
          <ram:URIID schemeID="0225">${facture.emetteur.siret}</ram:URIID>
        </ram:URIUniversalCommunication>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${facture.emetteur.tvaIntra}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(facture.client.denomination)}</ram:Name>
        ${
          facture.client.siren
            ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${facture.client.siren}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
            : ''
        }
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${facture.client.codePostal}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(facture.client.adresse)}</ram:LineOne>
          <ram:CityName>${escapeXml(facture.client.ville)}</ram:CityName>
          <ram:CountryID>${facture.client.pays}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${
          facture.client.tvaIntra
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${facture.client.tvaIntra}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    ${
      facture.client.adresseLivraison
        ? `<ram:ApplicableHeaderTradeDelivery>
      <ram:ShipToTradeParty>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${facture.client.codePostalLivraison ?? ''}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(facture.client.adresseLivraison)}</ram:LineOne>
          <ram:CityName>${escapeXml(facture.client.villeLivraison ?? '')}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:ShipToTradeParty>
    </ram:ApplicableHeaderTradeDelivery>`
        : '<ram:ApplicableHeaderTradeDelivery/>'
    }

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      ${
        facture.franchiseTva
          ? `<ram:ApplicableTradeTax>
        <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>${MENTION_FRANCHISE}</ram:ExemptionReason>
        <ram:BasisAmount>${facture.totaux.totalHt.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>E</ram:CategoryCode>
        <ram:RateApplicablePercent>0.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`
          : facture.totaux.ventilationTva
              .map(
                (v) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${v.montantTva.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${v.baseHt.toFixed(2)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>${v.taux.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`,
              )
              .join('\n')
      }
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${escapeXml(MENTIONS_PAIEMENT)}</ram:Description>${
          facture.echeance
            ? `
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDate102(facture.echeance)}</udt:DateTimeString>
        </ram:DueDateDateTime>`
            : ''
        }
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${facture.totaux.totalHt.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${facture.totaux.totalHt.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${facture.totaux.totalTva.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${facture.totaux.totalTtc.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${facture.totaux.totalTtc.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

    ${facture.lignes
      .map(
        (ligne, i) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${i + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(ligne.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${ligne.prixUnitaireHt.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${ligne.quantite}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${facture.franchiseTva ? 'E' : 'S'}</ram:CategoryCode>
          <ram:RateApplicablePercent>${facture.franchiseTva ? '0.00' : ligne.tauxTva.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${ligne.montantHt.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`,
      )
      .join('\n')}

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate102(isoDate: string): string {
  return isoDate.replace(/-/g, '').slice(0, 8);
}

/** Calcul clé TVA intracommunautaire depuis SIREN (algorithme officiel) */
export function calcTvaIntra(siren: string): string {
  const sirenNum = parseInt(siren, 10);
  if (isNaN(sirenNum)) return 'FR00' + siren;
  const key = (12 + 3 * (sirenNum % 97)) % 97;
  return `FR${String(key).padStart(2, '0')}${siren}`;
}
