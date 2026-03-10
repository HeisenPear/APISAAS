import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  rucherId: z.string().uuid('rucherId invalide').optional(),
  statut: z
    .enum(['active', 'faible', 'orpheline', 'essaimee', 'morte', 'vendue', 'fusionnee'])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, rucherId, statut } = query;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(ruches.userId, user.id)];

  if (rucherId) {
    conditions.push(eq(ruches.rucherId, rucherId));
  }

  if (statut) {
    conditions.push(eq(ruches.statut, statut));
  }

  if (search) {
    conditions.push(sql`${ruches.numero} ILIKE ${'%' + escapeIlike(search) + '%'}`);
  }

  const where = and(...conditions);

  // Helper: last CONTROLE intervention only (health scoring)
  const fromLastIntervention = <T>(col: string) => sql<T>`(
    select ${sql.raw(col)} from interventions
    where ruche_id = ${ruches.id}
      and type = 'controle'
    order by date_visite desc
    limit 1
  )`;

  // Run data query (with rucher join) and count in parallel
  const [rawData, [countResult]] = await Promise.all([
    db
      .select({
        id: ruches.id,
        userId: ruches.userId,
        rucherId: ruches.rucherId,
        numero: ruches.numero,
        type: ruches.type,
        statut: ruches.statut,
        raceAbeille: ruches.raceAbeille,
        qualiteReine: ruches.qualiteReine,
        dateInstallation: ruches.dateInstallation,
        origineEssaim: ruches.origineEssaim,
        marquageReine: ruches.marquageReine,
        nombreCadres: ruches.nombreCadres,
        nombreHausses: ruches.nombreHausses,
        notes: ruches.notes,
        photoUrl: ruches.photoUrl,
        createdAt: ruches.createdAt,
        updatedAt: ruches.updatedAt,
        rucherNom: ruchers.nom,
        // Last intervention fields for health score computation
        lastDateVisite: fromLastIntervention<string | null>('date_visite'),
        lastForceColonie: fromLastIntervention<number | null>('force_colonie'),
        lastCouvain: fromLastIntervention<number | null>('couvain'),
        lastReserves: fromLastIntervention<number | null>('reserves'),
        lastReineVue: fromLastIntervention<boolean | null>('reine_vue'),
        lastVarroa: fromLastIntervention<number | null>('varroa'),
        lastComportement: fromLastIntervention<string | null>('comportement'),
        lastSigneEssaimage: fromLastIntervention<boolean | null>('signe_essaimage'),
        lastMaladieObservee: fromLastIntervention<string | null>('maladie_observee'),
      })
      .from(ruches)
      .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
      .where(where)
      .orderBy(ruches.numero)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruches)
      .where(where),
  ]);

  const total = countResult?.total ?? 0;

  // Compute real health score for each ruche
  const data = rawData.map((r) => {
    const santeScore = computeScore({
      rucheId: r.id,
      numero: r.numero,
      rucherId: r.rucherId,
      statut: r.statut,
      qualiteReine: r.qualiteReine ?? null,
      dateVisite: r.lastDateVisite ?? null,
      forceColonie: r.lastForceColonie ?? null,
      couvain: r.lastCouvain ?? null,
      reserves: r.lastReserves ?? null,
      reineVue: r.lastReineVue ?? null,
      varroa: r.lastVarroa ?? null,
      comportement: r.lastComportement ?? null,
      signeEssaimage: r.lastSigneEssaimage ?? null,
      maladieObservee: r.lastMaladieObservee ?? null,
    });
    const {
      lastDateVisite,
      lastCouvain,
      lastReserves,
      lastReineVue,
      lastVarroa,
      lastComportement,
      lastSigneEssaimage,
      lastMaladieObservee,
      ...rest
    } = r;
    return { ...rest, santeScore };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
