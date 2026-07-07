import { describe, it, expect } from 'vitest';
import {
  normaliserLibelle,
  diffJours,
  scoreMontant,
  scoreDate,
  scoreLibelle,
  evaluerPaire,
  rapprocher,
  facturesARelancer,
  SEUIL_SUGGESTION,
  type TransactionBancaire,
  type DocumentARapprocher,
} from '~~/server/utils/rapprochement';

describe('normaliserLibelle', () => {
  it('met en minuscules, retire accents et ponctuation', () => {
    expect(normaliserLibelle('VIR. Épicerie Léa-Café !')).toBe('vir epicerie lea cafe');
  });
});

describe('diffJours', () => {
  it('compte les jours entre deux dates ISO', () => {
    expect(diffJours('2026-06-01', '2026-06-03')).toBe(2);
    expect(diffJours('2026-06-03', '2026-06-01')).toBe(-2);
  });
});

describe('scoreMontant', () => {
  it('donne 50 pour un montant exact (signe ignoré)', () => {
    expect(scoreMontant(120, 120)).toBe(50);
    expect(scoreMontant(-120, 120)).toBe(50);
  });
  it('dégrade puis annule au-delà de 2 %', () => {
    expect(scoreMontant(121, 120)).toBeGreaterThan(0);
    expect(scoreMontant(121, 120)).toBeLessThan(50);
    expect(scoreMontant(130, 120)).toBe(0);
  });
});

describe('scoreDate', () => {
  it('récompense un paiement le jour même, dégrade avec le délai', () => {
    expect(scoreDate('2026-06-01', '2026-06-01')).toBe(30);
    expect(scoreDate('2026-06-20', '2026-06-01')).toBeGreaterThan(0);
    expect(scoreDate('2026-06-20', '2026-06-01')).toBeLessThan(30);
  });
  it('pénalise (sans exclure) un paiement légèrement antérieur, exclut au-delà de la fenêtre', () => {
    expect(scoreDate('2026-05-30', '2026-06-01')).toBe(10);
    expect(scoreDate('2026-12-01', '2026-06-01')).toBe(0);
  });
});

describe('scoreLibelle', () => {
  const base: DocumentARapprocher = { id: 'd', sens: 'vente', date: '2026-06-01', montant: 100 };

  it('reconnaît la référence de facture dans le libellé', () => {
    const r = scoreLibelle('VIR SEPA FAC-2026-0042 MARTIN', {
      ...base,
      reference: 'FAC-2026-0042',
    });
    expect(r.points).toBe(20);
    expect(r.raison).toContain('2026');
  });
  it('reconnaît le nom du tiers', () => {
    const r = scoreLibelle('VIREMENT EPICERIE LEA', { ...base, tiers: 'Épicerie Léa' });
    expect(r.points).toBeGreaterThan(0);
  });
  it('renvoie 0 sans correspondance', () => {
    expect(scoreLibelle('VIR INCONNU', base).points).toBe(0);
  });
});

describe('evaluerPaire', () => {
  it('refuse une vente face à un débit (sens incompatible)', () => {
    const tx: TransactionBancaire = { id: 't', date: '2026-06-02', montant: -100, libelle: 'x' };
    const doc: DocumentARapprocher = { id: 'd', sens: 'vente', date: '2026-06-01', montant: 100 };
    expect(evaluerPaire(tx, doc)).toBeNull();
  });
  it('refuse si le montant ne correspond pas du tout', () => {
    const tx: TransactionBancaire = { id: 't', date: '2026-06-02', montant: 500, libelle: 'x' };
    const doc: DocumentARapprocher = { id: 'd', sens: 'vente', date: '2026-06-01', montant: 100 };
    expect(evaluerPaire(tx, doc)).toBeNull();
  });
  it('score haut une vente encaissée à montant exact avec référence', () => {
    const tx: TransactionBancaire = {
      id: 't',
      date: '2026-06-03',
      montant: 120,
      libelle: 'VIR FAC-0042 MARTIN',
    };
    const doc: DocumentARapprocher = {
      id: 'd',
      sens: 'vente',
      date: '2026-06-01',
      montant: 120,
      reference: 'FAC-0042',
      tiers: 'Martin',
    };
    const s = evaluerPaire(tx, doc)!;
    expect(s.score).toBeGreaterThanOrEqual(90);
    expect(s.raisons).toContain('Montant exact');
  });
});

describe('rapprocher', () => {
  it('attribue 1-pour-1 et garde le meilleur candidat en cas de conflit', () => {
    const transactions: TransactionBancaire[] = [
      { id: 't1', date: '2026-06-03', montant: 120, libelle: 'VIR FAC-1 MARTIN' },
      { id: 't2', date: '2026-06-04', montant: 120, libelle: 'VIR DUPONT' },
    ];
    const documents: DocumentARapprocher[] = [
      {
        id: 'd1',
        sens: 'vente',
        date: '2026-06-01',
        montant: 120,
        reference: 'FAC-1',
        tiers: 'Martin',
      },
      { id: 'd2', sens: 'vente', date: '2026-06-02', montant: 120, tiers: 'Dupont' },
    ];
    const res = rapprocher(transactions, documents);
    expect(res.suggestions).toHaveLength(2);
    // t1 doit aller à d1 (référence + tiers), pas à d2.
    const m = res.suggestions.find((s) => s.transactionId === 't1');
    expect(m?.documentId).toBe('d1');
    expect(res.documentsNonRapproches).toHaveLength(0);
  });

  it('laisse non rapprochés les éléments sans correspondance', () => {
    const res = rapprocher(
      [{ id: 't1', date: '2026-06-03', montant: 999, libelle: 'INCONNU' }],
      [{ id: 'd1', sens: 'vente', date: '2026-06-01', montant: 120 }],
    );
    expect(res.suggestions).toHaveLength(0);
    expect(res.transactionsNonRapprochees).toEqual(['t1']);
    expect(res.documentsNonRapproches).toEqual(['d1']);
  });

  it('ne propose rien sous le seuil (montant seulement proche + date lointaine + libellé muet)', () => {
    const res = rapprocher(
      [{ id: 't1', date: '2026-09-30', montant: 121, libelle: 'VIR' }],
      [{ id: 'd1', sens: 'vente', date: '2026-06-01', montant: 120 }],
    );
    expect(res.suggestions.every((s) => s.score >= SEUIL_SUGGESTION)).toBe(true);
    expect(res.suggestions).toHaveLength(0);
  });

  it('suggère un montant exact seul (à confirmer) même sans autre indice', () => {
    const res = rapprocher(
      [{ id: 't1', date: '2026-09-30', montant: 120, libelle: 'VIR' }],
      [{ id: 'd1', sens: 'vente', date: '2026-06-01', montant: 120 }],
    );
    expect(res.suggestions).toHaveLength(1);
    expect(res.suggestions[0]!.raisons).toContain('Montant exact');
  });
});

describe('facturesARelancer', () => {
  const documents: DocumentARapprocher[] = [
    { id: 'd1', sens: 'vente', date: '2026-05-01', montant: 120, tiers: 'Martin' },
    { id: 'd2', sens: 'vente', date: '2026-06-20', montant: 80, tiers: 'Dupont' },
    { id: 'd3', sens: 'achat', date: '2026-05-01', montant: 50 },
  ];

  it('relance les ventes impayées dont l’échéance est dépassée, pas les achats ni les ventes payées', () => {
    const rapprochees = new Set<string>(); // rien n'est payé
    const relances = facturesARelancer(documents, rapprochees, '2026-06-25', 30);
    // d1 (facturée le 01/05, échéance 31/05, on est le 25/06 → en retard) doit sortir.
    // d2 (facturée le 20/06, échéance 20/07 → pas encore due) ne doit pas sortir.
    // d3 est un achat → jamais.
    expect(relances.map((r) => r.documentId)).toEqual(['d1']);
    expect(relances[0]!.joursRetard).toBe(25);
  });

  it('exclut une vente déjà rapprochée (encaissement trouvé)', () => {
    const relances = facturesARelancer(documents, new Set(['d1']), '2026-06-25', 30);
    expect(relances).toHaveLength(0);
  });
});
