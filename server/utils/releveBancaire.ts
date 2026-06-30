// Parsing de relevés bancaires — fonctions pures, zéro I/O, testables.
// Transforme un fichier CSV (export banque FR) ou OFX en lignes normalisées prêtes à être
// rapprochées (voir rapprochement.ts). Aucune connexion bancaire ici : l'utilisateur fournit
// l'export de SA banque. Tolérant aux formats : séparateur ;/,/tab, montants « 1 234,56 »,
// colonnes Débit/Crédit séparées ou Montant signé, dates JJ/MM/AAAA ou ISO.

import { normaliserLibelle } from './rapprochement';

/** Ligne de relevé normalisée. `montant` SIGNÉ : + crédit (entrée), − débit (sortie). */
export interface LigneReleve {
  date: string; // ISO YYYY-MM-DD
  montant: number;
  libelle: string;
  /** Référence banque (FITID OFX) si disponible. */
  reference?: string;
  /** Empreinte stable pour dédoublonner les imports successifs. */
  empreinte: string;
}

export interface ResultatParsing {
  lignes: LigneReleve[];
  format: 'csv' | 'ofx';
  /** Nombre de lignes ignorées (en-tête, vides, illisibles). */
  ignorees: number;
}

// ─── Montants ───────────────────────────────────────────────────────────────

/** Parse un montant FR ou US : « 1 234,56 », « 1.234,56 », « 1,234.56 », « -12.50 ». */
export function parseMontant(s: string): number | null {
  let t = s.trim().replace(/[\s€$]/g, '');
  if (!t) return null;
  const negParen = /^\((.*)\)$/.exec(t);
  if (negParen) t = '-' + negParen[1];
  const lastComma = t.lastIndexOf(',');
  const lastDot = t.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Le séparateur décimal est le dernier ; l'autre marque les milliers.
    if (lastComma > lastDot) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
  } else if (lastComma >= 0) {
    t = t.replace(',', '.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ─── Dates ──────────────────────────────────────────────────────────────────

/** Parse une date en ISO depuis JJ/MM/AAAA, AAAA-MM-JJ ou AAAAMMJJ. */
export function parseDateIso(s: string): string | null {
  const t = s.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t);
  if (m) {
    const jour = m[1]!.padStart(2, '0');
    const mois = m[2]!.padStart(2, '0');
    const annee = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
    if (+mois >= 1 && +mois <= 12 && +jour >= 1 && +jour <= 31) return `${annee}-${mois}-${jour}`;
    return null;
  }
  m = /^(\d{4})(\d{2})(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function empreinte(date: string, montant: number, libelle: string, reference?: string): string {
  if (reference) return `ref:${reference}`;
  return `${date}|${montant.toFixed(2)}|${normaliserLibelle(libelle)}`;
}

// ─── CSV ────────────────────────────────────────────────────────────────────

function detecterDelimiteur(ligne: string): string {
  const candidats = [';', '\t', ','];
  let best = ';';
  let max = -1;
  for (const c of candidats) {
    const n = ligne.split(c).length;
    if (n > max) {
      max = n;
      best = c;
    }
  }
  return best;
}

/** Découpe une ligne CSV en respectant les guillemets simples doublés. */
function decouper(ligne: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < ligne.length; i++) {
    const ch = ligne[i];
    if (ch === '"') {
      if (inQuote && ligne[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuote = !inQuote;
    } else if (ch === delim && !inQuote) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function indexColonne(entetes: string[], cles: string[]): number {
  return entetes.findIndex((e) => {
    const n = normaliserLibelle(e);
    return cles.some((k) => n === k || n.includes(k));
  });
}

export function parseCsv(contenu: string): ResultatParsing {
  const lignes = contenu.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lignes.length < 2) return { lignes: [], format: 'csv', ignorees: lignes.length };
  const delim = detecterDelimiteur(lignes[0]!);
  const entetes = decouper(lignes[0]!, delim);

  const iDate = indexColonne(entetes, ['date', 'date operation', 'date valeur']);
  const iLib = indexColonne(entetes, [
    'libelle',
    'label',
    'description',
    'nature',
    'motif',
    'detail',
  ]);
  const iMontant = indexColonne(entetes, ['montant', 'amount', 'valeur']);
  const iDebit = indexColonne(entetes, ['debit']);
  const iCredit = indexColonne(entetes, ['credit']);

  const result: LigneReleve[] = [];
  let ignorees = 0;
  for (let r = 1; r < lignes.length; r++) {
    const cols = decouper(lignes[r]!, delim);
    const date = iDate >= 0 ? parseDateIso(cols[iDate] ?? '') : null;
    const libelle =
      (iLib >= 0
        ? cols[iLib]
        : cols.find((c) => c && !parseDateIso(c) && parseMontant(c) === null)) ?? '';
    let montant: number | null = null;
    if (iMontant >= 0) montant = parseMontant(cols[iMontant] ?? '');
    if (montant === null && (iDebit >= 0 || iCredit >= 0)) {
      const d = iDebit >= 0 ? parseMontant(cols[iDebit] ?? '') : null;
      const c = iCredit >= 0 ? parseMontant(cols[iCredit] ?? '') : null;
      if (c) montant = Math.abs(c);
      else if (d) montant = -Math.abs(d);
    }
    if (!date || montant === null || montant === 0) {
      ignorees++;
      continue;
    }
    result.push({ date, montant, libelle, empreinte: empreinte(date, montant, libelle) });
  }
  return { lignes: result, format: 'csv', ignorees };
}

// ─── OFX ────────────────────────────────────────────────────────────────────

function tagOfx(bloc: string, tag: string): string | undefined {
  const m = new RegExp(`<${tag}>([^<\r\n]*)`, 'i').exec(bloc);
  return m ? m[1]!.trim() : undefined;
}

export function parseOfx(contenu: string): ResultatParsing {
  const blocs = contenu.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  const result: LigneReleve[] = [];
  let ignorees = 0;
  for (const bloc of blocs) {
    const montant = parseMontant(tagOfx(bloc, 'TRNAMT') ?? '');
    const dateRaw = tagOfx(bloc, 'DTPOSTED');
    const date = dateRaw ? parseDateIso(dateRaw) : null;
    const libelle = [tagOfx(bloc, 'NAME'), tagOfx(bloc, 'MEMO')].filter(Boolean).join(' ').trim();
    const fitid = tagOfx(bloc, 'FITID');
    if (!date || montant === null || montant === 0) {
      ignorees++;
      continue;
    }
    result.push({
      date,
      montant,
      libelle,
      reference: fitid,
      empreinte: empreinte(date, montant, libelle, fitid),
    });
  }
  return { lignes: result, format: 'ofx', ignorees };
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

/** Détecte le format (OFX vs CSV) et parse en conséquence. */
export function parseReleve(contenu: string, nomFichier?: string): ResultatParsing {
  const estOfx =
    /<OFX>/i.test(contenu) || /<STMTTRN>/i.test(contenu) || /\.ofx$/i.test(nomFichier ?? '');
  return estOfx ? parseOfx(contenu) : parseCsv(contenu);
}
