import { eq, and, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { hausses } from '~~/server/database/schema';
import { ordreNumeroDecroissant, suiteDeNumeros } from '~~/server/utils/numerotation';
import { urlQrHausse } from '~~/app/utils/urlQr';

const genererSchema = z.object({
  nombre: z.number().int().min(1).max(100),
  type: z.enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot', 'kenyane', 'autre']),
  nombreCadres: z.number().int().min(1).max(20).default(10),
  prefixeNumero: z.string().max(10).optional(),
  anneeAcquisition: z.number().int().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, genererSchema.parse);

  const prefix = body.prefixeNumero ?? 'H-';

  /**
   * ⚠️ C'ÉTAIT `MAX(numero)`, ET IL SE TROMPE PASSÉ LA CENTAINE.
   *
   * `MAX` sur du texte compare caractère par caractère : entre « H-1000 » et
   * « H-999 », il retient « H-999 », parce que « 9 » l'emporte sur « 1 ». Le
   * parc d'un professionnel franchit ce cap — le zéro-padage tient sur trois
   * chiffres, donc la millième hausse écrit « H-1000 » et toutes les
   * générations suivantes repartaient de 1000, en fabriquant des DOUBLONS de
   * numéro. `hausses.numero` n'a aucune contrainte d'unicité : rien ne le
   * refusait, et deux hausses portant le même QR sont indiscernables sur le
   * terrain.
   *
   * `ordreNumeroDecroissant` trie d'abord par LONGUEUR : sur un format
   * zéro-padé, plus long veut dire plus grand.
   */
  const [dernier] = await db
    .select({ numero: hausses.numero })
    .from(hausses)
    .where(and(eq(hausses.userId, ownerId), sql`${hausses.numero} LIKE ${prefix + '%'}`))
    .orderBy(...ordreNumeroDecroissant(hausses.numero))
    .limit(1);

  // Une seule lecture, N numéros attribués localement : c'est ce qui rend le
  // lot cohérent — et c'est le modèle que le cron des achats récurrents,
  // lui, n'avait pas.
  const numeros = suiteDeNumeros(dernier?.numero ?? null, prefix, body.nombre, { largeur: 3 });

  const haussesToInsert = Array.from({ length: body.nombre }, (_, i) => {
    const numero = numeros[i]!;
    return {
      userId: ownerId,
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

  // Insert puis mise a jour des qrCodeData avec les vrais IDs.
  //
  // ⚠️ Cette colonne est un RELEVÉ de ce qui a été imprimé, pas une source :
  // les lectures (`qr.get`, `export-qr`) recalculent l'URL depuis l'id, ce qui
  // répare d'office les hausses générées quand l'URL écrite ici pointait vers
  // un sous-domaine qui n'a jamais existé.
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
        .set({ qrCodeData: urlQrHausse(h.id) })
        .where(and(eq(hausses.id, h.id), eq(hausses.userId, ownerId))),
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
          eq(hausses.userId, ownerId),
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
    qrCodeData: urlQrHausse(h.id),
  }));

  setResponseStatus(event, 201);
  return { data: result };
});
