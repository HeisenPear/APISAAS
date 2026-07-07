import { z } from 'zod';
import { mouvementsBancaires } from '~~/server/database/schema';
import { parseReleve } from '~~/server/utils/releveBancaire';

// Import d'un relevé bancaire (CSV/OFX). Le client lit le fichier et envoie son contenu.
// On parse, on dédoublonne (empreinte unique par utilisateur) et on insère les mouvements.
// Aucune connexion bancaire, aucune écriture comptable : juste de la donnée à rapprocher.
const schema = z.object({
  contenu: z.string().min(1).max(3_000_000),
  nomFichier: z.string().max(255).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { contenu, nomFichier } = await readValidatedBody(event, schema.parse);

  const { lignes, format, ignorees } = parseReleve(contenu, nomFichier);
  if (lignes.length === 0) {
    return { data: { importes: 0, doublons: 0, ignorees, format } };
  }

  // Dédoublonnage intra-fichier puis insertion idempotente (conflit = même relevé réimporté).
  const parEmpreinte = new Map(lignes.map((l) => [l.empreinte, l]));
  const rows = [...parEmpreinte.values()].map((l) => ({
    userId: ownerId,
    source: (format === 'ofx' ? 'import_ofx' : 'import_csv') as 'import_ofx' | 'import_csv',
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
    },
  };
});
