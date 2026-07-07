import { asc } from 'drizzle-orm';
import { floraisonsReferentiel } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  // Donnée de référence globale mais réservée aux utilisateurs authentifiés
  // (cohérence avec les autres routes — pas de surface non authentifiée).
  await requireAuth(event);
  const rows = await db
    .select()
    .from(floraisonsReferentiel)
    .orderBy(asc(floraisonsReferentiel.moisDebut));
  return { data: rows };
});
