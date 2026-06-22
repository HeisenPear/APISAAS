import { z } from 'zod';
import { reinesElevage } from '~~/server/database/schema';

const schema = z.object({
  rucheId: z.string().uuid().nullable().optional(),
  ligneeId: z.string().uuid().nullable().optional(),
  reineMereId: z.string().uuid().nullable().optional(),
  identifiant: z.string().max(100).trim().optional(),
  couleurMarquage: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).optional(),
  anneeNaissance: z.coerce.number().int().min(1990).max(2100).optional(),
  dateIntroduction: z.string().datetime().nullable().optional(),
  origine: z.enum(['elevage_propre', 'achat', 'capture_essaim']).optional(),
  fournisseur: z.string().max(255).trim().nullable().optional(),
  estInsemine: z.boolean().optional(),
  stationFecondation: z.string().max(255).trim().nullable().optional(),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db
    .insert(reinesElevage)
    .values({
      ...body,
      dateIntroduction: body.dateIntroduction ? new Date(body.dateIntroduction) : null,
      userId: user.id,
    })
    .returning();

  if (!row) internalError('Erreur création reine');
  setResponseStatus(event, 201);
  return { data: row };
});
