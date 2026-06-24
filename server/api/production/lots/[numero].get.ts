import { eq, and, sql, desc } from 'drizzle-orm';
import { recoltes, ruchers, ruches, transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const numero = decodeURIComponent(getRouterParam(event, 'numero') ?? '');
  if (!numero) badRequest('Numero de lot manquant');

  // Get all recoltes in this lot
  const recoltesData = await db
    .select({
      id: recoltes.id,
      dateRecolte: recoltes.dateRecolte,
      typeMiel: recoltes.typeMiel,
      quantiteKg: recoltes.quantiteKg,
      humidite: recoltes.humidite,
      nombreHausses: recoltes.nombreHausses,
      notes: recoltes.notes,
      rucherId: recoltes.rucherId,
      rucheId: recoltes.rucheId,
      rucherNom: ruchers.nom,
      rucheNumero: ruches.numero,
      createdAt: recoltes.createdAt,
    })
    .from(recoltes)
    .leftJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
    .leftJoin(ruches, eq(recoltes.rucheId, ruches.id))
    .where(and(eq(recoltes.userId, ownerId), eq(recoltes.numeroLot, numero)))
    .orderBy(desc(recoltes.dateRecolte));

  if (recoltesData.length === 0) notFound('Lot introuvable');

  // Aggregated stats
  const totalKg = recoltesData.reduce((sum, r) => sum + Number(r.quantiteKg ?? 0), 0);
  const humidites = recoltesData.filter((r) => r.humidite).map((r) => Number(r.humidite));
  const humiditeMoyenne =
    humidites.length > 0
      ? Math.round((humidites.reduce((a, b) => a + b, 0) / humidites.length) * 10) / 10
      : null;
  const humiditeMin = humidites.length > 0 ? Math.min(...humidites) : null;
  const humiditeMax = humidites.length > 0 ? Math.max(...humidites) : null;

  const dates = recoltesData.map((r) => new Date(r.dateRecolte));
  const dateDebut = new Date(Math.min(...dates.map((d) => d.getTime())));
  const dateFin = new Date(Math.max(...dates.map((d) => d.getTime())));

  // DDM: date de la derniere recolte + 2 ans (standard profession)
  const ddm = new Date(dateFin);
  ddm.setFullYear(ddm.getFullYear() + 2);

  // Types de miel uniques
  const typesMiel = [...new Set(recoltesData.map((r) => r.typeMiel).filter(Boolean))];

  // Ruchers uniques avec sous-totaux
  const ruchersMap = new Map<string, { nom: string; totalKg: number; nbRecoltes: number }>();
  for (const r of recoltesData) {
    const key = r.rucherId ?? 'inconnu';
    const existing = ruchersMap.get(key);
    if (existing) {
      existing.totalKg += Number(r.quantiteKg ?? 0);
      existing.nbRecoltes += 1;
    } else {
      ruchersMap.set(key, {
        nom: r.rucherNom ?? 'Non assigne',
        totalKg: Number(r.quantiteKg ?? 0),
        nbRecoltes: 1,
      });
    }
  }

  // Ruches uniques
  const ruchesMap = new Map<string, { numero: string; totalKg: number }>();
  for (const r of recoltesData) {
    if (!r.rucheId) continue;
    const existing = ruchesMap.get(r.rucheId);
    if (existing) {
      existing.totalKg += Number(r.quantiteKg ?? 0);
    } else {
      ruchesMap.set(r.rucheId, {
        numero: r.rucheNumero ?? 'Inconnue',
        totalKg: Number(r.quantiteKg ?? 0),
      });
    }
  }

  // Linked transactions (ventes with this lot in their lignes)
  const ventesData = await db
    .select({
      id: transactions.id,
      numero: transactions.numero,
      dateTransaction: transactions.dateTransaction,
      total: transactions.total,
      statut: transactions.statut,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, ownerId),
        eq(transactions.type, 'vente'),
        sql`${transactions.lignes}::text ILIKE ${'%' + escapeIlike(numero) + '%'}`,
      ),
    )
    .orderBy(desc(transactions.dateTransaction))
    .limit(20);

  // Conformite checks
  const conformite = {
    humiditeConforme: humiditeMoyenne !== null && humiditeMoyenne <= 20,
    lotRenseigne: true,
    rucherIdentifie: recoltesData.every((r) => r.rucherId),
    dateRecolteRenseignee: recoltesData.every((r) => r.dateRecolte),
    quantiteRenseignee: recoltesData.every((r) => r.quantiteKg && Number(r.quantiteKg) > 0),
  };
  const nbChecks = Object.values(conformite).length;
  const nbOk = Object.values(conformite).filter(Boolean).length;

  return {
    data: {
      numeroLot: numero,
      totalKg: Math.round(totalKg * 100) / 100,
      nombreRecoltes: recoltesData.length,
      typesMiel,
      dateDebut,
      dateFin,
      ddm,
      humidite: { moyenne: humiditeMoyenne, min: humiditeMin, max: humiditeMax },
      ruchers: Array.from(ruchersMap.values()),
      ruches: Array.from(ruchesMap.values()),
      recoltes: recoltesData,
      ventes: ventesData,
      conformite: { ...conformite, score: `${nbOk}/${nbChecks}` },
    },
  };
});
