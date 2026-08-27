import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../../helpers/sansCommentaires';
import { computeFactureTotals, totauxDepuisLignes } from '~~/server/utils/pricing';
import { tariferCommandeCampagne } from '~~/server/utils/commandeCampagne';
import {
  ligneBonLivraisonSchema,
  lignesBonLivraisonAvecTotaux,
} from '~~/server/utils/bonLivraison';

// ═══════════════════════════════════════════════════════════════════════════
// L'ARGENT SE CALCULE À UN SEUL ENDROIT.
//
// `pricing.ts` le dit en capitales depuis le premier jour : « NE JAMAIS faire
// confiance au total envoyé par le client : le serveur recalcule toujours ».
// La règle était écrite. Quatre endroits ne la suivaient pas.
//
// ⚠️ CE QUI A PRODUIT CE BANC, du plus grave au plus discret :
//
//  · L'export FACTUR-X — la facture électronique elle-même — recalculait le HT
//    de chaque ligne en `quantité × prixUnitaire`, sans regarder `modePrix` ni
//    `contenance`. Dix seaux de 25 kg à 10 €/kg valent 2 500 € : la facture
//    stockait bien 2 500 € et 137,50 € de TVA, et l'export déclarait à côté une
//    ventilation de 100 € de base et 5,50 € de TVA. Facteur 25, mesuré. Une
//    ventilation qui ne correspond pas aux totaux rend la facture rejetable.
//
//  · La saisie ADMIN d'une commande de campagne avait sa propre arithmétique,
//    différente de celle du formulaire PUBLIC : pas d'arrondi par ligne (un
//    centime d'écart sur le total, et `0.5445` stocké là où l'autre stocke
//    `0,54`), et le même aveuglement au tarif au poids.
//
//  · L'édition d'un bon de livraison écrivait `lignes: body.lignes` — donc le
//    total ENVOYÉ PAR LE CLIENT — sur un document qui devient une facture
//    numérotée ; et son schéma, ignorant `modePrix` et `contenance`, les
//    effaçait à chaque édition (Zod retire les clés inconnues).
//
//  · Trois schémas d'entrée acceptaient encore un `total` qu'ils écrasaient :
//    accepter un champ qu'on ignore fait croire au client qu'il le choisit.
//
// Les deux premières familles sont VIVANTES, les deux autres ARMÉES. Ce banc
// tient les trois règles statiques qui les auraient toutes attrapées, et
// vérifie par le comportement ce que chaque fonction partagée doit rendre.
// ═══════════════════════════════════════════════════════════════════════════

/** Le seul module autorisé à écrire une formule monétaire. */
const FABRIQUE = join('server', 'utils', 'pricing.ts');

/** Tous les sources du serveur, lus sur le disque. */
function sourcesServeur(): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(ts|mts)$/.test(entree)) trouves.push(complet);
    }
  };
  descendre('server');
  return trouves.sort();
}

const REGLES = [
  {
    cle: 'tva',
    titre: 'aucune arithmétique sur un taux de TVA',
    motif: /tauxTva[^,;)]*[*/]|[*/][^,;(]*tauxTva/,
    // Une ligne fabriquée qui porte EXACTEMENT le défaut réel.
    exemple: 'const tva = (sousTotal * body.tauxTva) / 100;',
    pourquoi:
      "Une seconde formule de TVA finit par diverger de la première. C'est ainsi que la " +
      "saisie admin d'une campagne a cessé d'arrondir par ligne. Passez par « ligneTva ».",
  },
  {
    cle: 'ht',
    titre: 'aucun HT de ligne calculé à la main',
    motif: /prixUnitaire[A-Za-z]*\s*\*|\*\s*[a-z.]*prixUnitaire/,
    exemple: 'const montantHt = l.quantite * l.prixUnitaire;',
    pourquoi:
      'Multiplier la quantité par le prix unitaire IGNORE le tarif au poids : dix seaux ' +
      "de 25 kg à 10 €/kg valent 2 500 € et non 100 €. C'est le défaut qui a mis une " +
      'ventilation de 100 € à côté de totaux de 2 500 € sur une facture électronique. ' +
      'Passez par « ligneTotalHt ».',
  },
  {
    cle: 'entree',
    titre: "aucun total monétaire n'est un champ d'entrée",
    motif: /^\s*(total|totalHt|totalTva|totalTtc|sousTotal|totalLigne[A-Za-z]*)\s*:\s*z\./,
    exemple: '  total: z.coerce.number(),',
    pourquoi:
      "Accepter un total qu'on va écraser fait croire au client qu'il le choisit — et le " +
      "jour où une route oublie de l'écraser, c'est lui qui fixe le montant. Zod retire " +
      'les clés inconnues : ne pas déclarer le champ suffit à le jeter.',
  },
] as const;

describe("l'argent se calcule à un seul endroit", () => {
  const sources = sourcesServeur();

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  it('garde-fou — le balayage voit bien le serveur', () => {
    expect(sources.length).toBeGreaterThan(200);
    expect(sources).toContain(FABRIQUE);
    expect(sources).toContain(join('server', 'api', 'finances', 'ventes.post.ts'));
    expect(sources).toContain(
      join('server', 'api', 'campagnes', '[id]', 'commandes', 'saisie.post.ts'),
    );
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Un motif qui ne reconnaît plus rien est un banc qui ne mesure plus rien.
  // On lui présente, pour chaque règle, la ligne EXACTE du défaut réel.
  it.each(REGLES)('garde-fou — le motif de « $titre » reconnaît le défaut', (regle) => {
    expect(
      regle.motif.test(regle.exemple),
      `le motif de la règle « ${regle.cle} » ne reconnaît plus son propre défaut`,
    ).toBe(true);
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Les modules corrigés RACONTENT le défaut, et leurs commentaires citent les
  // formules fautives. Sans blanchiment, ils s'accuseraient eux-mêmes — piège
  // tombé six fois dans ce dépôt.
  it.each(REGLES)('garde-fou — « $titre » ignore un commentaire, pas le code', (regle) => {
    const dansUnCommentaire = ['/**', ` * ${regle.exemple}`, ' */', 'const vrai = 1;'].join('\n');
    const dansLeCode = ['/** rien à voir */', regle.exemple].join('\n');

    expect(
      regle.motif.test(sansCommentaires(dansUnCommentaire)),
      `la règle « ${regle.cle} » compte un commentaire comme du code : elle signalerait ` +
        'des fautes imaginaires, et finirait par être désactivée.',
    ).toBe(false);
    expect(
      regle.motif.test(sansCommentaires(dansLeCode)),
      `la règle « ${regle.cle} » ne voit plus le code une fois les commentaires blanchis.`,
    ).toBe(true);
  });

  // ─── LES RÈGLES ───────────────────────────────────────────────────────────
  it.each(REGLES)('$titre', (regle) => {
    const fautes: string[] = [];
    for (const chemin of sources) {
      if (chemin === FABRIQUE) continue;
      const code = sansCommentaires(readFileSync(chemin, 'utf-8'));
      code.split('\n').forEach((texte, i) => {
        if (regle.motif.test(texte)) fautes.push(`${chemin}:${i + 1} → ${texte.trim()}`);
      });
    }
    expect(fautes, `${regle.pourquoi}\n\n${fautes.join('\n')}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE LES FONCTIONS PARTAGÉES DOIVENT RENDRE.
//
// Les règles ci-dessus interdisent de recopier une formule ; celles-ci
// vérifient que la formule PARTAGÉE est la bonne. Une règle qui garde une
// fonction fausse ne fait que la répandre.
// ═══════════════════════════════════════════════════════════════════════════

const SEAU = {
  id: 'p1',
  nom: 'Seau 25 kg',
  prixUnitaireHt: '10.00',
  tauxTva: '5.5',
  modePrix: 'poids' as const,
  contenance: '25.000',
  uniteContenance: 'kg',
};

const POT = {
  id: 'p2',
  nom: 'Pot 500 g',
  prixUnitaireHt: '9.90',
  tauxTva: '5.5',
  modePrix: 'format' as const,
  contenance: null,
  uniteContenance: null,
};

describe('tarifer une commande de campagne', () => {
  it('applique le tarif au POIDS — 10 seaux × 25 kg × 10 €/kg = 2 500 €, pas 100 €', () => {
    const r = tariferCommandeCampagne([{ produitId: 'p1', quantite: 10 }], new Map([['p1', SEAU]]));
    expect(
      r.totalHt,
      'La saisie admin calculait « prixUnitaire × quantité » : elle aurait facturé 100 € ' +
        "pour 2 500 € de marchandise. C'est le défaut que « pricing.ts » a été écrit pour " +
        'supprimer, et il était revenu par une autre porte.',
    ).toBe(2500);
    expect(r.lignes[0]!.modePrix, 'la ligne stockée doit garder ce qui justifie son prix').toBe(
      'poids',
    );
    expect(r.lignes[0]!.contenance).toBe(25);
  });

  it('arrondit la TVA LIGNE PAR LIGNE — trois pots donnent 1,62 € et non 1,63 €', () => {
    const r = tariferCommandeCampagne(
      [
        { produitId: 'p2', quantite: 1 },
        { produitId: 'p2', quantite: 1 },
        { produitId: 'p2', quantite: 1 },
      ],
      new Map([['p2', POT]]),
    );
    // 9,90 × 5,5 % = 0,5445 → 0,54 par ligne. Sans arrondi par ligne : 1,6335 → 1,63.
    expect(r.lignes.every((l) => l.totalLigneTva === 0.54)).toBe(true);
    expect(
      r.totalTva,
      'Le bon de commande affiche un TTC par ligne : ce qui est affiché doit ' +
        "s'additionner à ce qui est affiché. La porte admin, elle, n'arrondissait qu'à la fin.",
    ).toBe(1.62);
    expect(r.totalTtc).toBe(round(r.totalHt + r.totalTva));
  });

  it('REFUSE un produit inconnu au lieu de le chiffrer à zéro', () => {
    expect(() =>
      tariferCommandeCampagne([{ produitId: 'fantome', quantite: 1 }], new Map()),
    ).toThrow(/fantome/);
  });
});

function round(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

describe("les lignes d'un bon de livraison", () => {
  it('JETTE le total envoyé par le client et le recalcule', () => {
    const saisie = ligneBonLivraisonSchema.parse({
      description: 'Seaux',
      quantite: 10,
      prixUnitaire: 10,
      modePrix: 'poids',
      contenance: 25,
      total: 1, // ce que le client prétend
    });
    expect(
      'total' in saisie,
      "« total » ne doit pas être un champ d'entrée : la route l'écrivait tel quel.",
    ).toBe(false);

    const [ligne] = lignesBonLivraisonAvecTotaux([saisie]);
    expect(ligne!.total, 'le serveur recalcule, tarif au poids compris').toBe(2500);
  });

  it('CONSERVE modePrix, contenance et uniteContenance', () => {
    const saisie = ligneBonLivraisonSchema.parse({
      description: 'Seaux',
      quantite: 10,
      prixUnitaire: 10,
      modePrix: 'poids',
      contenance: 25,
      uniteContenance: 'kg',
    });
    expect(
      [saisie.modePrix, saisie.contenance, saisie.uniteContenance],
      "Le schéma d'édition ignorait ces trois champs. Zod retire les clés inconnues : " +
        'éditer un bon — même pour corriger une description — effaçait ce qui justifie ' +
        'son tarif, et la facture qui en découle retombait à un vingt-cinquième.',
    ).toEqual(['poids', 25, 'kg']);
  });

  it("n'invente pas un total de 0 € pour une ligne sans prix", () => {
    const saisie = ligneBonLivraisonSchema.parse({ description: 'Livré', quantite: 10 });
    const [ligne] = lignesBonLivraisonAvecTotaux([saisie]);
    expect(
      ligne!.total,
      "Un bon de livraison peut légitimement n'annoncer que des quantités. Un total de " +
        '0 € se propagerait sur une facture numérotée.',
    ).toBeUndefined();
  });
});

describe("l'arithmétique d'en-tête est la même partout", () => {
  const lignes = [
    { quantite: 3, prixUnitaire: 9.9, tauxTva: 5.5 },
    { quantite: 2, prixUnitaire: 33.33, tauxTva: 20 },
  ];

  it('totauxDepuisLignes rend exactement ce que rend computeFactureTotals', () => {
    const complet = computeFactureTotals(lignes);
    const entete = totauxDepuisLignes(complet.lignes);
    expect(
      entete,
      'Cette arithmétique existait en trois exemplaires : ici, et dans les deux routes qui ' +
        'transforment un bon de livraison en facture — les deux mêmes routes dont le dépôt ' +
        "note déjà que « la correction n'a jamais été back-portée ».",
    ).toEqual({
      sousTotal: complet.sousTotal,
      remiseMontant: complet.remiseMontant,
      sousTotalNet: complet.sousTotalNet,
      tva: complet.tva,
      total: complet.total,
    });
  });

  it('la remise se répercute sur la TVA, pas seulement sur le HT', () => {
    const sans = totauxDepuisLignes([{ total: 100, tauxTva: 20 }]);
    const avec = totauxDepuisLignes([{ total: 100, tauxTva: 20 }], 10);
    expect(sans.tva).toBe(20);
    expect(avec.sousTotalNet).toBe(90);
    expect(avec.tva, 'une remise qui ne réduit pas la TVA fait payer la TVA du prix plein').toBe(
      18,
    );
  });
});
