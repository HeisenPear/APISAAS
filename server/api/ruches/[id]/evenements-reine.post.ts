import { eq, and } from 'drizzle-orm';
import { ruches, evenementsReine, interventions, alertes } from '~~/server/database/schema';
import { createEvenementReineSchema } from '~~/server/utils/validation/reine';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const rucheId = getRouterParam(event, 'id');
  if (!rucheId) badRequest('ID manquant');
  uuidSchema.parse(rucheId);

  const body = await readValidatedBody(event, createEvenementReineSchema.parse);

  // Vérification ownership
  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, rucheId), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  // Valider l'ownership de l'interventionId si fourni (IDOR protection)
  let validatedInterventionId: string | null = null;
  if (body.interventionId) {
    const [iv] = await db
      .select({ id: interventions.id })
      .from(interventions)
      .where(and(eq(interventions.id, body.interventionId), eq(interventions.userId, user.id)))
      .limit(1);
    if (!iv) badRequest('Intervention introuvable ou non autorisée');
    validatedInterventionId = iv.id;
  }

  const [evenement] = await db
    .insert(evenementsReine)
    .values({
      userId: user.id,
      rucheId,
      interventionId: validatedInterventionId,
      typeEvenement: body.typeEvenement,
      dateEvenement: new Date(body.dateEvenement),
      couleur: body.couleur ?? null,
      origine: body.origine ?? null,
      actionOrpheline: body.actionOrpheline ?? null,
      qualitePonte: body.qualitePonte ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  // Mise à jour automatique des champs reine sur la ruche
  const reineUpdate: Partial<typeof ruches.$inferInsert> = { updatedAt: new Date() };
  if (body.couleur) reineUpdate.reineCouleur = body.couleur;
  if (body.origine) reineUpdate.reineOrigine = body.origine;
  if (body.typeEvenement === 'introduction' || body.typeEvenement === 'remplacement') {
    reineUpdate.reinePresente = true;
    reineUpdate.reineDateIntroduction = new Date(body.dateEvenement);
    if (body.origine) reineUpdate.reineOrigine = body.origine;
    if (body.couleur) reineUpdate.reineCouleur = body.couleur;
    if (body.race) reineUpdate.reineRace = body.race;
  }
  if (body.typeEvenement === 'perte') {
    reineUpdate.reinePresente = false;
    await db.insert(alertes).values({
      userId: user.id,
      type: 'reine_perdue',
      titre: 'Reine perdue',
      message: `La reine de la ruche est absente. Intervention requise.`,
      priorite: 'haute',
      referenceType: 'ruche',
      referenceId: rucheId,
      actionUrl: `/ruches/${rucheId}`,
    });
  }

  await db
    .update(ruches)
    .set(reineUpdate)
    .where(and(eq(ruches.id, rucheId), eq(ruches.userId, user.id)));

  return { data: evenement };
});
