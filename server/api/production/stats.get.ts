import { z } from 'zod';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { recoltes, ruchers } from '~~/server/database/schema';
import { anneeParis, jourUtc } from '~~/server/utils/horloge';

const querySchema = z.object({
  annee: z.coerce.number().int().min(2000).max(2100).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const annee = query.annee ?? anneeParis(new Date());

  /**
   * ⚠️ TROISIÈME ROUTE À CONSTRUIRE SES BORNES DANS LE FUSEAU DE LA MACHINE.
   *
   * `new Date(annee, 0, 1)` lit le fuseau de qui exécute — UTC sur Vercel,
   * Paris sur un poste de développement. Ses deux sœurs, `finances/
   * dashboard.get.ts` et `ruchers/[id]/stats.get.ts`, portent chacune un
   * commentaire expliquant que le défaut y a été corrigé ; celle-ci a été
   * oubliée. C'est la troisième asymétrie entre routes sœurs de cette passe,
   * et elle raconte la même chose : une règle écrite trois fois finit par ne
   * l'être que deux.
   *
   * `dateRecolte` est une date-seule STOCKÉE À MINUIT UTC : la borne se pose
   * donc à minuit UTC elle aussi (cf. `jourUtc`), et pas à minuit à Paris —
   * une borne à minuit à Paris se relit « jour J−1 » en UTC et ferait tomber
   * la récolte du 1ᵉʳ janvier dans l'exercice précédent.
   *
   * La fin d'année se prend au 31 décembre + 86 399 s, comme chez la sœur
   * `dashboard` : la comparaison est un `<=` sur une date-seule.
   */
  const finDeJournee = (d: Date) => new Date(d.getTime() + 86_399_000);
  const debutAnnee = jourUtc(annee, 1, 1);
  const finAnnee = finDeJournee(jourUtc(annee, 12, 31));
  const debutAnneePrecedente = jourUtc(annee - 1, 1, 1);
  const finAnneePrecedente = finDeJournee(jourUtc(annee - 1, 12, 31));

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
