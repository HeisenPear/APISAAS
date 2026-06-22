import { describe, it, expect } from 'vitest';
import {
  buildEcritures,
  toBalanceCsv,
  toJournalCsv,
  type TransactionCompta,
} from '../../../../server/utils/comptabilite';

const rows: TransactionCompta[] = [
  {
    numero: 'F-001',
    type: 'vente',
    date: '2026-01-15',
    sousTotal: 100,
    tva: 5.5,
    total: 105.5,
    clientNom: 'Dupont',
  },
  {
    numero: 'A-001',
    type: 'achat',
    date: '2026-01-20',
    sousTotal: 50,
    tva: 10,
    total: 60,
    notes: 'Cire',
  },
  { numero: 'F-002', type: 'vente', date: '2026-02-01', sousTotal: 200, tva: 0, total: 200 },
];

describe('comptabilité — écritures en partie double', () => {
  it('génère des écritures globalement équilibrées (débit = crédit)', () => {
    const ec = buildEcritures(rows);
    const debit = ec.reduce((s, e) => s + e.debit, 0);
    const credit = ec.reduce((s, e) => s + e.credit, 0);
    expect(Math.round(debit * 100) / 100).toBe(Math.round(credit * 100) / 100);
  });

  it('vente → 411 débit TTC, 707 crédit HT, 44571 crédit TVA', () => {
    const ec = buildEcritures([rows[0]]);
    expect(ec.find((e) => e.compteNum === '411000')?.debit).toBe(105.5);
    expect(ec.find((e) => e.compteNum === '707000')?.credit).toBe(100);
    expect(ec.find((e) => e.compteNum === '445710')?.credit).toBe(5.5);
  });

  it('achat → 607 débit HT, 44566 débit TVA, 401 crédit TTC', () => {
    const ec = buildEcritures([rows[1]]);
    expect(ec.find((e) => e.compteNum === '607000')?.debit).toBe(50);
    expect(ec.find((e) => e.compteNum === '445660')?.debit).toBe(10);
    expect(ec.find((e) => e.compteNum === '401000')?.credit).toBe(60);
  });

  it('vente sans TVA → pas de ligne TVA collectée', () => {
    const ec = buildEcritures([rows[2]]);
    expect(ec.some((e) => e.compteNum === '445710')).toBe(false);
    expect(ec).toHaveLength(2);
  });

  it('reconstitue le TTC manquant à partir de HT + TVA', () => {
    const ec = buildEcritures([
      { numero: 'F-003', type: 'vente', date: '2026-03-01', sousTotal: 80, tva: 4.4, total: null },
    ]);
    expect(ec.find((e) => e.compteNum === '411000')?.debit).toBe(84.4);
  });

  it('balance : total débit = total crédit', () => {
    const totaux = toBalanceCsv(buildEcritures(rows)).trim().split('\n').at(-1)!.split(';');
    expect(totaux[2]).toBe(totaux[3]);
  });

  it('journal : une ligne d’en-tête + une ligne par écriture', () => {
    const ec = buildEcritures(rows);
    expect(toJournalCsv(ec).trim().split('\n')).toHaveLength(ec.length + 1);
  });
});
