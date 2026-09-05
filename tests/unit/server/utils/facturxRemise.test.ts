// ═══════════════════════════════════════════════════════════════════════════
// LES TOTAUX DU FACTUR-X DOIVENT S'ÉQUILIBRER — REMISE COMPRISE.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// Le générateur ne connaissait PAS la remise. `facturx.get.ts` ne lisait même
// pas la colonne : `TaxBasisTotalAmount` recevait le HT AVANT remise, pendant
// que `GrandTotalAmount` venait du TTC APRÈS.
//
// Sur toute facture remisée, le XML violait donc BR-CO-15 de l'EN 16931 — « le
// montant TTC est la base taxable plus le total de TVA » — et une plateforme
// agréée la rejette. Le contrôle est arithmétique : il ne pardonne pas.
//
// C'est la deuxième fois que ce générateur perd l'équilibre entre sa
// ventilation et ses totaux. La première, il déclarait 100 € de base à côté de
// 2 500 € de totaux, faute de regarder le tarif au poids.
//
// ─── CE QUE CE BANC TIENT ──────────────────────────────────────────────────
// Les quatre égalités que le XML doit satisfaire, lues DANS LE XML PRODUIT —
// pas dans les objets qui ont servi à l'écrire :
//
//   BT-109  base taxable  = BT-106 lignes − BT-107 remises
//   BR-CO-15  TTC         = base taxable + TVA
//   Σ BasisAmount par taux                = base taxable
//   Σ ActualAmount des remises            = BT-107
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · remettre `totalHt` dans `TaxBasisTotalAmount` ;
//   · retirer `AllowanceTotalAmount` ;
//   · ne plus appliquer le ratio aux bases par taux ;
//   · retirer le rattrapage d'arrondi des parts de remise.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { generateFacturXml, type FactureData } from '~~/server/utils/facturx-xml';
import { round2, ligneTva, totauxRemise } from '~~/server/utils/pricing';

/** Un montant lu DANS le XML, pas dans l'objet qui l'a produit. */
function montant(xml: string, balise: string): number | null {
  const m = xml.match(new RegExp(`<ram:${balise}[^>]*>([-\\d.]+)</ram:${balise}>`));
  return m ? Number(m[1]) : null;
}
function tousLesMontants(xml: string, balise: string): number[] {
  return [...xml.matchAll(new RegExp(`<ram:${balise}[^>]*>([-\\d.]+)</ram:${balise}>`, 'g'))].map(
    (m) => Number(m[1]),
  );
}
/** Les `BasisAmount` de la ventilation par taux (hors base d'exonération). */
function basesParTaux(xml: string): number[] {
  return [...xml.matchAll(/<ram:ApplicableTradeTax>[\s\S]*?<\/ram:ApplicableTradeTax>/g)]
    .map((bloc) => bloc[0].match(/<ram:BasisAmount>([-\d.]+)<\/ram:BasisAmount>/)?.[1])
    .filter((v): v is string => v !== undefined)
    .map(Number);
}

/** Construit la facture comme la route le fait, remise comprise. */
function fabriquer(
  lignes: Array<{ quantite: number; prixUnitaireHt: number; tauxTva: number }>,
  remisePct: number,
): FactureData {
  const avecMontants = lignes.map((l, i) => ({
    description: `Article ${i + 1}`,
    quantite: l.quantite,
    prixUnitaireHt: l.prixUnitaireHt,
    tauxTva: l.tauxTva,
    montantHt: round2(l.quantite * l.prixUnitaireHt),
  }));
  const totalHt = round2(avecMontants.reduce((s, l) => s + l.montantHt, 0));
  const { pourcentage, remiseMontant } = totauxRemise(totalHt, remisePct);

  const brutParTaux: Record<number, number> = {};
  for (const l of avecMontants) {
    brutParTaux[l.tauxTva] = round2((brutParTaux[l.tauxTva] ?? 0) + l.montantHt);
  }
  const ventilationTva = Object.entries(brutParTaux).map(([taux, brut]) => ({
    taux: Number(taux),
    brutHt: brut,
    remiseHt: pourcentage > 0 ? round2((brut * pourcentage) / 100) : 0,
    baseHt: 0,
    montantTva: 0,
  }));

  const recaler = (cle: 'remiseHt' | 'montantTva', cible: number) => {
    if (!ventilationTva.length) return;
    const ecart = round2(cible - round2(ventilationTva.reduce((s, v) => s + v[cle], 0)));
    if (ecart === 0) return;
    const plus = ventilationTva.reduce((a, b) => (b[cle] > a[cle] ? b : a));
    plus[cle] = round2(plus[cle] + ecart);
  };
  recaler('remiseHt', remiseMontant);
  for (const v of ventilationTva) {
    v.baseHt = round2(v.brutHt - v.remiseHt);
    v.montantTva = ligneTva(v.baseHt, v.taux);
  }

  const totalTva = round2(ventilationTva.reduce((s, v) => s + v.montantTva, 0));
  const baseTaxable = round2(totalHt - remiseMontant);

  return {
    numero: 'FA-2026-0001',
    date: '2026-09-04',
    echeance: null,
    categorieOperation: 'livraison_biens',
    emetteur: {
      denomination: 'Maël Dupont',
      siren: '123456789',
      siret: '12345678900012',
      tvaIntra: 'FR12123456789',
      adresse: '1 chemin des Ruches',
      codePostal: '64000',
      ville: 'Pau',
      pays: 'FR',
    },
    client: {
      denomination: 'Épicerie du Coin',
      adresse: '2 rue du Marché',
      codePostal: '64000',
      ville: 'Pau',
      pays: 'FR',
    },
    lignes: avecMontants,
    totaux: {
      totalHt,
      remiseMontant,
      totalTva,
      totalTtc: round2(baseTaxable + totalTva),
      ventilationTva,
    },
    optionTvaDebits: false,
    franchiseTva: false,
  } as FactureData;
}

describe('les totaux du XML s’équilibrent', () => {
  it('GARDE-FOU : sans remise, le XML porte bien ses totaux', () => {
    // Sans ce cas, un générateur qui n'écrirait plus aucun total rendrait les
    // égalités vraies sur `null` — vertes, et vides.
    const xml = generateFacturXml(fabriquer([{ quantite: 10, prixUnitaireHt: 5, tauxTva: 20 }], 0));
    expect(montant(xml, 'LineTotalAmount')).toBe(50);
    expect(montant(xml, 'TaxBasisTotalAmount')).toBe(50);
    expect(montant(xml, 'GrandTotalAmount')).toBe(60);
    expect(xml).not.toContain('AllowanceTotalAmount');
  });

  const CAS = [
    {
      nom: 'un seul taux, remise 10 %',
      lignes: [{ quantite: 10, prixUnitaireHt: 5, tauxTva: 20 }],
      pct: 10,
    },
    {
      nom: 'taux mixtes, remise 12,5 %',
      lignes: [
        { quantite: 3, prixUnitaireHt: 9.9, tauxTva: 5.5 },
        { quantite: 2, prixUnitaireHt: 33.33, tauxTva: 20 },
      ],
      pct: 12.5,
    },
    {
      nom: 'trois taux, remise 33 %',
      lignes: [
        { quantite: 7, prixUnitaireHt: 4.17, tauxTva: 5.5 },
        { quantite: 1, prixUnitaireHt: 19.99, tauxTva: 10 },
        { quantite: 4, prixUnitaireHt: 12.34, tauxTva: 20 },
      ],
      pct: 33,
    },
    {
      nom: 'centimes hostiles, remise 7 %',
      lignes: [
        { quantite: 3, prixUnitaireHt: 0.37, tauxTva: 5.5 },
        { quantite: 11, prixUnitaireHt: 1.11, tauxTva: 20 },
      ],
      pct: 7,
    },
  ];

  it.each(CAS)('BR-CO-15 — $nom : TTC = base taxable + TVA', ({ lignes, pct }) => {
    const xml = generateFacturXml(fabriquer(lignes, pct));
    const base = montant(xml, 'TaxBasisTotalAmount')!;
    const tva = montant(xml, 'TaxTotalAmount')!;
    const ttc = montant(xml, 'GrandTotalAmount')!;
    expect(
      round2(base + tva),
      'BR-CO-15 est un contrôle ARITHMÉTIQUE de l’EN 16931 : une plateforme agréée rejette ' +
        'la facture si le compte ne tombe pas juste.',
    ).toBe(ttc);
  });

  it.each(CAS)('BT-109 — $nom : base taxable = lignes − remises', ({ lignes, pct }) => {
    const xml = generateFacturXml(fabriquer(lignes, pct));
    const ligneTotal = montant(xml, 'LineTotalAmount')!;
    const remise = montant(xml, 'AllowanceTotalAmount') ?? 0;
    expect(round2(ligneTotal - remise)).toBe(montant(xml, 'TaxBasisTotalAmount'));
  });

  it.each(CAS)('$nom : la somme des bases par taux fait la base taxable', ({ lignes, pct }) => {
    const xml = generateFacturXml(fabriquer(lignes, pct));
    const somme = round2(basesParTaux(xml).reduce((s, v) => s + v, 0));
    expect(
      somme,
      'Une ventilation qui ne se raccroche pas aux totaux est ce qui rend une facture ' +
        'électronique rejetable — ce générateur l’a déjà connu une fois.',
    ).toBe(montant(xml, 'TaxBasisTotalAmount'));
  });

  it.each(CAS)('$nom : la somme des remises déclarées fait BT-107', ({ lignes, pct }) => {
    /**
     * BR-31 exige qu'une remise de pied de facture soit DÉCLARÉE, avec sa
     * catégorie et son taux de TVA. On en émet une par taux, proportionnelle —
     * seul découpage qui laisse les bases s'additionner quand les taux sont
     * mélangés. Chaque part étant arrondie, la somme peut manquer d'un centime :
     * l'écart est versé sur la plus grosse part, et ce cas le vérifie.
     */
    const xml = generateFacturXml(fabriquer(lignes, pct));
    const parts = [
      ...xml.matchAll(
        /<ram:SpecifiedTradeAllowanceCharge>[\s\S]*?<\/ram:SpecifiedTradeAllowanceCharge>/g,
      ),
    ].map((b) => Number(b[0].match(/<ram:ActualAmount>([-\d.]+)<\/ram:ActualAmount>/)?.[1] ?? 0));
    expect(
      parts.length,
      'aucune remise déclarée alors que la facture en porte une',
    ).toBeGreaterThan(0);
    expect(round2(parts.reduce((s, v) => s + v, 0))).toBe(montant(xml, 'AllowanceTotalAmount'));
  });

  it('une remise déclarée porte sa catégorie ET son taux — BR-32, BR-33', () => {
    const xml = generateFacturXml(
      fabriquer([{ quantite: 10, prixUnitaireHt: 5, tauxTva: 20 }], 10),
    );
    const bloc = xml.match(
      /<ram:SpecifiedTradeAllowanceCharge>[\s\S]*?<\/ram:SpecifiedTradeAllowanceCharge>/,
    )![0];
    expect(bloc).toContain('<udt:Indicator>false</udt:Indicator>');
    expect(bloc).toContain('<ram:CategoryCode>S</ram:CategoryCode>');
    expect(bloc).toContain('<ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>');
    expect(bloc, 'une remise sans motif est refusée par plusieurs plateformes').toMatch(
      /<ram:Reason>[^<]+<\/ram:Reason>/,
    );
  });

  it('GARDE-FOU : le XML produit contient bien plusieurs montants', () => {
    // Un générateur muet rendrait toutes les égalités ci-dessus vraies sur des
    // `null` comparés entre eux.
    const xml = generateFacturXml(fabriquer([{ quantite: 2, prixUnitaireHt: 8, tauxTva: 5.5 }], 5));
    expect(tousLesMontants(xml, 'LineTotalAmount').length).toBeGreaterThan(1);
  });
});
