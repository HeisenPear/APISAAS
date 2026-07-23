import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { conditionnements, recoltes } from '~~/server/database/schema';

// Route MUTUALISÉE (contrainte de budget Nitro) : la mise en pot d'un lot passe
// par un PUT sur le lot lui-même, en upsert (un conditionnement par lot). Pas de
// route dédiée supplémentaire.
const schema = z.object({
  dateConditionnement: z.coerce.date().optional(),
  nombrePots: z.number().int().min(0).max(1_000_000).nullable().optional(),
  poidsPotG: z.number().int().min(0).max(100_000).nullable().optional(),
  teneurEauPct: z.coerce.number().min(0).max(100).nullable().optional(),
  hmfMgKg: z.coerce.number().min(0).max(10_000).nullable().optional(),
  dluo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)')
    .nullable()
    .optional(),
  circuitCourt: z.boolean().optional(),
  traitementsDoux: z.boolean().optional(),
  environnementPreserve: z.boolean().optional(),
  nourriSucre: z.boolean().optional(),
  distanceTranshumanceKm: z.coerce.number().min(0).max(100_000).optional(),
  notes: z.string().max(5000).trim().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const numero = decodeURIComponent(getRouterParam(event, 'numero') ?? '');
  if (!numero) badRequest('Numero de lot manquant');
  const body = await readValidatedBody(event, schema.parse);

  // Le lot doit exister (≥ 1 récolte) et appartenir à l'espace.
  const [lot] = await db
    .select({ id: recoltes.id })
    .from(recoltes)
    .where(and(eq(recoltes.userId, ownerId), eq(recoltes.numeroLot, numero)))
    .limit(1);
  if (!lot) notFound('Lot introuvable');

  const valeurs = {
    dateConditionnement: body.dateConditionnement ?? new Date(),
    nombrePots: body.nombrePots ?? null,
    poidsPotG: body.poidsPotG ?? null,
    teneurEauPct: body.teneurEauPct != null ? body.teneurEauPct.toString() : null,
    hmfMgKg: body.hmfMgKg != null ? body.hmfMgKg.toString() : null,
    dluo: body.dluo ?? null,
    circuitCourt: body.circuitCourt ?? false,
    traitementsDoux: body.traitementsDoux ?? false,
    environnementPreserve: body.environnementPreserve ?? false,
    nourriSucre: body.nourriSucre ?? false,
    distanceTranshumanceKm: (body.distanceTranshumanceKm ?? 0).toString(),
    notes: body.notes ?? null,
    updatedAt: new Date(),
  };

  const [saved] = await db
    .insert(conditionnements)
    .values({ userId: ownerId, numeroLot: numero, ...valeurs })
    .onConflictDoUpdate({
      target: [conditionnements.userId, conditionnements.numeroLot],
      set: valeurs,
    })
    .returning();

  return { data: saved };
});
