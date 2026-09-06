import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { ordonnances, veterinaires } from '~~/server/database/schema';

const schema = z.object({
  veterinaireId: z.string().uuid().optional().nullable(),
  datePrescription: z.string().datetime().optional(),
  medicament: z.string().min(1).max(255).trim().optional(),
  substance: z.string().max(255).trim().optional(),
  posologie: z.string().max(1000).trim().optional(),
  dureeTraitementJours: z.number().int().min(1).optional().nullable(),
  delaiAttenteAvantRecolteJours: z.number().int().min(0).optional(),
  ruchesConcernees: z.array(z.string().uuid()).optional().nullable(),
  documentUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, schema.parse);

  /**
   * ⚠️ LE VÉTÉRINAIRE VENAIT DU CLIENT SANS ÊTRE VÉRIFIÉ — alors que la route
   * sœur, `index.post.ts`, le vérifie.
   *
   * Une ordonnance est une pièce SANITAIRE : elle porte le praticien qui l'a
   * signée, et c'est ce lien que le registre d'élevage remonte en cas de
   * contrôle. Y accrocher la fiche vétérinaire d'un autre apiculteur — nom,
   * numéro d'ordre, coordonnées — la fait entrer dans un document qui n'est
   * pas le sien.
   *
   * Quatrième asymétrie entre deux routes sœurs trouvée dans cette passe : le
   * DELETE de facture sans le garde du PUT, le PUT de facture sans celui du
   * POST, le PUT de session de greffage sans celui de la création, et
   * celle-ci. Écrire la règle deux fois, c'est la voir diverger.
   */
  await assertFkBelongsToOwner(
    ownerId,
    veterinaires,
    veterinaires.id,
    veterinaires.userId,
    body.veterinaireId,
    'Vétérinaire',
  );

  const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.datePrescription) updateData.datePrescription = new Date(body.datePrescription);

  const [updated] = await db
    .update(ordonnances)
    .set(updateData)
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, ownerId)))
    .returning();

  if (!updated) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { data: updated };
});
