import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

const rucheItemSchema = z.object({
  rucherId: z.string().uuid('rucherId invalide'),
  numero: z.string().min(1, 'Le numero est requis').max(100).trim(),
  type: z.enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot', 'kenyane', 'autre']),
  statut: z
    .enum(['active', 'faible', 'orpheline', 'essaimee', 'morte', 'vendue', 'fusionnee'])
    .default('active'),
  raceAbeille: z
    .enum(['noire', 'buckfast', 'carnica', 'italienne', 'caucasienne', 'hybride', 'inconnue'])
    .default('inconnue'),
  dateInstallation: z.coerce.date().optional(),
});

const createSingleSchema = rucheItemSchema;

const createBatchSchema = z.object({
  ruches: z.array(rucheItemSchema).min(1, 'Au moins une ruche est requise').max(200),
});

const createRucheSchema = z.union([createBatchSchema, createSingleSchema]);

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, createRucheSchema.parse);

  // Determine if batch or single creation
  const isBatch = 'ruches' in body;
  const items = isBatch ? body.ruches : [body];

  // Collect unique rucherIds to verify ownership
  const rucherIds = [...new Set(items.map((item) => item.rucherId))];

  // Verify all referenced ruchers belong to the user
  const ownedRuchers = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(inArray(ruchers.id, rucherIds), eq(ruchers.userId, user.id)));

  const ownedRucherIds = new Set(ownedRuchers.map((r) => r.id));
  const unauthorizedIds = rucherIds.filter((id) => !ownedRucherIds.has(id));

  if (unauthorizedIds.length > 0) {
    badRequest(`Rucher(s) introuvable(s) ou non autorise(s): ${unauthorizedIds.join(', ')}`);
  }

  // Prepare values for insertion
  const values = items.map((item) => ({
    userId: user.id,
    rucherId: item.rucherId,
    numero: item.numero,
    type: item.type,
    statut: item.statut,
    raceAbeille: item.raceAbeille,
    dateInstallation: item.dateInstallation ?? null,
  }));

  const newRuches = await db.insert(ruches).values(values).returning();

  if (newRuches.length === 0) {
    internalError('Erreur lors de la creation de la/des ruche(s)');
  }

  setResponseStatus(event, 201);
  return { data: isBatch ? newRuches : newRuches[0] };
});
