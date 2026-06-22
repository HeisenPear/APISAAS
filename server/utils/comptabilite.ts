/**
 * Génération d'écritures comptables en partie double à partir des transactions
 * (ventes / achats), pour l'export « expert-comptable » : journal, grand-livre,
 * balance. Plan de comptes PCG simplifié adapté à une exploitation apicole.
 *
 * Convention TVA :
 *  - Vente : Débit 411 (client) TTC · Crédit 707 (ventes) HT · Crédit 44571 (TVA collectée)
 *  - Achat : Débit 607 (achats) HT · Débit 44566 (TVA déductible) · Crédit 401 (fournisseur) TTC
 */

export const PLAN_COMPTES = {
  client: { num: '411000', lib: 'Clients' },
  fournisseur: { num: '401000', lib: 'Fournisseurs' },
  ventes: { num: '707000', lib: 'Ventes de produits finis' },
  achats: { num: '607000', lib: 'Achats de marchandises' },
  tvaCollectee: { num: '445710', lib: 'TVA collectée' },
  tvaDeductible: { num: '445660', lib: 'TVA déductible sur autres biens et services' },
} as const;

export interface TransactionCompta {
  numero: string | null;
  type: 'vente' | 'achat';
  date: Date | string;
  sousTotal: string | number | null;
  tva: string | number | null;
  total: string | number | null;
  categorie?: string | null;
  notes?: string | null;
  clientNom?: string | null;
  clientEntreprise?: string | null;
}

export interface EcritureComptable {
  journalCode: string;
  journalLib: string;
  date: Date;
  piece: string;
  libelle: string;
  compteNum: string;
  compteLib: string;
  debit: number;
  credit: number;
}

function toNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function libelleDe(r: TransactionCompta): string {
  const tiers = r.clientEntreprise || r.clientNom || '';
  const base = r.notes || r.categorie || (r.type === 'vente' ? 'Vente' : 'Achat');
  return [base, tiers].filter(Boolean).join(' — ');
}

/** Transforme chaque transaction en écritures équilibrées (débit = crédit). */
export function buildEcritures(rows: TransactionCompta[]): EcritureComptable[] {
  const out: EcritureComptable[] = [];
  const C = PLAN_COMPTES;

  for (const r of rows) {
    const ht = toNumber(r.sousTotal);
    const tva = toNumber(r.tva);
    let ttc = toNumber(r.total);
    // Si le TTC est absent, on le reconstitue (HT + TVA) pour garder l'équilibre.
    if (!ttc) ttc = Math.round((ht + tva) * 100) / 100;

    const date = r.date instanceof Date ? r.date : new Date(r.date);
    const piece = r.numero ?? '';
    const libelle = libelleDe(r);

    const line = (
      journalCode: string,
      journalLib: string,
      compte: { num: string; lib: string },
      debit: number,
      credit: number,
    ): EcritureComptable => ({
      journalCode,
      journalLib,
      date,
      piece,
      libelle,
      compteNum: compte.num,
      compteLib: compte.lib,
      debit,
      credit,
    });

    if (r.type === 'vente') {
      out.push(line('VE', 'Ventes', C.client, ttc, 0));
      out.push(line('VE', 'Ventes', C.ventes, 0, ht));
      if (tva) out.push(line('VE', 'Ventes', C.tvaCollectee, 0, tva));
    } else {
      out.push(line('HA', 'Achats', C.achats, ht, 0));
      if (tva) out.push(line('HA', 'Achats', C.tvaDeductible, tva, 0));
      out.push(line('HA', 'Achats', C.fournisseur, 0, ttc));
    }
  }

  return out;
}

// ─── Formats CSV (séparateur « ; », décimales à 2 chiffres) ──────────────

function esc(s: string): string {
  return s.replace(/;/g, ',').replace(/\r?\n/g, ' ').trim();
}
function montant(n: number): string {
  return n ? n.toFixed(2) : '';
}
function dateFr(d: Date): string {
  return d.toLocaleDateString('fr-FR');
}

/** Livre-journal : toutes les écritures, dans l'ordre chronologique. */
export function toJournalCsv(ecritures: EcritureComptable[]): string {
  const header = 'Journal;Date;Pièce;Compte;Libellé compte;Libellé écriture;Débit;Crédit';
  const lines = ecritures.map((e) =>
    [
      e.journalCode,
      dateFr(e.date),
      esc(e.piece),
      e.compteNum,
      esc(e.compteLib),
      esc(e.libelle),
      montant(e.debit),
      montant(e.credit),
    ].join(';'),
  );
  return [header, ...lines].join('\n');
}

/** Grand-livre : écritures regroupées par compte, avec solde courant. */
export function toGrandLivreCsv(ecritures: EcritureComptable[]): string {
  const header = 'Compte;Libellé compte;Date;Pièce;Libellé écriture;Débit;Crédit;Solde';
  const parCompte = new Map<string, EcritureComptable[]>();
  for (const e of ecritures) {
    const arr = parCompte.get(e.compteNum) ?? [];
    arr.push(e);
    parCompte.set(e.compteNum, arr);
  }
  const lines: string[] = [];
  for (const compteNum of [...parCompte.keys()].sort()) {
    let solde = 0;
    for (const e of parCompte.get(compteNum)!) {
      solde = Math.round((solde + e.debit - e.credit) * 100) / 100;
      lines.push(
        [
          e.compteNum,
          esc(e.compteLib),
          dateFr(e.date),
          esc(e.piece),
          esc(e.libelle),
          montant(e.debit),
          montant(e.credit),
          solde.toFixed(2),
        ].join(';'),
      );
    }
  }
  return [header, ...lines].join('\n');
}

/** Balance : par compte, totaux débit / crédit et solde. */
export function toBalanceCsv(ecritures: EcritureComptable[]): string {
  const header = 'Compte;Libellé compte;Total débit;Total crédit;Solde';
  const agg = new Map<string, { lib: string; debit: number; credit: number }>();
  for (const e of ecritures) {
    const a = agg.get(e.compteNum) ?? { lib: e.compteLib, debit: 0, credit: 0 };
    a.debit = Math.round((a.debit + e.debit) * 100) / 100;
    a.credit = Math.round((a.credit + e.credit) * 100) / 100;
    agg.set(e.compteNum, a);
  }
  let totalDebit = 0;
  let totalCredit = 0;
  const lines = [...agg.keys()].sort().map((num) => {
    const a = agg.get(num)!;
    totalDebit = Math.round((totalDebit + a.debit) * 100) / 100;
    totalCredit = Math.round((totalCredit + a.credit) * 100) / 100;
    const solde = Math.round((a.debit - a.credit) * 100) / 100;
    return [num, esc(a.lib), a.debit.toFixed(2), a.credit.toFixed(2), solde.toFixed(2)].join(';');
  });
  const totaux = ['', 'TOTAUX', totalDebit.toFixed(2), totalCredit.toFixed(2), '0.00'].join(';');
  return [header, ...lines, totaux].join('\n');
}
