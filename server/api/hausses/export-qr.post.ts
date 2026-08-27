import { eq, and, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';
import { z } from 'zod';
import { hausses } from '~~/server/database/schema';
import { urlQrHausse } from '~~/app/utils/urlQr';

const exportSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(32),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, exportSchema.parse);

  const data = await db
    .select({
      id: hausses.id,
      numero: hausses.numero,
      type: hausses.type,
    })
    .from(hausses)
    .where(and(eq(hausses.userId, ownerId), inArray(hausses.id, body.ids)));

  if (data.length === 0) return notFound('Aucune hausse trouvee');

  const haussesWithQr = await Promise.all(
    data.map(async (h) => {
      // Recalculé depuis l'id, jamais relu en base — cf. `app/utils/urlQr.ts`.
      const qrData = urlQrHausse(h.id);
      const qrCode = await QRCode.toDataURL(qrData, { width: 200 });
      return {
        id: h.id,
        numero: h.numero,
        type: h.type,
        qrCode,
      };
    }),
  );

  return { data: { hausses: haussesWithQr } };
});
