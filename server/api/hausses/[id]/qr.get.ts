import { eq, and } from 'drizzle-orm';
import QRCode from 'qrcode';
import { hausses } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [hausse] = await db
    .select({ id: hausses.id, qrCodeData: hausses.qrCodeData })
    .from(hausses)
    .where(and(eq(hausses.id, id), eq(hausses.userId, user.id)))
    .limit(1);

  if (!hausse) return notFound('Hausse introuvable');

  const data = hausse.qrCodeData || `https://app.apigo.fr/hausses/${hausse.id}`;
  const qrCode = await QRCode.toDataURL(data);

  return { data: { qrCode } };
});
