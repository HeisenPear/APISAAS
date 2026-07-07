import { desc } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';

/** Liste des demandes de démo + compteurs par statut. Admin uniquement. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const demandes = await db.select().from(demandesDemo).orderBy(desc(demandesDemo.createdAt));

  const stats = {
    total: demandes.length,
    nouveau: demandes.filter((d) => d.statut === 'nouveau').length,
    contacte: demandes.filter((d) => d.statut === 'contacte').length,
    planifie: demandes.filter((d) => d.statut === 'planifie').length,
    realise: demandes.filter((d) => d.statut === 'realise').length,
    annule: demandes.filter((d) => d.statut === 'annule').length,
  };

  return { data: demandes, stats };
});
