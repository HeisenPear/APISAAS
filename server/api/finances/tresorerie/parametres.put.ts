import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

const schema = z.object({
  // Solde de trésorerie de départ, saisi une fois puis PERSISTÉ.
  soldeActuel: z.number().finite().min(-100_000_000).max(100_000_000),
});

/**
 * Persiste le solde de trésorerie du propriétaire de l'espace dans
 * `profils.preferences.tresorerie` (merge non destructif). La date d'enregistrement
 * est posée côté serveur → « Solde au JJ/MM/AAAA ». Écriture gated domaine `commerce`.
 */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { soldeActuel } = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .select({ preferences: profils.preferences })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  if (!row) notFound('Profil introuvable');

  const tresorerie = { solde: soldeActuel, soldeDate: new Date().toISOString() };
  const preferences = { ...(row.preferences ?? {}), tresorerie };

  await db
    .update(profils)
    .set({ preferences, updatedAt: new Date() })
    .where(eq(profils.id, ownerId));

  return { data: tresorerie };
});
