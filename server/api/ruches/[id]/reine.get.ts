import { eq, and, desc } from 'drizzle-orm';
import { ruches, evenementsReine } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Vérification ownership
  const [ruche] = await db
    .select({
      id: ruches.id,
      reinePresente: ruches.reinePresente,
      reineCouleur: ruches.reineCouleur,
      reineAnnee: ruches.reineAnnee,
      reineRace: ruches.reineRace,
      reineOrigine: ruches.reineOrigine,
      reineDateIntroduction: ruches.reineDateIntroduction,
      reineQualitePonte: ruches.reineQualitePonte,
      reineDouceur: ruches.reineDouceur,
      reineProlificite: ruches.reineProlificite,
    })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  const evenements = await db
    .select()
    .from(evenementsReine)
    .where(and(eq(evenementsReine.rucheId, id), eq(evenementsReine.userId, user.id)))
    .orderBy(desc(evenementsReine.dateEvenement))
    .limit(50);

  return { data: { ruche, evenements } };
});
