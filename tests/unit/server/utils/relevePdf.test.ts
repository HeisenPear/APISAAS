import { describe, expect, it } from 'vitest';
import { parsePdf, grouperEnLignes, detecterColonnes, type MotPdf } from '~/server/utils/relevePdf';

/**
 * Lecture d'un relevé PDF. Un PDF n'a pas de colonnes — seulement des mots à des
 * coordonnées — et c'est la POSITION qui dit si un montant est un débit ou un
 * crédit. Se tromper de signe, c'est inscrire une recette à la place d'une
 * dépense dans la comptabilité de l'apiculteur : le pire résultat possible.
 *
 * Ces bancs travaillent sur des mots positionnés à la main, donc sans aucun PDF
 * réel : la logique qui décide du signe est vérifiable seule.
 */

/** Fabrique une ligne de relevé : date, libellé, puis des montants placés en x. */
function ligne(y: number, date: string, libelle: string, montants: [string, number][]): MotPdf[] {
  const mots: MotPdf[] = [{ texte: date, x: 40, y, page: 1 }];
  libelle.split(' ').forEach((mot, i) => mots.push({ texte: mot, x: 90 + i * 30, y, page: 1 }));
  for (const [texte, x] of montants) mots.push({ texte, x, y, page: 1 });
  return mots;
}

describe('relevé PDF — regroupement en lignes', () => {
  it('réunit les mots d’une même hauteur et les ordonne de gauche à droite', () => {
    const mots: MotPdf[] = [
      { texte: 'MONDE', x: 200, y: 500, page: 1 },
      { texte: 'BONJOUR', x: 100, y: 501, page: 1 },
      { texte: 'SUITE', x: 100, y: 480, page: 1 },
    ];
    const lignes = grouperEnLignes(mots);
    expect(lignes).toHaveLength(2);
    expect(lignes[0]!.mots.map((m) => m.texte)).toEqual(['BONJOUR', 'MONDE']);
    // `y` décroît vers le bas : la ligne du haut sort en premier.
    expect(lignes[1]!.mots[0]!.texte).toBe('SUITE');
  });

  it('regroupe des abscisses proches en une seule colonne', () => {
    expect(detecterColonnes([400, 402, 405, 500, 503])).toHaveLength(2);
    expect(detecterColonnes([400, 401])).toHaveLength(1);
  });
});

describe('relevé PDF — deux colonnes Débit / Crédit', () => {
  // Mise en page la plus répandue en France : le montant n'est signé nulle part,
  // c'est SA COLONNE qui dit le sens.
  const mots = [
    ...ligne(700, '03/03/2026', 'PRLV SEPA EDF', [['89,50', 400]]),
    ...ligne(680, '05/03/2026', 'VIREMENT RECU DUPONT', [['1 250,00', 500]]),
    ...ligne(660, '07/03/2026', 'CB SUPERMARCHE', [['42,30', 400]]),
  ].flat();

  it('donne le signe d’après la colonne, sans jamais deviner', () => {
    const r = parsePdf(mots);
    expect(r.colonnes).toBe('debit_credit');
    expect(r.lignes.map((l) => l.montant)).toEqual([-89.5, 1250, -42.3]);
    expect(r.ignorees).toBe(0);
  });

  it('conserve la date et le libellé de chaque opération', () => {
    const r = parsePdf(mots);
    expect(r.lignes[0]).toMatchObject({ date: '2026-03-03', libelle: 'PRLV SEPA EDF' });
    expect(r.lignes[1]!.libelle).toBe('VIREMENT RECU DUPONT');
  });
});

describe('relevé PDF — colonne Montant signée', () => {
  it('lit le signe porté par le montant lui-même', () => {
    const mots = [
      ...ligne(700, '03/03/2026', 'PRLV EDF', [['-89,50', 450]]),
      ...ligne(680, '05/03/2026', 'VIREMENT DUPONT', [['1 250,00', 450]]),
    ].flat();
    const r = parsePdf(mots);
    expect(r.colonnes).toBe('signee');
    expect(r.lignes.map((l) => l.montant)).toEqual([-89.5, 1250]);
  });

  it('comprend aussi les montants entre parenthèses (débit)', () => {
    const mots = ligne(700, '03/03/2026', 'ACHAT', [['(89,50)', 450]]);
    expect(parsePdf(mots).lignes[0]!.montant).toBe(-89.5);
  });
});

describe('relevé PDF — colonne Solde', () => {
  it('écarte le solde, qui court sur toutes les lignes', () => {
    // Débit/Crédit + un solde courant à droite : sans détection, le solde serait
    // importé comme une opération et fausserait tout le rapprochement.
    const mots = [
      ...ligne(700, '03/03/2026', 'PRLV EDF', [
        ['89,50', 400],
        ['1 910,50', 600],
      ]),
      ...ligne(680, '05/03/2026', 'VIREMENT DUPONT', [
        ['1 250,00', 500],
        ['3 160,50', 600],
      ]),
      ...ligne(660, '07/03/2026', 'CB COURSES', [
        ['42,30', 400],
        ['3 118,20', 600],
      ]),
    ].flat();
    const r = parsePdf(mots);
    expect(r.lignes.map((l) => l.montant)).toEqual([-89.5, 1250, -42.3]);
    expect(r.lignes.map((l) => l.montant)).not.toContain(1910.5);
  });
});

describe('relevé PDF — ce qu’on refuse de deviner', () => {
  it('ignore une colonne unique sans aucun signe, plutôt que de trancher au hasard', () => {
    // Un seul montant, aucun signe, aucune mention : rien ne dit si l'argent
    // entre ou sort. On l'annonce comme non lu.
    const mots = ligne(700, '03/03/2026', 'OPERATION', [['89,50', 450]]);
    const r = parsePdf(mots);
    expect(r.lignes).toEqual([]);
    expect(r.ignorees).toBe(1);
  });

  it('ignore les lignes sans date — en-têtes, pieds de page, totaux', () => {
    const mots: MotPdf[] = [
      { texte: 'RELEVE', x: 40, y: 780, page: 1 },
      { texte: 'DE', x: 90, y: 780, page: 1 },
      { texte: 'COMPTE', x: 120, y: 780, page: 1 },
      { texte: 'TOTAL', x: 40, y: 300, page: 1 },
      { texte: '1 234,00', x: 450, y: 300, page: 1 },
    ];
    expect(parsePdf(mots).lignes).toEqual([]);
  });

  it('rend un résultat vide et honnête sur un PDF qui n’est pas un relevé', () => {
    const r = parsePdf([{ texte: 'Facture n°2026-001', x: 40, y: 700, page: 1 }]);
    expect(r.lignes).toEqual([]);
    expect(r.colonnes).toBe('indeterminee');
  });
});

describe('relevé PDF — dates', () => {
  it('complète une date tronquée « 01/03 » avec l’année du document', () => {
    const mots: MotPdf[] = [
      { texte: 'Relevé', x: 40, y: 780, page: 1 },
      { texte: 'du', x: 80, y: 780, page: 1 },
      { texte: '01/03/2026', x: 100, y: 780, page: 1 },
      ...ligne(700, '05/03', 'VIREMENT DUPONT', [['1 250,00', 500]]),
      ...ligne(680, '07/03', 'PRLV EDF', [['89,50', 400]]),
    ];
    const r = parsePdf(mots);
    expect(r.lignes.map((l) => l.date)).toEqual(['2026-03-05', '2026-03-07']);
  });
});

describe('relevé PDF — empreintes', () => {
  it('donne à chaque opération une empreinte stable et distincte', () => {
    const mots = [
      ...ligne(700, '03/03/2026', 'PRLV EDF', [['89,50', 400]]),
      ...ligne(680, '05/03/2026', 'VIREMENT DUPONT', [['1 250,00', 500]]),
    ].flat();
    const r = parsePdf(mots);
    const empreintes = r.lignes.map((l) => l.empreinte);
    expect(new Set(empreintes).size).toBe(2);
    // Rejouer le même relevé doit produire les MÊMES empreintes, sinon
    // l'import en double ne serait jamais détecté.
    expect(parsePdf(mots).lignes.map((l) => l.empreinte)).toEqual(empreintes);
  });
});

describe('relevé PDF — fragments recollés par pdf.js', () => {
  /*
   * Constaté sur un VRAI PDF : pdf.js ne rend pas des mots, il rend des suites
   * de texte, et il recolle celles qui se touchent. La date et le libellé
   * arrivent donc soudés — « 03/03/2026PRLV SEPA EDF ». La première version du
   * lecteur cherchait une date dans le premier fragment, n'en trouvait aucune,
   * et rejetait TOUTES les lignes : zéro opération importée sur un relevé
   * parfaitement lisible.
   */
  const colle: MotPdf[] = [
    { texte: '03/03/2026PRLV SEPA EDF', x: 40, y: 700, page: 1, largeur: 120 },
    { texte: '89,50', x: 380, y: 700, page: 1, largeur: 30 },
    { texte: '05/03/2026VIREMENT RECU DUPONT', x: 40, y: 680, page: 1, largeur: 160 },
    { texte: '1 250,00', x: 470, y: 680, page: 1, largeur: 40 },
  ];

  it('retrouve la date, le libellé et le sens malgré la soudure', () => {
    const r = parsePdf(colle);
    expect(r.lignes).toHaveLength(2);
    expect(r.lignes[0]).toMatchObject({
      date: '2026-03-03',
      libelle: 'PRLV SEPA EDF',
      montant: -89.5,
    });
    expect(r.lignes[1]).toMatchObject({
      date: '2026-03-05',
      libelle: 'VIREMENT RECU DUPONT',
      montant: 1250,
    });
  });

  it('situe les colonnes sur le bord DROIT des montants', () => {
    // Les colonnes de chiffres sont alignées à droite : « 89,50 » et
    // « 1 250,00 » n'ont pas la même largeur, donc pas le même bord gauche,
    // alors que leurs bords droits, eux, sont ceux qui font la colonne.
    const r = parsePdf(colle);
    expect(r.colonnes).toBe('debit_credit');
  });

  it('ne prend pas une date pour un montant', () => {
    // « 03.03.2026 » contient des points : sans garde, la fin de fragment
    // ressemblerait à une somme d'argent.
    const r = parsePdf([
      { texte: '03.03.2026', x: 40, y: 700, page: 1, largeur: 50 },
      { texte: 'ACHAT', x: 100, y: 700, page: 1, largeur: 40 },
      { texte: '-89,50', x: 380, y: 700, page: 1, largeur: 35 },
    ]);
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0]!.montant).toBe(-89.5);
  });
});
