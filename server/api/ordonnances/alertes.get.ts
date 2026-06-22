import { eq } from 'drizzle-orm';
import { ordonnances } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  const now = new Date();

  const all = await db.select().from(ordonnances).where(eq(ordonnances.userId, user.id));

  // Filtrer celles où le délai d'attente est encore actif
  const actives = all
    .filter((ord) => {
      const prescription = new Date(ord.datePrescription);
      const finDelai = new Date(prescription);
      finDelai.setDate(
        finDelai.getDate() + (ord.dureeTraitementJours ?? 0) + ord.delaiAttenteAvantRecolteJours,
      );
      return finDelai > now;
    })
    .map((ord) => {
      const prescription = new Date(ord.datePrescription);
      const finDelai = new Date(prescription);
      finDelai.setDate(
        finDelai.getDate() + (ord.dureeTraitementJours ?? 0) + ord.delaiAttenteAvantRecolteJours,
      );
      return {
        ...ord,
        dateFinDelaiAttente: finDelai.toISOString(),
        ruchesConcernees: (ord.ruchesConcernees as string[]) ?? [],
      };
    });

  return { data: actives };
});
