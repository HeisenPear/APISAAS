import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { declarationsNapi, ruchers } from '~~/server/database/schema';

const schema = z.object({
  annee: z.number().int().min(2020).max(2100),
  dateDeclaration: z.string().datetime(),
  nombreTotalColonies: z.number().int().min(0),
  nombreRuchesProduction: z.number().int().min(0).default(0),
  nombreRuchettes: z.number().int().min(0).default(0),
  nombreNuclei: z.number().int().min(0).default(0),
  ruchersData: z.array(
    z.object({
      rucherId: z.string().uuid(),
      nom: z.string(),
      commune: z.string(),
      nbColonies: z.number().int().min(0),
    }),
  ),
  statut: z.enum(['brouillon', 'enregistre', 'recepisse_recu']).default('enregistre'),
  notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  /**
   * ⚠️ LES `rucherId` DE `ruchersData` VENAIENT DU CLIENT SANS ÊTRE VÉRIFIÉS.
   *
   * Zod garantissait la forme UUID, rien de plus. Le tableau part ensuite en
   * JSON dans la déclaration — le document qui sert à établir le récapitulatif
   * NAPI, c'est-à-dire une pièce que l'apiculteur transmet à l'administration.
   * Y laisser entrer l'identifiant d'un rucher qui n'est pas le sien, c'est
   * accepter qu'une déclaration légale référence le cheptel d'un autre.
   *
   * On vérifie en UNE requête : les identifiants demandés qui ne reviennent
   * pas de la table filtrée sur l'espace sont refusés, nommés.
   */
  const rucherIds = [...new Set(body.ruchersData.map((r) => r.rucherId))];
  if (rucherIds.length) {
    const connus = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(inArray(ruchers.id, rucherIds), eq(ruchers.userId, ownerId)));
    const vus = new Set(connus.map((r) => r.id));
    const inconnus = rucherIds.filter((id) => !vus.has(id));
    if (inconnus.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Référence invalide',
        message:
          inconnus.length === 1
            ? 'Un des ruchers déclarés est introuvable dans votre espace.'
            : `${inconnus.length} des ruchers déclarés sont introuvables dans votre espace.`,
      });
    }
  }

  // Upsert par année
  const existing = await db
    .select({ id: declarationsNapi.id })
    .from(declarationsNapi)
    .where(and(eq(declarationsNapi.userId, ownerId), eq(declarationsNapi.annee, body.annee)))
    .limit(1);

  const now = new Date();
  let result;

  if (existing.length > 0) {
    const [updated] = await db
      .update(declarationsNapi)
      .set({ ...body, dateDeclaration: new Date(body.dateDeclaration), updatedAt: now })
      .where(and(eq(declarationsNapi.id, existing[0]!.id), eq(declarationsNapi.userId, ownerId)))
      .returning();
    result = updated;
  } else {
    const [inserted] = await db
      .insert(declarationsNapi)
      .values({ ...body, dateDeclaration: new Date(body.dateDeclaration), userId: ownerId })
      .returning();
    result = inserted;
    setResponseStatus(event, 201);
  }

  return { data: result };
});
