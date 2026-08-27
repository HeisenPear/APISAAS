import { eq, and } from 'drizzle-orm';
import QRCode from 'qrcode';
import { hausses } from '~~/server/database/schema';
import { urlQrHausse } from '~~/app/utils/urlQr';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [hausse] = await db
    .select({ id: hausses.id })
    .from(hausses)
    .where(and(eq(hausses.id, id), eq(hausses.userId, ownerId)))
    .limit(1);

  if (!hausse) return notFound('Hausse introuvable');

  // On ne relit PAS la colonne : elle porte encore, sur toutes les hausses
  // déjà générées, une URL vers un sous-domaine qui ne résout pas.
  // Recalculer depuis l'id répare le QR sans toucher à la base.
  const data = urlQrHausse(hausse.id);
  const qrCode = await QRCode.toDataURL(data);

  return { data: { qrCode } };
});
