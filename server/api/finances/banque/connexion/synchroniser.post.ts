import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { connexionsBancaires, mouvementsBancaires } from '~~/server/database/schema';
import {
  gocardlessActif,
  recupererRequisition,
  recupererTransactions,
} from '~~/server/utils/gocardless';

// Synchronise les transactions des connexions liées vers mouvements_bancaires (source
// 'agregateur'), dédoublonnées par empreinte. Réutilise le même format que l'import CSV/OFX,
// donc le moteur de rapprochement fonctionne à l'identique.
const schema = z.object({ connexionId: z.string().uuid().optional() });

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  if (!gocardlessActif()) {
    throw createError({
      statusCode: 501,
      message: 'Connexion bancaire automatique non configurée',
    });
  }
  const { connexionId } = await readValidatedBody(event, schema.parse);

  const conns = await db
    .select()
    .from(connexionsBancaires)
    .where(
      and(
        eq(connexionsBancaires.userId, ownerId),
        connexionId ? eq(connexionsBancaires.id, connexionId) : undefined,
      ),
    );

  let importes = 0;
  let liees = 0;
  for (const conn of conns) {
    const req = await recupererRequisition(conn.requisitionId).catch(() => null);
    if (!req || (req.status !== 'LN' && (req.accounts?.length ?? 0) === 0)) continue;
    liees++;
    await db
      .update(connexionsBancaires)
      .set({ statut: 'liee', accountIds: req.accounts, derniereSync: new Date() })
      .where(eq(connexionsBancaires.id, conn.id));

    for (const accountId of req.accounts) {
      const lignes = await recupererTransactions(accountId).catch(() => []);
      if (lignes.length === 0) continue;
      const rows = lignes.map((l) => ({
        userId: ownerId,
        source: 'agregateur' as const,
        dateOperation: new Date(l.date),
        montant: l.montant.toFixed(2),
        libelle: l.libelle,
        reference: l.reference ?? null,
        empreinte: l.empreinte,
      }));
      const inserted = await db
        .insert(mouvementsBancaires)
        .values(rows)
        .onConflictDoNothing({
          target: [mouvementsBancaires.userId, mouvementsBancaires.empreinte],
        })
        .returning({ id: mouvementsBancaires.id });
      importes += inserted.length;
    }
  }

  return { data: { importes, liees } };
});
