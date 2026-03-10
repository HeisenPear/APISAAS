import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { organisations, campagnesCommande } from '~~/server/database/schema';

const createCampagneSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  dateOuverture: z.string().datetime("Date d'ouverture invalide"),
  dateFermeture: z.string().datetime('Date de fermeture invalide'),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createCampagneSchema.parse);

  // Verify user owns an organisation
  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.ownerId, user.id))
    .limit(1);

  if (!org) {
    badRequest('Vous devez creer une organisation avant de lancer une campagne');
  }

  const tokenPublic = crypto.randomUUID();

  const [campagne] = await db
    .insert(campagnesCommande)
    .values({
      organisationId: org.id,
      nom: body.nom,
      description: body.description,
      dateOuverture: new Date(body.dateOuverture),
      dateFermeture: new Date(body.dateFermeture),
      notes: body.notes,
      tokenPublic,
    })
    .returning();

  if (!campagne) {
    internalError('Erreur lors de la creation de la campagne');
  }

  setResponseStatus(event, 201);
  return { data: campagne };
});
