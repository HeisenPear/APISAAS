import { z } from 'zod';
import { mouvementsBancaires } from '~~/server/database/schema';
import { parseReleve } from '~~/server/utils/releveBancaire';
import { parsePdf, type MotPdf } from '~~/server/utils/relevePdf';

// Import d'un relevé bancaire (CSV/OFX en texte, PDF en base64). Le client lit le
// fichier et envoie son contenu. On parse, on dédoublonne (empreinte unique par
// utilisateur) et on insère les mouvements. Aucune connexion bancaire, aucune
// écriture comptable : juste de la donnée à rapprocher.
//
// Le PDF passe par `contenuBase64` : c'est un binaire, il ne survivrait pas à une
// lecture en texte. La limite est plus basse que pour le texte car la base64
// gonfle de ~33 % et un relevé PDF dépasse rarement quelques centaines de Ko.
const schema = z
  .object({
    contenu: z.string().min(1).max(3_000_000).optional(),
    contenuBase64: z.string().min(1).max(8_000_000).optional(),
    nomFichier: z.string().max(255).optional(),
  })
  .refine((b) => !!b.contenu !== !!b.contenuBase64, {
    message: 'Fournir soit contenu (CSV/OFX), soit contenuBase64 (PDF)',
  });

/**
 * PDF → mots positionnés. C'est la POSITION qui dit si un montant est un débit
 * ou un crédit (cf. `relevePdf.ts`) : un extracteur de texte brut aplatirait le
 * tableau et ferait perdre le sens des montants.
 */
async function motsDuPdf(binaire: Uint8Array): Promise<MotPdf[]> {
  const { extractTextItems } = await import('unpdf');
  const { items } = await extractTextItems(binaire);
  const mots: MotPdf[] = [];
  items.forEach((page, i) => {
    for (const it of page) {
      if (it.str.trim()) mots.push({ texte: it.str, x: it.x, y: it.y, page: i + 1 });
    }
  });
  return mots;
}

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { contenu, contenuBase64, nomFichier } = await readValidatedBody(event, schema.parse);

  let lignes: Awaited<ReturnType<typeof parseReleve>>['lignes'];
  let format: 'csv' | 'ofx' | 'pdf';
  let ignorees: number;
  /** Ce que la lecture a compris de la mise en page — restitué à l'apiculteur. */
  let colonnes: string | undefined;

  if (contenuBase64) {
    let mots: MotPdf[];
    try {
      mots = await motsDuPdf(Buffer.from(contenuBase64, 'base64'));
    } catch {
      // PDF chiffré, corrompu, ou simple image scannée : on le dit franchement
      // plutôt que de rendre « 0 opération » sans expliquer pourquoi.
      throw createError({
        statusCode: 422,
        message:
          'Ce PDF n’a pas pu être lu. S’il s’agit d’un scan (une image), le texte n’y est pas : demandez à votre banque l’export CSV ou OFX du même relevé.',
      });
    }
    if (mots.length === 0) {
      throw createError({
        statusCode: 422,
        message:
          'Ce PDF ne contient aucun texte — c’est probablement un scan. L’export CSV ou OFX de votre banque contient les mêmes opérations, en lisible.',
      });
    }
    const res = parsePdf(mots);
    lignes = res.lignes;
    ignorees = res.ignorees;
    colonnes = res.colonnes;
    format = 'pdf';
  } else {
    const res = parseReleve(contenu!, nomFichier);
    lignes = res.lignes;
    ignorees = res.ignorees;
    format = res.format;
  }

  if (lignes.length === 0) {
    return { data: { importes: 0, doublons: 0, ignorees, format, colonnes } };
  }

  // Dédoublonnage intra-fichier puis insertion idempotente (conflit = même relevé réimporté).
  const parEmpreinte = new Map(lignes.map((l) => [l.empreinte, l]));
  const SOURCE = {
    csv: 'import_csv',
    ofx: 'import_ofx',
    pdf: 'import_pdf',
  } as const;
  const rows = [...parEmpreinte.values()].map((l) => ({
    userId: ownerId,
    source: SOURCE[format],
    dateOperation: new Date(l.date),
    montant: l.montant.toFixed(2),
    libelle: l.libelle,
    reference: l.reference ?? null,
    empreinte: l.empreinte,
  }));

  const inserted = await db
    .insert(mouvementsBancaires)
    .values(rows)
    .onConflictDoNothing({ target: [mouvementsBancaires.userId, mouvementsBancaires.empreinte] })
    .returning({ id: mouvementsBancaires.id });

  return {
    data: {
      importes: inserted.length,
      doublons: rows.length - inserted.length,
      ignorees,
      format,
      colonnes,
    },
  };
});
