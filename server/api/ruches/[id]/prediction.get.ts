import { eq, and, desc } from 'drizzle-orm';
import { ruches, interventions } from '~~/server/database/schema';
import { predictSante } from '~~/server/utils/santePredictive';
import type { InspectionRow } from '~~/server/utils/santeScore';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Ownership check
  const [ruche] = await db
    .select({
      id: ruches.id,
      statut: ruches.statut,
      qualiteReine: ruches.qualiteReine,
      numero: ruches.numero,
      rucherId: ruches.rucherId,
    })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .limit(1);

  if (!ruche) notFound('Ruche introuvable');

  // Fetch last 5 interventions
  const rows = await db
    .select({
      dateVisite: interventions.dateVisite,
      forceColonie: interventions.forceColonie,
      couvain: interventions.couvain,
      reserves: interventions.reserves,
      reineVue: interventions.reineVue,
      varroa: interventions.varroa,
      comportement: interventions.comportement,
      signeEssaimage: interventions.signeEssaimage,
      maladieObservee: interventions.maladieObservee,
    })
    .from(interventions)
    .where(eq(interventions.rucheId, id))
    .orderBy(desc(interventions.dateVisite))
    .limit(5);

  const toRow = (r: (typeof rows)[0]): InspectionRow => ({
    rucheId: id,
    numero: ruche.numero,
    rucherId: ruche.rucherId,
    statut: ruche.statut,
    qualiteReine: ruche.qualiteReine ?? null,
    dateVisite: r.dateVisite ? String(r.dateVisite) : null,
    forceColonie: r.forceColonie ?? null,
    couvain: r.couvain ?? null,
    reserves: r.reserves ?? null,
    reineVue: r.reineVue ?? null,
    varroa: r.varroa ?? null,
    comportement: r.comportement ?? null,
    signeEssaimage: r.signeEssaimage ?? null,
    maladieObservee: r.maladieObservee ?? null,
  });

  const mappedRows = rows.map(toRow);
  const prediction = predictSante(mappedRows, mappedRows);

  return { data: prediction };
});
