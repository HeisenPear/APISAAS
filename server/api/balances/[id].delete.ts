import { and, eq, isNull } from 'drizzle-orm';
import { alertes, balances } from '~~/server/database/schema';
import { chargerBalance } from '~~/server/utils/balances/acces';

/**
 * DELETE /api/balances/:id — supprime la balance ET sa timeseries (cascade DB).
 * Les alertes encore actives qui la référencent sont résolues : elles n'auraient
 * plus de cible cliquable.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'terrain');
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const balance = await chargerBalance(ownerId, id);
  if (!balance) return notFound('Balance introuvable');

  await withDbRetry(
    () =>
      db
        .update(alertes)
        .set({ resolvedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(alertes.userId, ownerId),
            eq(alertes.referenceType, 'balance'),
            eq(alertes.referenceId, id),
            isNull(alertes.resolvedAt),
          ),
        ),
    'balances:suppressionAlertes',
  );

  await withDbRetry(
    () => db.delete(balances).where(and(eq(balances.id, id), eq(balances.userId, ownerId))),
    'balances:suppression',
  );

  return { data: { id } };
});
