import { describe, expect, it } from 'vitest';
import { parsePdf, type MotPdf } from '~/server/utils/relevePdf';

/**
 * La chaîne COMPLÈTE : octets d'un PDF → extraction → opérations bancaires.
 *
 * Les autres bancs de `relevePdf` partent de fragments posés à la main : ils
 * vérifient le raisonnement, pas la réalité de l'extraction. Or c'est
 * précisément là qu'était le défaut — pdf.js RECOLLE les suites de texte
 * adjacentes, si bien que la date et le libellé arrivent soudés. La première
 * version du lecteur, verte sur tous ses bancs, rendait zéro opération sur un
 * vrai fichier.
 *
 * Le PDF est FABRIQUÉ ici, en quelques lignes : pas de binaire au dépôt, et le
 * banc reste lisible.
 */

/** Fabrique un PDF minimal mais valide, avec du texte posé à des coordonnées. */
function pdfAvecTexte(mots: { texte: string; x: number; y: number }[]): Uint8Array {
  const flux = mots.map((m) => `BT /F1 10 Tf ${m.x} ${m.y} Td (${m.texte}) Tj ET`).join('\n');
  const objets = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${flux.length}>>\nstream\n${flux}\nendstream`,
  ];

  let doc = '%PDF-1.4\n';
  const offsets: number[] = [];
  objets.forEach((o, i) => {
    offsets.push(doc.length);
    doc += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = doc.length;
  doc += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) doc += `${String(off).padStart(10, '0')} 00000 n \n`;
  doc += `trailer\n<</Size ${objets.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;

  const octets = new Uint8Array(doc.length);
  for (let i = 0; i < doc.length; i++) octets[i] = doc.charCodeAt(i) & 0xff;
  return octets;
}

async function lire(pdf: Uint8Array): Promise<MotPdf[]> {
  const { extractTextItems } = await import('unpdf');
  // COPIE délibérée : pdf.js transfère le tampon à son ouvrier et le détache.
  // Relire le même tableau une seconde fois lève « Cannot transfer object of
  // unsupported type ». En production la question ne se pose pas — chaque
  // requête décode son propre base64 — mais ici les bancs partagent le fichier.
  const { items } = await extractTextItems(new Uint8Array(pdf));
  const mots: MotPdf[] = [];
  items.forEach((page, i) => {
    for (const it of page) {
      if (it.str.trim()) {
        mots.push({ texte: it.str, x: it.x, y: it.y, page: i + 1, largeur: it.width });
      }
    }
  });
  return mots;
}

describe('relevé PDF — de bout en bout, depuis un vrai fichier', () => {
  const RELEVE = pdfAvecTexte([
    { texte: '03/03/2026', x: 40, y: 700 },
    { texte: 'PRLV SEPA EDF', x: 90, y: 700 },
    { texte: '89,50', x: 400, y: 700 },
    { texte: '05/03/2026', x: 40, y: 680 },
    { texte: 'VIREMENT RECU DUPONT', x: 90, y: 680 },
    { texte: '1 250,00', x: 500, y: 680 },
    { texte: '07/03/2026', x: 40, y: 660 },
    { texte: 'CB SUPERMARCHE', x: 90, y: 660 },
    { texte: '42,30', x: 400, y: 660 },
  ]);

  it('extrait bien du texte positionné du fichier', async () => {
    const mots = await lire(RELEVE);
    expect(mots.length).toBeGreaterThan(0);
    // Filet : si l'extraction rendait des fragments sans position, tout le
    // raisonnement sur les colonnes s'effondrerait en silence.
    expect(mots.every((m) => Number.isFinite(m.x) && Number.isFinite(m.y))).toBe(true);
  });

  it('retrouve les trois opérations, avec le bon signe', async () => {
    const r = parsePdf(await lire(RELEVE));
    expect(r.colonnes).toBe('debit_credit');
    expect(r.lignes.map((l) => l.montant)).toEqual([-89.5, 1250, -42.3]);
    expect(r.lignes.map((l) => l.date)).toEqual(['2026-03-03', '2026-03-05', '2026-03-07']);
  });

  it('nettoie les libellés de la date qui leur est soudée', async () => {
    const r = parsePdf(await lire(RELEVE));
    for (const l of r.lignes) {
      expect(l.libelle, l.libelle).not.toMatch(/^\d{2}\/\d{2}/);
      expect(l.libelle.length).toBeGreaterThan(3);
    }
    expect(r.lignes[0]!.libelle).toBe('PRLV SEPA EDF');
  });
});
