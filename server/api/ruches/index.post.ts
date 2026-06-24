import { z } from 'zod';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { ruches, ruchers, profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { getLimit, getPlanConfig, minimumPlanForLimit, type Plan } from '~~/app/config/plans';

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
  // Plafond élevé pour les grosses exploitations (500-1100+ ruches) — un seul INSERT.
  ruches: z.array(rucheItemSchema).min(1, 'Au moins une ruche est requise').max(2000),
});

const createRucheSchema = z.union([createBatchSchema, createSingleSchema]);

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
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
    .where(and(inArray(ruchers.id, rucherIds), eq(ruchers.userId, ownerId)));

  const ownedRucherIds = new Set(ownedRuchers.map((r) => r.id));
  const unauthorizedIds = rucherIds.filter((id) => !ownedRucherIds.has(id));

  if (unauthorizedIds.length > 0) {
    badRequest(`Rucher(s) introuvable(s) ou non autorise(s): ${unauthorizedIds.join(', ')}`);
  }

  // Limite de plan AWARE du batch : le middleware ne connaît pas la taille du lot,
  // il faut donc vérifier ici que (ruches actives + nouvelles) ne dépasse pas le plan.
  if (!isAdminEmail(user.email)) {
    const [profil] = await db
      .select({ plan: profils.plan })
      .from(profils)
      .where(eq(profils.id, ownerId))
      .limit(1);
    const plan = (profil?.plan ?? 'decouverte') as Plan;
    const max = getLimit(plan, 'ruches');
    if (max !== Infinity) {
      const [c] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ruches)
        .where(
          and(
            eq(ruches.userId, ownerId),
            sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
          ),
        );
      const current = c?.count ?? 0;
      const aCreer = items.filter(
        (i) => !['morte', 'vendue', 'fusionnee'].includes(i.statut),
      ).length;
      if (current + aCreer > max) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Limite du plan atteinte',
          data: {
            code: 'LIMIT_REACHED',
            limit: 'ruches',
            current,
            max,
            requiredPlan: minimumPlanForLimit('ruches', current + aCreer),
            message: `Cette création (${aCreer}) dépasserait la limite de ${max} ruches du plan ${getPlanConfig(plan).label} (vous en avez déjà ${current}). Passez à un plan supérieur pour gérer de grosses exploitations.`,
          },
        });
      }
    }
  }

  // Prepare values for insertion
  const values = items.map((item) => ({
    userId: ownerId,
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
