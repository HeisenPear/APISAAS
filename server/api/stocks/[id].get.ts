import { eq, and, desc } from 'drizzle-orm';
import { stocks, mouvementsStock, recoltes, ruchers, balances } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [stock] = await db
    .select()
    .from(stocks)
    .where(and(eq(stocks.id, id), eq(stocks.userId, ownerId)))
    .limit(1);

  if (!stock) notFound('Article introuvable');

  // Historique du lot. Trié sur date_mouvement (date métier, qui autorise
  // l'antidatage) plutôt que created_at.
  const mouvements = await db
    .select()
    .from(mouvementsStock)
    .where(and(eq(mouvementsStock.stockId, id), eq(mouvementsStock.userId, ownerId)))
    .orderBy(desc(mouvementsStock.dateMouvement))
    .limit(50);

  // Traçabilité amont : d'où sort ce lot. Chaque lecture reste rescopée sur le
  // propriétaire — un id de récolte trafiqué ne peut rien révéler d'un autre
  // apiculteur.
  const [recolte] = stock.recolteId
    ? await db
        .select({
          id: recoltes.id,
          dateRecolte: recoltes.dateRecolte,
          typeMiel: recoltes.typeMiel,
          quantiteKg: recoltes.quantiteKg,
          humidite: recoltes.humidite,
          rucheId: recoltes.rucheId,
          rucherId: recoltes.rucherId,
        })
        .from(recoltes)
        .where(and(eq(recoltes.id, stock.recolteId), eq(recoltes.userId, ownerId)))
        .limit(1)
    : [];

  const [rucher] = stock.rucherId
    ? await db
        .select({ id: ruchers.id, nom: ruchers.nom, commune: ruchers.commune })
        .from(ruchers)
        .where(and(eq(ruchers.id, stock.rucherId), eq(ruchers.userId, ownerId)))
        .limit(1)
    : [];

  const [balance] = stock.balanceId
    ? await db
        .select({ id: balances.id, nom: balances.nom })
        .from(balances)
        .where(and(eq(balances.id, stock.balanceId), eq(balances.userId, ownerId)))
        .limit(1)
    : [];

  return {
    data: {
      ...stock,
      mouvements,
      origine: {
        recolte: recolte ?? null,
        rucher: rucher ?? null,
        balance: balance ?? null,
      },
    },
  };
});
