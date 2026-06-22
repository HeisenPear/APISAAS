import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { emplacements } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  nom: z.string().min(1).max(255).trim().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  adresse: z.string().max(500).trim().nullable().optional(),
  commune: z.string().max(255).trim().nullable().optional(),
  codePostal: z.string().max(10).trim().nullable().optional(),
  altitudeMetres: z.coerce.number().int().nullable().optional(),
  capaciteMaxRuches: z.coerce.number().int().min(1).nullable().optional(),
  mielleesPrincipales: z.array(z.string()).nullable().optional(),
  proprietaireTerrain: z.string().max(255).trim().nullable().optional(),
  proprietaireTelephone: z.string().max(50).trim().nullable().optional(),
  accordSigne: z.boolean().optional(),
  loyerAnnuelEuros: z.coerce.number().min(0).nullable().optional(),
  loyerEnMielKg: z.coerce.number().min(0).nullable().optional(),
  accesDifficulte: z.enum(['facile', 'moyen', 'difficile']).nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
  estActif: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, schema.parse);

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.latitude !== undefined) updates.latitude = body.latitude?.toString();
  if (body.longitude !== undefined) updates.longitude = body.longitude?.toString();
  if (body.loyerAnnuelEuros !== undefined)
    updates.loyerAnnuelEuros = body.loyerAnnuelEuros?.toString() ?? null;
  if (body.loyerEnMielKg !== undefined)
    updates.loyerEnMielKg = body.loyerEnMielKg?.toString() ?? null;

  const [row] = await db
    .update(emplacements)
    .set(updates)
    .where(and(eq(emplacements.id, id!), eq(emplacements.userId, user.id)))
    .returning();
  if (!row) notFound('Emplacement introuvable');
  return { data: row };
});
