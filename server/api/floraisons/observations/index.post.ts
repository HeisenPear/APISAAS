import { z } from 'zod';
import { eq, and, gte, sql } from 'drizzle-orm';
import { observationsFloraison } from '~~/server/database/schema';

/** Anti-flood : au-delà, c'est du bruit, pas de l'observation. */
const MAX_OBSERVATIONS_PAR_JOUR = 20;

const bodySchema = z.object({
  espece: z.string().min(2).max(120),
  floraisonId: z.string().uuid().nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  commune: z.string().max(120).nullish(),
  dateObservation: z.coerce.date().default(() => new Date()),
  stade: z.enum(['demarrage', 'pleine', 'fin', 'terminee']).default('demarrage'),
  intensite: z.enum(['faible', 'moyenne', 'forte']).default('moyenne'),
  notes: z.string().max(2000).nullish(),
});

/**
 * POST /api/floraisons/observations — partage une floraison observée avec la
 * communauté. Pas de dédoublonnage géographique (contrairement au frelon) :
 * plusieurs apiculteurs signalant la même floraison au même endroit, c'est un
 * SIGNAL de confirmation, pas un doublon à écraser.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(observationsFloraison)
    .where(
      and(
        eq(observationsFloraison.auteurId, user.id),
        gte(observationsFloraison.createdAt, depuis),
      ),
    );

  if (n >= MAX_OBSERVATIONS_PAR_JOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop d’observations',
      message: `Limite de ${MAX_OBSERVATIONS_PAR_JOUR} observations/jour atteinte.`,
    });
  }

  const [created] = await db
    .insert(observationsFloraison)
    .values({
      auteurId: user.id,
      espece: body.espece,
      floraisonId: body.floraisonId ?? null,
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      commune: body.commune ?? null,
      dateObservation: body.dateObservation,
      stade: body.stade,
      intensite: body.intensite,
      notes: body.notes ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
