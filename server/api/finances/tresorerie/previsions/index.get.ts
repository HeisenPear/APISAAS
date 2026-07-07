import { eq, asc } from 'drizzle-orm';
import { previsionsTresorerie } from '~~/server/database/schema';

/** Liste des postes planifiés (dépenses / investissements / recettes) de l'espace. */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  // Tolérant : si la table n'est pas encore migrée, on renvoie une liste vide
  // plutôt qu'un 500 (la page reste utilisable, l'écriture appliquera la migration).
  try {
    const rows = await db
      .select({
        id: previsionsTresorerie.id,
        libelle: previsionsTresorerie.libelle,
        montant: previsionsTresorerie.montant,
        type: previsionsTresorerie.type,
        recurrence: previsionsTresorerie.recurrence,
        datePrevue: previsionsTresorerie.datePrevue,
        notes: previsionsTresorerie.notes,
      })
      .from(previsionsTresorerie)
      .where(eq(previsionsTresorerie.userId, ownerId))
      .orderBy(asc(previsionsTresorerie.datePrevue));

    return { data: rows };
  } catch (err) {
    console.warn('[previsions] table indisponible (migration ?)', String(err));
    return { data: [] };
  }
});
