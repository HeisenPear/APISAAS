import { z } from 'zod';
import { eq, desc, gte, and } from 'drizzle-orm';
import { ordonnances, veterinaires } from '~~/server/database/schema';
import { moisDecaleParis } from '~~/server/utils/horloge';

const querySchema = z.object({
  filtre: z.enum(['actives', 'passees', 'toutes']).default('actives'),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const baseCondition = eq(ordonnances.userId, ownerId);

  let rows;

  if (query.filtre === 'actives') {
    const now = new Date();
    // `new Date(annee - 1, mois, jour)` ne borne pas le jour : un 29 février
    // devenait un 1er mars. Et il lisait les trois composantes sur le serveur.
    const oneYearAgo = moisDecaleParis(now, -12);
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
