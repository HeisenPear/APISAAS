import { z } from 'zod';
import { interventions, ruchers } from '~~/server/database/schema';

const rdvProSchema = z.object({
  date: z.coerce.date(),
  typeRdv: z.enum(['veterinaire', 'syndicat', 'fournisseur', 'client', 'administration', 'autre']),
  contact: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  rucherId: z.string().uuid().optional(),
});

/**
 * ⚠️ LE TYPE DE RETOUR EST DONNÉ, PAS INFÉRÉ — et ce n'est pas du zèle.
 *
 * Laissé à l'inférence, ce handler coûtait **34 secondes** de vérification de
 * types à lui seul (relevé `--generateTrace`), deuxième poste du projet après
 * `useGating`. Nitro type chaque route en dépliant
 * `Awaited<ReturnType<typeof import(…)>>` : sans annotation, TypeScript devait
 * remonter toute la chaîne de constructeurs de Drizzle pour savoir ce que rend
 * `.returning()`.
 *
 * L'annotation ne RECOPIE rien : `typeof interventions.$inferSelect` se DÉRIVE
 * du schéma. Ajouter une colonne demain la fait suivre toute seule — ce serait
 * une liste écrite à la main qui prendrait du retard.
 */
export default defineEventHandler(
  async (event): Promise<{ data: typeof interventions.$inferSelect }> => {
    await requireAuth(event);
    const { ownerId } = await assertCanWrite(event);
    const body = await readValidatedBody(event, rdvProSchema.parse);

    /**
     * ⚠️ LE `rucherId` VENAIT DU CLIENT ET N'ÉTAIT PAS VÉRIFIÉ.
     *
     * Zod garantissait seulement que c'est un UUID — pas qu'il désigne un rucher
     * de CET espace. Il suffisait donc de connaître l'identifiant d'un rucher
     * voisin pour y accrocher son rendez-vous : la ligne portait bien
     * `userId: ownerId`, mais sa clé étrangère pointait chez quelqu'un d'autre.
     * Deux conséquences : une lecture jointe par rucher pouvait faire apparaître
     * le rendez-vous là où il n'a rien à faire, et la réussite ou l'échec de
     * l'insertion disait si l'UUID existe — un oracle d'énumération.
     *
     * Ses quatorze voisines vérifiaient déjà ; celle-ci était la seule à ne pas
     * le faire. `assertFkBelongsToOwner` laisse passer `undefined` (le champ est
     * optionnel) et refuse tout le reste avec une phrase, pas un code.
     */
    await assertFkBelongsToOwner(
      ownerId,
      ruchers,
      ruchers.id,
      ruchers.userId,
      body.rucherId,
      'Rucher',
    );

    const [created] = await db
      .insert(interventions)
      .values({
        userId: ownerId,
        rucheId: null,
        rucherId: body.rucherId ?? null,
        dateVisite: body.date,
        type: 'rendez_vous_pro',
        donnees: { typeRdv: body.typeRdv, contact: body.contact ?? '' },
        notes: body.notes ?? null,
        photos: [],
      })
      .returning();

    if (!created) return internalError('Erreur lors de la creation');

    setResponseStatus(event, 201);
    return { data: created };
  },
);
