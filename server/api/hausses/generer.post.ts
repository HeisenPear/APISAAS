import { eq, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { hausses } from '~~/server/database/schema';

const genererSchema = z.object({
  nombre: z.number().int().min(1).max(100),
  type: z.enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot', 'kenyane', 'autre']),
  nombreCadres: z.number().int().min(1).max(20).default(10),
  prefixeNumero: z.string().max(10).optional(),
  anneeAcquisition: z.number().int().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, genererSchema.parse);

  const prefix = body.prefixeNumero ?? 'H-';

  // Find max existing numero with same prefix to continue sequence
  const [maxResult] = await db
    .select({
      maxNumero: sql<string>`MAX(${hausses.numero})`,
    })
    .from(hausses)
    .where(and(eq(hausses.userId, user.id), sql`${hausses.numero} LIKE ${prefix + '%'}`));

  let startIndex = 1;
  if (maxResult?.maxNumero) {
    const suffix = maxResult.maxNumero.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) {
      startIndex = parsed + 1;
    }
  }

  const haussesToInsert = Array.from({ length: body.nombre }, (_, i) => {
    const num = String(startIndex + i).padStart(3, '0');
    const numero = `${prefix}${num}`;
    return {
      userId: user.id,
      numero,
      type: body.type as
        | 'dadant_10'
        | 'dadant_12'
        | 'langstroth'
        | 'warre'
        | 'voirnot'
        | 'kenyane'
        | 'autre',
      nombreCadres: body.nombreCadres,
      anneeAcquisition: body.anneeAcquisition ?? null,
      qrCodeData: '', // placeholder, updated after insert with real id
    };
  });

  // Insert puis mise a jour des qrCodeData avec les vrais IDs
  const inserted = await db.insert(hausses).values(haussesToInsert).returning();

  if (inserted.length === 0) {
    throw createError({ statusCode: 500, message: 'Echec de la creation des hausses' });
  }

  // Promise.all rejette au premier echec — wrap dans try/catch pour ne pas
  // renvoyer un mix de hausses partiellement updateees comme si tout etait OK.
  // Si un seul update foire, on rollback en supprimant les hausses inserees
  // pour eviter un etat incoherent (hausses creees mais sans QR code).
  try {
    const updates = inserted.map((h) =>
      db
        .update(hausses)
        .set({ qrCodeData: `https://app.apigo.fr/hausses/${h.id}` })
        .where(eq(hausses.id, h.id)),
    );
    await Promise.all(updates);
  } catch (err) {
    console.error('[hausses/generer] update qrCodeData failed, rolling back', err);
    // Best-effort rollback : delete les hausses inserees pour eviter un etat
    // incoherent (hausses creees sans QR code). On utilise inArray sur les IDs
    // typees Drizzle — pas de SQL raw.
    await db
      .delete(hausses)
      .where(
        and(
          eq(hausses.userId, user.id),
          inArray(
            hausses.id,
            inserted.map((h) => h.id),
          ),
        ),
      )
      .catch(() => null);
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la generation des QR codes — operation annulee',
    });
  }

  const result = inserted.map((h) => ({
    ...h,
    qrCodeData: `https://app.apigo.fr/hausses/${h.id}`,
  }));

  setResponseStatus(event, 201);
  return { data: result };
});
