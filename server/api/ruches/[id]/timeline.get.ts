import { eq, and, desc, sql } from 'drizzle-orm';
import {
  ruches,
  interventions,
  recoltes,
  pesees,
  comptagesVarroa,
  traitementsVarroa,
  essaimages,
  deplacementsRuches,
  empilements,
  evenementsSanitaires,
  transvasements,
  mouvementsMateriel,
} from '~~/server/database/schema';

interface TimelineEntry {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

/**
 * GET /api/ruches/[id]/timeline
 * Timeline agrégée Phase 2 : interventions + toutes tables enfants
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');

  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Verify ownership
  const rucheRows = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .limit(1);

  if (!rucheRows[0]) return notFound('Ruche introuvable');

  const userId = user.id;

  // Requêtes parallèles sur toutes les tables
  const [
    interventionRows,
    recolteRows,
    peseeRows,
    comptageRows,
    traitementRows,
    essaimageRows,
    deplacementRows,
    empilementRows,
    sanitaireRows,
    transvasementRows,
    materielRows,
  ] = await Promise.all([
    db
      .select({
        id: interventions.id,
        date: interventions.dateVisite,
        type: interventions.type,
        notes: interventions.notes,
        categories: interventions.categoriesActivees,
        donnees: interventions.donnees,
        dureeMinutes: interventions.dureeMinutes,
      })
      .from(interventions)
      .where(and(eq(interventions.rucheId, id), eq(interventions.userId, userId)))
      .orderBy(desc(interventions.dateVisite))
      .limit(50),
    db
      .select({
        id: recoltes.id,
        date: recoltes.dateRecolte,
        typeMiel: recoltes.typeMiel,
        quantiteKg: recoltes.quantiteKg,
        typeProduit: recoltes.typeProduit,
      })
      .from(recoltes)
      .where(and(eq(recoltes.rucheId, id), eq(recoltes.userId, userId)))
      .orderBy(desc(recoltes.dateRecolte))
      .limit(20),
    db
      .select({
        id: pesees.id,
        date: pesees.createdAt,
        poidsKg: pesees.poidsKg,
        typePesee: pesees.typePesee,
        variationKg: pesees.variationKg,
      })
      .from(pesees)
      .where(and(eq(pesees.rucheId, id), eq(pesees.userId, userId)))
      .orderBy(desc(pesees.createdAt))
      .limit(20),
    db
      .select({
        id: comptagesVarroa.id,
        date: comptagesVarroa.createdAt,
        typeComptage: comptagesVarroa.typeComptage,
        nombreVarroas: comptagesVarroa.nombreVarroas,
        chuteParJour: comptagesVarroa.chuteParJour,
        tauxVph: comptagesVarroa.tauxVph,
      })
      .from(comptagesVarroa)
      .where(and(eq(comptagesVarroa.rucheId, id), eq(comptagesVarroa.userId, userId)))
      .orderBy(desc(comptagesVarroa.createdAt))
      .limit(20),
    db
      .select({
        id: traitementsVarroa.id,
        date: traitementsVarroa.dateDebut,
        typeTraitement: traitementsVarroa.typeTraitement,
      })
      .from(traitementsVarroa)
      .where(and(eq(traitementsVarroa.rucheId, id), eq(traitementsVarroa.userId, userId)))
      .orderBy(desc(traitementsVarroa.dateDebut))
      .limit(20),
    db
      .select({
        id: essaimages.id,
        date: essaimages.dateEssaimage,
        essaimRecupere: essaimages.essaimRecupere,
      })
      .from(essaimages)
      .where(and(eq(essaimages.rucheSourceId, id), eq(essaimages.userId, userId)))
      .orderBy(desc(essaimages.dateEssaimage))
      .limit(10),
    db
      .select({
        id: deplacementsRuches.id,
        date: deplacementsRuches.dateDeplacement,
        motif: deplacementsRuches.motif,
      })
      .from(deplacementsRuches)
      .where(and(eq(deplacementsRuches.rucheId, id), eq(deplacementsRuches.userId, userId)))
      .orderBy(desc(deplacementsRuches.dateDeplacement))
      .limit(10),
    db
      .select({ id: empilements.id, date: empilements.createdAt })
      .from(empilements)
      .where(
        and(
          sql`(${empilements.rucheSourceId} = ${id} OR ${empilements.rucheDestinationId} = ${id})`,
          eq(empilements.userId, userId),
        ),
      )
      .orderBy(desc(empilements.createdAt))
      .limit(10),
    db
      .select({
        id: evenementsSanitaires.id,
        date: evenementsSanitaires.createdAt,
        typeEvenement: evenementsSanitaires.typeEvenement,
        causeProbable: evenementsSanitaires.causeProbable,
      })
      .from(evenementsSanitaires)
      .where(and(eq(evenementsSanitaires.rucheId, id), eq(evenementsSanitaires.userId, userId)))
      .orderBy(desc(evenementsSanitaires.createdAt))
      .limit(10),
    db
      .select({
        id: transvasements.id,
        date: transvasements.createdAt,
        cadresTransferes: transvasements.cadresTransferes,
      })
      .from(transvasements)
      .where(
        and(
          sql`(${transvasements.rucheSourceId} = ${id} OR ${transvasements.rucheDestinationId} = ${id})`,
          eq(transvasements.userId, userId),
        ),
      )
      .orderBy(desc(transvasements.createdAt))
      .limit(10),
    db
      .select({
        id: mouvementsMateriel.id,
        date: mouvementsMateriel.createdAt,
        action: mouvementsMateriel.action,
        element: mouvementsMateriel.element,
        quantite: mouvementsMateriel.quantite,
      })
      .from(mouvementsMateriel)
      .where(and(eq(mouvementsMateriel.rucheId, id), eq(mouvementsMateriel.userId, userId)))
      .orderBy(desc(mouvementsMateriel.createdAt))
      .limit(20),
  ]);

  // Fusionner en TimelineEntry[]
  const entries: TimelineEntry[] = [
    ...interventionRows.map((i) => ({
      id: i.id,
      type: 'intervention',
      date: i.date.toISOString(),
      title: LABELS[i.type ?? ''] ?? i.type ?? 'Visite',
      description: i.notes,
      metadata: {
        interventionType: i.type,
        categories: i.categories,
        dureeMinutes: i.dureeMinutes,
      },
    })),
    ...recolteRows.map((r) => ({
      id: r.id,
      type: 'recolte',
      date: r.date.toISOString(),
      title: `Récolte${r.typeMiel ? ` — ${r.typeMiel}` : ''}`,
      description: null,
      metadata: { quantiteKg: r.quantiteKg, typeProduit: r.typeProduit },
    })),
    ...peseeRows.map((r) => ({
      id: r.id,
      type: 'pesee',
      date: r.date.toISOString(),
      title: 'Pesée',
      description: null,
      metadata: { poidsKg: r.poidsKg, typePesee: r.typePesee, variationKg: r.variationKg },
    })),
    ...comptageRows.map((r) => ({
      id: r.id,
      type: 'comptage_varroa',
      date: r.date.toISOString(),
      title: `Varroa — ${r.typeComptage}`,
      description: null,
      metadata: {
        nombreVarroas: r.nombreVarroas,
        chuteParJour: r.chuteParJour,
        tauxVph: r.tauxVph,
      },
    })),
    ...traitementRows.map((r) => ({
      id: r.id,
      type: 'traitement_varroa',
      date: r.date.toISOString(),
      title: `Traitement varroa`,
      description: null,
      metadata: { typeTraitement: r.typeTraitement },
    })),
    ...essaimageRows.map((r) => ({
      id: r.id,
      type: 'essaimage',
      date: r.date.toISOString(),
      title: r.essaimRecupere ? 'Essaim récupéré' : 'Essaim perdu',
      description: null,
      metadata: { essaimRecupere: r.essaimRecupere },
    })),
    ...deplacementRows.map((r) => ({
      id: r.id,
      type: 'deplacement',
      date: r.date.toISOString(),
      title: `Déplacement`,
      description: null,
      metadata: { motif: r.motif },
    })),
    ...empilementRows.map((r) => ({
      id: r.id,
      type: 'empilement',
      date: r.date.toISOString(),
      title: 'Empilement',
      description: null,
      metadata: {},
    })),
    ...sanitaireRows.map((r) => ({
      id: r.id,
      type: 'sanitaire',
      date: r.date.toISOString(),
      title: SANITAIRE_LABELS[r.typeEvenement] ?? r.typeEvenement,
      description: null,
      metadata: { causeProbable: r.causeProbable },
    })),
    ...transvasementRows.map((r) => ({
      id: r.id,
      type: 'transvasement',
      date: r.date.toISOString(),
      title: 'Transvasement',
      description: null,
      metadata: { cadresTransferes: r.cadresTransferes },
    })),
    ...materielRows.map((r) => ({
      id: r.id,
      type: 'materiel',
      date: r.date.toISOString(),
      title: `${r.action} ${r.quantite}x ${r.element}`,
      description: null,
      metadata: { action: r.action, element: r.element, quantite: r.quantite },
    })),
  ];

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = entries.length;
  const paginated = entries.slice(offset, offset + limit);

  return {
    data: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});

const LABELS: Record<string, string> = {
  materiel: 'Matériel',
  controle: 'Contrôle',
  recolte: 'Récolte',
  nourrissement: 'Nourrissement',
  essaimage: 'Essaimage naturel',
  division: 'Division',
  deplacement: 'Déplacement',
  varroa: 'Varroa',
  pesee: 'Pesée',
  commentaire: 'Commentaire',
  empilement: 'Empilement',
  sanitaire: 'Sanitaire',
  transvasement: 'Transvasement',
  multi: 'Multi-intervention',
};

const SANITAIRE_LABELS: Record<string, string> = {
  essaim_mort: 'Essaim mort',
  nettoyer_ruche: 'Nettoyage ruche',
  nettoyer_plancher: 'Nettoyage plancher',
  retrait_couvain: 'Retrait couvain',
};
