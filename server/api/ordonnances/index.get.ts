import { z } from 'zod';
import { eq, desc, gte, and } from 'drizzle-orm';
import { ordonnances, veterinaires } from '~~/server/database/schema';

const querySchema = z.object({
  filtre: z.enum(['actives', 'passees', 'toutes']).default('actives'),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const baseCondition = eq(ordonnances.userId, user.id);

  let rows;

  if (query.filtre === 'actives') {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    rows = await db
      .select({
        ordonnance: ordonnances,
        veterinaire: { nomComplet: veterinaires.nomComplet, cabinet: veterinaires.cabinet },
      })
      .from(ordonnances)
      .leftJoin(veterinaires, eq(ordonnances.veterinaireId, veterinaires.id))
      .where(and(baseCondition, gte(ordonnances.datePrescription, oneYearAgo)))
      .orderBy(desc(ordonnances.datePrescription));
  } else {
    rows = await db
      .select({
        ordonnance: ordonnances,
        veterinaire: { nomComplet: veterinaires.nomComplet, cabinet: veterinaires.cabinet },
      })
      .from(ordonnances)
      .leftJoin(veterinaires, eq(ordonnances.veterinaireId, veterinaires.id))
      .where(baseCondition)
      .orderBy(desc(ordonnances.datePrescription));
  }

  // Aplatir le résultat
  const result = rows.map((row) => ({
    ...row.ordonnance,
    veterinaireNom: row.veterinaire?.nomComplet ?? null,
    veterinaireCabinet: row.veterinaire?.cabinet ?? null,
    // Calculer si délai d'attente est actif
    enDelaiAttente: (() => {
      const prescription = new Date(row.ordonnance.datePrescription);
      const finDelai = new Date(prescription);
      finDelai.setDate(
        finDelai.getDate() +
          (row.ordonnance.dureeTraitementJours ?? 0) +
          row.ordonnance.delaiAttenteAvantRecolteJours,
      );
      return finDelai > new Date();
    })(),
    dateFinDelaiAttente: (() => {
      const prescription = new Date(row.ordonnance.datePrescription);
      const finDelai = new Date(prescription);
      finDelai.setDate(
        finDelai.getDate() +
          (row.ordonnance.dureeTraitementJours ?? 0) +
          row.ordonnance.delaiAttenteAvantRecolteJours,
      );
      return finDelai.toISOString();
    })(),
  }));

  return { data: result };
});
