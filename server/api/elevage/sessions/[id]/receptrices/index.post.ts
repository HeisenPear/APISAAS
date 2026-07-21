import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sessionsGreffage, receptricesGreffage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

// Deux façons de créer des récepteurs : un lot explicite (identifiants
// personnalisés), ou une génération rapide en série ("Ruchette 1..N") —
// c'est le vrai "greffage en lot" : on scanne/pose N cellules d'un coup.
const explicites = z.object({
  receptrices: z
    .array(z.object({ identifiantReceptrice: z.string().min(1).max(100).trim() }))
    .min(1)
    .max(200),
});
const enSerie = z.object({
  count: z.coerce.number().int().min(1).max(200),
  prefix: z.string().min(1).max(50).trim().default('Ruchette'),
});
const schema = z.union([explicites, enSerie]);

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const sessionId = getRouterParam(event, 'id');
  if (!sessionId) badRequest('ID manquant');
  uuidSchema.parse(sessionId);
  const body = await readValidatedBody(event, schema.parse);

  const [session] = await db
    .select({ id: sessionsGreffage.id })
    .from(sessionsGreffage)
    .where(and(eq(sessionsGreffage.id, sessionId!), eq(sessionsGreffage.userId, ownerId)))
    .limit(1);
  if (!session) notFound('Session introuvable');

  const identifiants =
    'receptrices' in body
      ? body.receptrices.map((r) => r.identifiantReceptrice)
      : Array.from({ length: body.count }, (_, i) => `${body.prefix} ${i + 1}`);

  const rows = await db
    .insert(receptricesGreffage)
    .values(
      identifiants.map((identifiantReceptrice) => ({
        userId: ownerId,
        sessionId: sessionId!,
        identifiantReceptrice,
      })),
    )
    .returning();

  setResponseStatus(event, 201);
  return { data: rows };
});
