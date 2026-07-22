import { eq, desc } from 'drizzle-orm';
import { reinesElevage, lignees, testsPerformance } from '~~/server/database/schema';
import {
  computeSelectionIndex,
  indexTier,
  statistiquesPopulation,
  classementLignees,
  type TraitValues,
} from '~~/app/utils/selectionReines';

/** Nombre minimal d'apiculteurs distincts pour exposer le benchmark (jamais de donnée individuelle). */
const MIN_PEERS_GENETIQUE = 3;

interface TestTraitRow {
  productiviteMielKg: string | number | null;
  resistanceVarroaPctInfestation: string | number | null;
  hygienismePinTestPct: number | null;
  douceur: number | null;
  tenueCadre: number | null;
  tendanceEssaimage: number | null;
  hivernage: number | null;
  vigueurPrintemps: number | null;
  ponteQualite: number | null;
}

type Benchmark =
  | { available: false; reason: 'not_enough_peers'; nbApiculteurs: number; seuil: number }
  | { available: true; nbApiculteurs: number; vous: number; moyenne: number };

/**
 * GET /api/elevage/selection-avancee — sélection génétique avancée (Expert).
 * Index de sélection STANDARDISÉ contre le groupe de contemporains (z-score vs
 * votre cheptel, plus rigoureux que l'échelle fixe) + classement des lignées.
 * Gated `selectionAvancee`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const [reines, tests] = await Promise.all([
    db
      .select({ reine: reinesElevage, ligneeNom: lignees.nom, ligneeRace: lignees.race })
      .from(reinesElevage)
      .leftJoin(lignees, eq(reinesElevage.ligneeId, lignees.id))
      .where(eq(reinesElevage.userId, ownerId)),
    db
      .select()
      .from(testsPerformance)
      .where(eq(testsPerformance.userId, ownerId))
      .orderBy(desc(testsPerformance.saison)),
  ]);

  const num = (v: string | number | null) =>
    v === null || v === undefined ? undefined : Number(v);
  const toTraits = (t: TestTraitRow): TraitValues => ({
    productiviteMielKg: num(t.productiviteMielKg),
    resistanceVarroaPctInfestation: num(t.resistanceVarroaPctInfestation),
    hygienismePinTestPct: t.hygienismePinTestPct ?? undefined,
    douceur: t.douceur ?? undefined,
    tenueCadre: t.tenueCadre ?? undefined,
    tendanceEssaimage: t.tendanceEssaimage ?? undefined,
    hivernage: t.hivernage ?? undefined,
    vigueurPrintemps: t.vigueurPrintemps ?? undefined,
    ponteQualite: t.ponteQualite ?? undefined,
  });

  // Standardisation contre le groupe de contemporains (tous les tests du cheptel).
  const population = statistiquesPopulation(tests.map(toTraits));

  const bestByReine = new Map<string, { index: number; completeness: number; saison: number }>();
  for (const t of tests) {
    const res = computeSelectionIndex(toTraits(t), { population });
    if (res.index === null) continue;
    const prev = bestByReine.get(t.reineId);
    if (!prev || res.index > prev.index) {
      bestByReine.set(t.reineId, {
        index: res.index,
        completeness: res.completeness,
        saison: t.saison,
      });
    }
  }

  const rows = reines
    .map(({ reine, ligneeNom, ligneeRace }) => {
      const best = bestByReine.get(reine.id);
      if (!best) return null;
      return {
        reineId: reine.id,
        identifiant: reine.identifiant,
        couleurMarquage: reine.couleurMarquage,
        anneeNaissance: reine.anneeNaissance,
        estActive: reine.estActive,
        ligneeId: reine.ligneeId,
        ligneeNom,
        ligneeRace,
        index: best.index,
        completeness: best.completeness,
        saison: best.saison,
        tier: indexTier(best.index),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.index - a.index)
    .map((r, i) => ({ rang: i + 1, ...r }));

  const classement = classementLignees(
    rows.map((r) => ({
      ligneeId: r.ligneeId,
      ligneeNom: r.ligneeNom,
      ligneeRace: r.ligneeRace,
      index: r.index,
    })),
  );

  // ─── Benchmark génétique anonymisé (tous apiculteurs Expert confondus) ────
  // Même principe de confidentialité que server/api/communaute/benchmarks.get.ts :
  // pas de comparaison si moins de MIN_PEERS_GENETIQUE apiculteurs distincts, et
  // uniquement des agrégats renvoyés (jamais un détail par apiculteur).
  const allTests = await db
    .select({
      userId: testsPerformance.userId,
      productiviteMielKg: testsPerformance.productiviteMielKg,
      resistanceVarroaPctInfestation: testsPerformance.resistanceVarroaPctInfestation,
      hygienismePinTestPct: testsPerformance.hygienismePinTestPct,
      douceur: testsPerformance.douceur,
      tenueCadre: testsPerformance.tenueCadre,
      tendanceEssaimage: testsPerformance.tendanceEssaimage,
      hivernage: testsPerformance.hivernage,
      vigueurPrintemps: testsPerformance.vigueurPrintemps,
      ponteQualite: testsPerformance.ponteQualite,
    })
    .from(testsPerformance);

  const nbApiculteursGenetique = new Set(allTests.map((t) => t.userId)).size;

  let benchmark: Benchmark = {
    available: false,
    reason: 'not_enough_peers',
    nbApiculteurs: nbApiculteursGenetique,
    seuil: MIN_PEERS_GENETIQUE,
  };

  if (nbApiculteursGenetique >= MIN_PEERS_GENETIQUE) {
    const populationGlobale = statistiquesPopulation(allTests.map(toTraits));
    const indexParUser = new Map<string, number[]>();
    for (const t of allTests) {
      const res = computeSelectionIndex(toTraits(t), { population: populationGlobale });
      if (res.index === null) continue;
      const arr = indexParUser.get(t.userId) ?? [];
      arr.push(res.index);
      indexParUser.set(t.userId, arr);
    }

    const moyenne = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const userAverages = [...indexParUser.values()].map(moyenne);
    const vousIndices = indexParUser.get(ownerId);

    if (vousIndices && userAverages.length > 0) {
      benchmark = {
        available: true,
        nbApiculteurs: nbApiculteursGenetique,
        vous: Math.round(moyenne(vousIndices) * 10) / 10,
        moyenne: Math.round(moyenne(userAverages) * 10) / 10,
      };
    }
  }

  return {
    data: {
      reines: rows,
      lignees: classement,
      // true dès qu'au moins un trait a pu être standardisé contre le cheptel
      standardise: Object.keys(population).length > 0,
      criteresStandardises: Object.keys(population).length,
      benchmark,
    },
  };
});
