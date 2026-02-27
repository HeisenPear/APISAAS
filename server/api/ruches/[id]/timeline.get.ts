import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { ruches, interventions, recoltes } from '~~/server/database/schema';

interface TimelineEntry {
  id: string;
  type: 'intervention' | 'recolte';
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

  // Fetch interventions and recoltes in parallel
  const [interventionRows, recolteRows] = await Promise.all([
    db
      .select({
        id: interventions.id,
        dateVisite: interventions.dateVisite,
        type: interventions.type,
        notes: interventions.notes,
        donnees: interventions.donnees,
        dureeMinutes: interventions.dureeMinutes,
      })
      .from(interventions)
      .where(
        and(
          eq(interventions.rucheId, id),
          eq(interventions.userId, user.id),
          isNotNull(interventions.donnees),
        ),
      )
      .orderBy(desc(interventions.dateVisite)),
    db
      .select()
      .from(recoltes)
      .where(and(eq(recoltes.rucheId, id), eq(recoltes.userId, user.id)))
      .orderBy(desc(recoltes.dateRecolte)),
  ]);

  const interventionEntries: TimelineEntry[] = interventionRows.map((i) => ({
    id: i.id,
    type: 'intervention' as const,
    date: i.dateVisite.toISOString(),
    title: formatInterventionTitle(i.type),
    description: i.notes,
    metadata: {
      interventionType: i.type,
      summary: formatInterventionSummary(i.type, i.donnees as Record<string, unknown>),
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
  const allEntries = [...interventionEntries, ...recolteEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const total = allEntries.length;
  const paginatedData = allEntries.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});

const INTERVENTION_LABELS: Record<string, string> = {
  materiel: 'Materiel',
  controle: 'Controle',
  recolte: 'Recolte',
  nourrissement: 'Nourrissement',
  essaimage: 'Essaimage naturel',
  division: 'Division',
  deplacement: 'Deplacement',
  varroa: 'Varroa',
  pesee: 'Pesee',
  commentaire: 'Commentaire',
  empilement: 'Empilement',
  sanitaire: 'Sanitaire',
  transvasement: 'Transvasement',
  reine: 'Reine',
};

function formatInterventionTitle(type: string | null): string {
  return type ? (INTERVENTION_LABELS[type] ?? type) : 'Intervention';
}

function formatInterventionSummary(type: string | null, donnees: Record<string, unknown>): string {
  if (!type || !donnees) return '';

  switch (type) {
    case 'controle': {
      const force = donnees.force_colonie;
      const comportement = donnees.comportement;
      return `Force ${force}/4 - ${comportement}`;
    }
    case 'varroa': {
      const sa = donnees.sous_action as string;
      if (sa === 'comptage_plancher' && donnees.chute_par_jour != null)
        return `${donnees.chute_par_jour} varroas/jour`;
      if (sa === 'traitement') return `Traitement: ${donnees.type_traitement}`;
      if (sa === 'comptage_vph' && donnees.taux_vph != null) return `VPH: ${donnees.taux_vph}%`;
      return sa?.replace(/_/g, ' ') ?? '';
    }
    case 'pesee':
      return `${donnees.poids_kg} kg`;
    case 'nourrissement':
      return `${donnees.quantite} ${donnees.unite}`;
    case 'recolte':
      return `${donnees.quantite} ${donnees.unite} ${donnees.type_produit}`;
    case 'materiel': {
      const elements = donnees.elements as Array<{ type: string; quantite: number }> | undefined;
      if (elements?.length) return elements.map((e) => `${e.quantite}x ${e.type}`).join(', ');
      return '';
    }
    case 'division':
      return `${donnees.nombre_divisions} division(s)`;
    case 'essaimage':
      return donnees.essaim_recupere ? 'Essaim recupere' : 'Essaim perdu';
    case 'sanitaire':
      return (donnees.sous_action as string)?.replace(/_/g, ' ') ?? '';
    default:
      return '';
  }
}
