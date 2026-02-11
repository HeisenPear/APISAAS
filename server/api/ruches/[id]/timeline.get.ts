import { eq, and, desc } from 'drizzle-orm';
import { ruches, inspections, recoltes } from '~~/server/database/schema';

interface TimelineEntry {
  id: string;
  type: 'inspection' | 'recolte';
  date: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Verify ruche ownership
  const [ruche] = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  // Fetch inspections and recoltes in parallel
  const [inspectionRows, recolteRows] = await Promise.all([
    db
      .select()
      .from(inspections)
      .where(and(eq(inspections.rucheId, id), eq(inspections.userId, user.id)))
      .orderBy(desc(inspections.dateVisite)),
    db
      .select()
      .from(recoltes)
      .where(and(eq(recoltes.rucheId, id), eq(recoltes.userId, user.id)))
      .orderBy(desc(recoltes.dateRecolte)),
  ]);

  // Map inspections to timeline entries
  const inspectionEntries: TimelineEntry[] = inspectionRows.map((i) => ({
    id: i.id,
    type: 'inspection',
    date: i.dateVisite.toISOString(),
    title: formatInspectionTitle(i.type),
    description: i.notes,
    metadata: {
      forceColonie: i.forceColonie,
      couvain: i.couvain,
      reserves: i.reserves,
      reineVue: i.reineVue,
      varroa: i.varroa,
      traitementApplique: i.traitementApplique,
      comportement: i.comportement,
      dureeMinutes: i.dureeMinutes,
    },
  }));

  // Map recoltes to timeline entries
  const recolteEntries: TimelineEntry[] = recolteRows.map((r) => ({
    id: r.id,
    type: 'recolte',
    date: r.dateRecolte.toISOString(),
    title: `Recolte${r.typeMiel ? ` — ${r.typeMiel}` : ''}`,
    description: r.notes,
    metadata: {
      typeMiel: r.typeMiel,
      quantiteKg: r.quantiteKg,
      humidite: r.humidite,
      nombreHausses: r.nombreHausses,
      numeroLot: r.numeroLot,
    },
  }));

  // Merge and sort by date descending
  const allEntries = [...inspectionEntries, ...recolteEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const total = allEntries.length;
  const paginatedData = allEntries.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});

function formatInspectionTitle(type: string | null): string {
  const labels: Record<string, string> = {
    visite_printemps: 'Visite de printemps',
    controle: 'Controle',
    traitement: 'Traitement',
    recolte: 'Visite recolte',
    hivernage: 'Mise en hivernage',
  };
  return type ? (labels[type] ?? type) : 'Inspection';
}
