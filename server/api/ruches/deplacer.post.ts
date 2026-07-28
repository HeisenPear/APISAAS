import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { ruches, ruchers, deplacementsRuches } from '~~/server/database/schema';

/**
 * POST /api/ruches/deplacer
 * Déplace une, plusieurs ou TOUTES les ruches d'un rucher vers un autre rucher.
 *
 * Deux façons de désigner les ruches, pour que « bouger tout un rucher » ne
 * demande pas d'envoyer un millier d'identifiants :
 *   - `rucheIds` : une sélection explicite ;
 *   - `rucherSourceId` : toutes les ruches de ce rucher.
 *
 * Le travail se fait en requêtes groupées (un UPDATE + un INSERT), donc
 * déplacer 1 000 ruches coûte autant que d'en déplacer une.
 */
const schema = z
  .object({
    rucheIds: z.array(z.string().uuid()).min(1).max(2000).optional(),
    rucherSourceId: z.string().uuid().optional(),
    rucherDestinationId: z.string().uuid(),
    date: z.string().datetime({ offset: true }).optional(),
    motif: z.enum(['transhumance', 'reorganisation', 'vente', 'autre']).default('reorganisation'),
    notes: z.string().max(2000).optional(),
  })
  .refine((b) => !!b.rucheIds !== !!b.rucherSourceId, {
    message: 'Fournir soit rucheIds, soit rucherSourceId (exclusifs)',
  });

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const body = await readValidatedBody(event, schema.parse);

  // Le rucher de destination doit appartenir à l'espace (sinon une ruche
  // atterrirait chez un autre locataire).
  const [destination] = await db
    .select({ id: ruchers.id, nom: ruchers.nom })
    .from(ruchers)
    .where(and(eq(ruchers.id, body.rucherDestinationId), eq(ruchers.userId, ownerId)))
    .limit(1);
  if (!destination) {
    throw createError({ statusCode: 404, message: 'Rucher de destination introuvable' });
  }

  // Rucher source : on vérifie son existence pour ne pas répondre « succès »
  // sur un identifiant erroné ou appartenant à un autre espace.
  if (body.rucherSourceId) {
    const [source] = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherSourceId), eq(ruchers.userId, ownerId)))
      .limit(1);
    if (!source) {
      throw createError({ statusCode: 404, message: "Rucher d'origine introuvable" });
    }
  }

  // Ruches à déplacer, avec leur rucher d'origine (nécessaire à la traçabilité).
  const cible = body.rucheIds
    ? and(inArray(ruches.id, [...new Set(body.rucheIds)]), eq(ruches.userId, ownerId))
    : and(eq(ruches.rucherId, body.rucherSourceId!), eq(ruches.userId, ownerId));

  const aDeplacer = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(cible);

  if (body.rucheIds && aDeplacer.length !== new Set(body.rucheIds).size) {
    return badRequest('Une ou plusieurs ruches sont introuvables ou non autorisées');
  }

  // Les ruches déjà dans le rucher de destination n'ont rien à faire.
  const mouvantes = aDeplacer.filter((r) => r.rucherId !== destination.id);
  if (mouvantes.length === 0) {
    return { data: { ruchesDeplacees: 0, destination, dejaSurPlace: aDeplacer.length } };
  }

  const idsMouvants = mouvantes.map((r) => r.id);
  const dateDeplacement = body.date ? new Date(body.date) : new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(ruches)
      .set({ rucherId: destination.id, updatedAt: new Date() })
      .where(and(inArray(ruches.id, idsMouvants), eq(ruches.userId, ownerId)));

    // Historique : une ligne par ruche (alimente la timeline de la ruche et
    // le registre d'élevage) — insérée en une seule requête.
    await tx.insert(deplacementsRuches).values(
      mouvantes.map((r) => ({
        userId: ownerId,
        rucheId: r.id,
        rucherSourceId: r.rucherId,
        rucherDestinationId: destination.id,
        dateDeplacement,
        motif: body.motif,
        notes: body.notes ?? null,
      })),
    );
  });

  return {
    data: {
      ruchesDeplacees: mouvantes.length,
      dejaSurPlace: aDeplacer.length - mouvantes.length,
      destination,
    },
  };
});
