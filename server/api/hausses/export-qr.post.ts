import { eq, and, inArray } from 'drizzle-orm';
import QRCode from 'qrcode';
import { z } from 'zod';
import { hausses } from '~~/server/database/schema';

const exportSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(32),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, exportSchema.parse);

  const data = await db
    .select({
      id: hausses.id,
      numero: hausses.numero,
      type: hausses.type,
      qrCodeData: hausses.qrCodeData,
    })
    .from(hausses)
    .where(and(eq(hausses.userId, user.id), inArray(hausses.id, body.ids)));

  if (data.length === 0) return notFound('Aucune hausse trouvee');

  const haussesWithQr = await Promise.all(
    data.map(async (h) => {
      const qrData = h.qrCodeData || `https://app.apigo.fr/hausses/${h.id}`;
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
