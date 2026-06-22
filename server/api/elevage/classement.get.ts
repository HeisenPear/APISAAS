import { eq, desc } from 'drizzle-orm';
import { reinesElevage, lignees, testsPerformance } from '~~/server/database/schema';
import { computeSelectionIndex, indexTier } from '~~/app/utils/selectionReines';

/**
 * Classement des reines par index de sélection.
 * L'index est RECALCULÉ depuis les traits bruts (la fonction pure reste la
 * source de vérité) ; on garde le meilleur test par reine, puis on classe.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const [reines, tests] = await Promise.all([
    db
      .select({
        reine: reinesElevage,
        ligneeNom: lignees.nom,
        ligneeRace: lignees.race,
      })
      .from(reinesElevage)
      .leftJoin(lignees, eq(reinesElevage.ligneeId, lignees.id))
      .where(eq(reinesElevage.userId, user.id)),
    db
      .select()
      .from(testsPerformance)
      .where(eq(testsPerformance.userId, user.id))
      .orderBy(desc(testsPerformance.saison)),
  ]);

  const num = (v: string | number | null) =>
    v === null || v === undefined ? undefined : Number(v);

  const bestByReine = new Map<
    string,
    { index: number; completeness: number; saison: number; contributions: unknown[] }
  >();
  const countByReine = new Map<string, number>();

  for (const t of tests) {
    countByReine.set(t.reineId, (countByReine.get(t.reineId) ?? 0) + 1);
    const res = computeSelectionIndex({
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
    if (res.index === null) continue;
    const prev = bestByReine.get(t.reineId);
    if (!prev || res.index > prev.index) {
      bestByReine.set(t.reineId, {
        index: res.index,
        completeness: res.completeness,
        saison: t.saison,
        contributions: res.contributions,
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
        ligneeNom,
        ligneeRace,
        index: best.index,
        completeness: best.completeness,
        saison: best.saison,
        tier: indexTier(best.index),
        contributions: best.contributions,
        nbTests: countByReine.get(reine.id) ?? 0,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.index - a.index)
    .map((r, i) => ({ rang: i + 1, ...r }));

  return { data: rows, total: rows.length };
});
