import { z } from 'zod';
import { interventions } from '~~/server/database/schema';

const rdvProSchema = z.object({
  date: z.coerce.date(),
  typeRdv: z.enum(['veterinaire', 'syndicat', 'fournisseur', 'client', 'administration', 'autre']),
  contact: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  rucherId: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, rdvProSchema.parse);

  const [created] = await db
    .insert(interventions)
    .values({
      userId: user.id,
      rucheId: null,
      rucherId: body.rucherId ?? null,
      dateVisite: body.date,
      type: 'rendez_vous_pro',
      donnees: { typeRdv: body.typeRdv, contact: body.contact ?? '' },
      notes: body.notes ?? null,
      photos: [],
    })
    .returning();

  if (!created) return internalError('Erreur lors de la creation');

  setResponseStatus(event, 201);
  return { data: created };
});
