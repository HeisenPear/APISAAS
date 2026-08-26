import { z } from 'zod';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { recoltes, ruchers } from '~~/server/database/schema';
import { anneeParis } from '~~/server/utils/horloge';

const querySchema = z.object({
  annee: z.coerce.number().int().min(2000).max(2100).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const annee = query.annee ?? anneeParis(new Date());
  const debutAnnee = new Date(annee, 0, 1);
  const finAnnee = new Date(annee, 11, 31, 23, 59, 59);
  const debutAnneePrecedente = new Date(annee - 1, 0, 1);
  const finAnneePrecedente = new Date(annee - 1, 11, 31, 23, 59, 59);

  const baseConditions = [eq(recoltes.userId, ownerId)];

  // 5 agrégations indépendantes → en parallèle (aucune dépendance entre elles).
  const [saisonCouranteRows, saisonPrecedenteRows, parMois, parRucher, parTypeMiel] =
    await Promise.all([
      // Stats saison courante
      db
        .select({
          totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`,
          nombreRecoltes: sql<number>`count(*)::int`,
          nombreLots: sql<number>`count(DISTINCT ${recoltes.numeroLot})::int`,
          humiditeMoyenne: sql<string>`ROUND(AVG(${recoltes.humidite}::numeric), 1)`,
        })
        .from(recoltes)
        .where(
          and(
            ...baseConditions,
            gte(recoltes.dateRecolte, debutAnnee),
            lte(recoltes.dateRecolte, finAnnee),
          ),
        ),
      // Stats annee precedente (pour comparaison N/N-1)
      db
        .select({
          totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`,
          nombreRecoltes: sql<number>`count(*)::int`,
        })
        .from(recoltes)
        .where(
          and(
            ...baseConditions,
            gte(recoltes.dateRecolte, debutAnneePrecedente),
            lte(recoltes.dateRecolte, finAnneePrecedente),
          ),
        ),
      // Production par mois (annee courante)
      db
        .select({
          mois: sql<number>`EXTRACT(MONTH FROM ${recoltes.dateRecolte})::int`.as('mois'),
          totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`.as('total_kg'),
          nombreRecoltes: sql<number>`count(*)::int`.as('nombre_recoltes'),
        })
        .from(recoltes)
        .where(
          and(
            ...baseConditions,
            gte(recoltes.dateRecolte, debutAnnee),
            lte(recoltes.dateRecolte, finAnnee),
          ),
        )
        .groupBy(sql`EXTRACT(MONTH FROM ${recoltes.dateRecolte})`)
        .orderBy(sql`EXTRACT(MONTH FROM ${recoltes.dateRecolte})`),
      // Production par rucher
      db
        .select({
          rucherId: recoltes.rucherId,
          rucherNom: ruchers.nom,
          totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`.as('total_kg'),
          nombreRecoltes: sql<number>`count(*)::int`.as('nombre_recoltes'),
        })
        .from(recoltes)
        .leftJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
        .where(
          and(
            ...baseConditions,
            gte(recoltes.dateRecolte, debutAnnee),
            lte(recoltes.dateRecolte, finAnnee),
          ),
        )
        .groupBy(recoltes.rucherId, ruchers.nom)
        .orderBy(sql`SUM(${recoltes.quantiteKg}::numeric) DESC NULLS LAST`),
      // Repartition par type de miel
      db
        .select({
          typeMiel: recoltes.typeMiel,
          totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`.as('total_kg'),
          nombreRecoltes: sql<number>`count(*)::int`.as('nombre_recoltes'),
        })
        .from(recoltes)
        .where(
          and(
            ...baseConditions,
            gte(recoltes.dateRecolte, debutAnnee),
            lte(recoltes.dateRecolte, finAnnee),
          ),
        )
        .groupBy(recoltes.typeMiel)
        .orderBy(sql`SUM(${recoltes.quantiteKg}::numeric) DESC NULLS LAST`),
    ]);

  const saisonCourante = saisonCouranteRows[0];
  const saisonPrecedente = saisonPrecedenteRows[0];

  const totalCourant = Number(saisonCourante?.totalKg ?? 0);
  const totalPrecedent = Number(saisonPrecedente?.totalKg ?? 0);
  const evolutionPourcent =
    totalPrecedent > 0
      ? Math.round(((totalCourant - totalPrecedent) / totalPrecedent) * 100)
      : null;

  return {
    data: {
      annee,
      saison: {
        totalKg: totalCourant,
        nombreRecoltes: saisonCourante?.nombreRecoltes ?? 0,
        nombreLots: saisonCourante?.nombreLots ?? 0,
        humiditeMoyenne: saisonCourante?.humiditeMoyenne
          ? Number(saisonCourante.humiditeMoyenne)
          : null,
      },
      comparaison: {
        anneePrecedente: annee - 1,
        totalKgPrecedent: totalPrecedent,
        evolutionPourcent,
      },
      parMois: parMois.map((m) => ({
        mois: m.mois,
        totalKg: Number(m.totalKg),
        nombreRecoltes: m.nombreRecoltes,
      })),
      parRucher: parRucher.map((r) => ({
        rucherId: r.rucherId,
        rucherNom: r.rucherNom,
        totalKg: Number(r.totalKg),
        nombreRecoltes: r.nombreRecoltes,
      })),
      parTypeMiel: parTypeMiel.map((t) => ({
        typeMiel: t.typeMiel ?? 'Non specifie',
        totalKg: Number(t.totalKg),
        nombreRecoltes: t.nombreRecoltes,
      })),
    },
  };
});
