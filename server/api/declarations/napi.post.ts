import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { declarationsNapi } from '~~/server/database/schema';

const schema = z.object({
  annee: z.number().int().min(2020).max(2100),
  dateDeclaration: z.string().datetime(),
  nombreTotalColonies: z.number().int().min(0),
  nombreRuchesProduction: z.number().int().min(0).default(0),
  nombreRuchettes: z.number().int().min(0).default(0),
  nombreNuclei: z.number().int().min(0).default(0),
  ruchersData: z.array(z.object({
    rucherId: z.string().uuid(),
    nom: z.string(),
    commune: z.string(),
    nbColonies: z.number().int().min(0),
  })),
  statut: z.enum(['brouillon', 'enregistre', 'recepisse_recu']).default('enregistre'),
  notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  // Upsert par année
  const existing = await db
    .select({ id: declarationsNapi.id })
    .from(declarationsNapi)
    .where(and(eq(declarationsNapi.userId, user.id), eq(declarationsNapi.annee, body.annee)))
    .limit(1);

  const now = new Date();
  let result;

  if (existing.length > 0) {
    const [updated] = await db
      .update(declarationsNapi)
      .set({ ...body, dateDeclaration: new Date(body.dateDeclaration), updatedAt: now })
      .where(eq(declarationsNapi.id, existing[0]!.id))
      .returning();
    result = updated;
  } else {
    const [inserted] = await db
      .insert(declarationsNapi)
      .values({ ...body, dateDeclaration: new Date(body.dateDeclaration), userId: user.id })
      .returning();
    result = inserted;
    setResponseStatus(event, 201);
  }

  return { data: result };
});
