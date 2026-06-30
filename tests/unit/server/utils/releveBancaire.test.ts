import { describe, it, expect } from 'vitest';
import {
  parseMontant,
  parseDateIso,
  parseCsv,
  parseOfx,
  parseReleve,
} from '~~/server/utils/releveBancaire';

describe('parseMontant', () => {
  it('gère les formats FR et US et les espaces de milliers', () => {
    expect(parseMontant('1 234,56')).toBe(1234.56);
    expect(parseMontant('1.234,56')).toBe(1234.56);
    expect(parseMontant('1,234.56')).toBe(1234.56);
    expect(parseMontant('-12,50 €')).toBe(-12.5);
    expect(parseMontant('120')).toBe(120);
  });
  it('gère les parenthèses négatives et renvoie null si illisible', () => {
    expect(parseMontant('(45,00)')).toBe(-45);
    expect(parseMontant('abc')).toBeNull();
    expect(parseMontant('')).toBeNull();
  });
});

describe('parseDateIso', () => {
  it('convertit JJ/MM/AAAA, ISO et AAAAMMJJ', () => {
    expect(parseDateIso('03/06/2026')).toBe('2026-06-03');
    expect(parseDateIso('3/6/26')).toBe('2026-06-03');
    expect(parseDateIso('2026-06-03')).toBe('2026-06-03');
    expect(parseDateIso('20260603')).toBe('2026-06-03');
  });
  it('rejette une date invalide', () => {
    expect(parseDateIso('not a date')).toBeNull();
    expect(parseDateIso('45/13/2026')).toBeNull();
  });
});

describe('parseCsv', () => {
  it('parse un export avec colonne Montant signée (séparateur ;)', () => {
    const csv = [
      'Date;Libelle;Montant',
      '03/06/2026;VIR RECU MARTIN FAC-0042;120,00',
      '04/06/2026;PRLV EDF;-45,90',
      '', // ligne vide ignorée
    ].join('\n');
    const res = parseCsv(csv);
    expect(res.lignes).toHaveLength(2);
    expect(res.lignes[0]).toMatchObject({
      date: '2026-06-03',
      montant: 120,
      libelle: 'VIR RECU MARTIN FAC-0042',
    });
    expect(res.lignes[1]!.montant).toBe(-45.9);
  });

  it('parse un export avec colonnes Débit/Crédit séparées', () => {
    const csv = [
      'Date,Description,Debit,Credit',
      '2026-06-03,Encaissement Dupont,,80.00',
      '2026-06-05,Achat cire,33.20,',
    ].join('\n');
    const res = parseCsv(csv);
    expect(res.lignes[0]!.montant).toBe(80);
    expect(res.lignes[1]!.montant).toBe(-33.2);
  });

  it('ignore les lignes sans date ou sans montant', () => {
    const csv = ['Date;Libelle;Montant', ';ligne sans date;10,00', '03/06/2026;ok;5,00'].join('\n');
    const res = parseCsv(csv);
    expect(res.lignes).toHaveLength(1);
    expect(res.ignorees).toBe(1);
  });
});

describe('parseOfx', () => {
  it('extrait les transactions STMTTRN avec FITID comme référence', () => {
    const ofx = `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
      <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260603<TRNAMT>120.00<FITID>ABC123<NAME>VIR MARTIN<MEMO>FAC-0042</STMTTRN>
      <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260605<TRNAMT>-45.90<FITID>DEF456<NAME>EDF</STMTTRN>
    </BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    const res = parseOfx(ofx);
    expect(res.lignes).toHaveLength(2);
    expect(res.lignes[0]).toMatchObject({ date: '2026-06-03', montant: 120, reference: 'ABC123' });
    expect(res.lignes[0]!.empreinte).toBe('ref:ABC123');
    expect(res.lignes[1]!.montant).toBe(-45.9);
  });
});

describe('parseReleve', () => {
  it('détecte l’OFX et le CSV automatiquement', () => {
    expect(
      parseReleve('<OFX><STMTTRN><DTPOSTED>20260603<TRNAMT>1<NAME>x</STMTTRN></OFX>').format,
    ).toBe('ofx');
    expect(parseReleve('Date;Libelle;Montant\n03/06/2026;x;1,00').format).toBe('csv');
  });
});
