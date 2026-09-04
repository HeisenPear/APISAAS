import { z } from 'zod';
import { uuidSchema } from '~~/server/utils/validators';
import { eq, and } from 'drizzle-orm';
import { bonsLivraison } from '~~/server/database/schema';
import { appliquerStockBonLivraison, empreinteDuBon } from '~~/server/utils/bonLivraisonStock';
import {
  ligneBonLivraisonSchema,
  lignesBonLivraisonAvecTotaux,
} from '~~/server/utils/bonLivraison';

const updateBLSchema = z.object({
  statut: z.enum(['brouillon', 'livre', 'facture', 'annule']).optional(),
  lignes: z.array(ligneBonLivraisonSchema).min(1).optional(),
  dateLivraison: z.coerce.date().nullish(),
  notes: z.string().trim().max(2000).nullish(),
  adresseLivraison: z.string().trim().max(500).nullish(),
  codePostalLivraison: z.string().trim().max(20).nullish(),
  villeLivraison: z.string().trim().max(200).nullish(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  /**
   * ⚠️ L'IDENTIFIANT SE VALIDE AVANT D'ATTEINDRE SQL. Les routes de facture le
   * font depuis toujours ; les quatre routes de bon de livraison ne le
   * faisaient pas. Un identifiant mal formé descendait jusqu'à Postgres, qui
   * répondait par une erreur de type — un 500 là où c'est un 400, et une trace
   * d'erreur pour une simple faute de frappe dans une URL.
   */
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, updateBLSchema.parse);

  const [existing] = await db
    .select({
      statut: bonsLivraison.statut,
      lignes: bonsLivraison.lignes,
      numero: bonsLivraison.numero,
    })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);
  if (!existing) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });

  const lignesApres =
    body.lignes !== undefined ? lignesBonLivraisonAvecTotaux(body.lignes) : (existing.lignes ?? []);
  const statutApres = body.statut ?? existing.statut;

  /**
   * ⚠️ CETTE ROUTE NE TRAITAIT QUE L'ANNULATION, ET DEUX AUTRES CHEMINS
   * PERDAIENT DU STOCK.
   *
   * · ÉDITER LES LIGNES ne bougeait RIEN. Créer un bon de dix pots retire dix ;
   *   corriger la ligne à deux ne rend rien ; annuler ensuite réintègre DEUX —
   *   la quantité alors stockée. Huit pots disparaissaient sans qu'aucun
   *   mouvement ne l'explique.
   * · RÉ-OUVRIR un bon annulé (`statut: 'brouillon'`, que ce schéma accepte)
   *   ne redéduisait jamais le stock rendu à l'annulation.
   *
   * Les deux disparaissent non pas en ajoutant des branches, mais en n'en
   * ayant plus : on compare l'empreinte AVANT et l'empreinte APRÈS.
   */
  await appliquerStockBonLivraison({
    ownerId,
    bonId: id,
    numero: existing.numero,
    avant: empreinteDuBon(existing.statut, existing.lignes),
    apres: empreinteDuBon(statutApres, lignesApres),
    motif: statutApres === 'annule' ? 'Annulation du bon' : 'Bon de livraison',
  });

  const [updated] = await db
    .update(bonsLivraison)
    .set({
      ...(body.statut !== undefined && { statut: body.statut }),
      // Les totaux sont RECALCULÉS ici : cette route écrivait `body.lignes`
      // tel quel, donc le total envoyé par le client — et perdait au passage
      // `modePrix` et `contenance`. Cf. `server/utils/bonLivraison.ts`.
      ...(body.lignes !== undefined && { lignes: lignesApres }),
      ...(body.dateLivraison !== undefined && { dateLivraison: body.dateLivraison }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.adresseLivraison !== undefined && { adresseLivraison: body.adresseLivraison }),
      ...(body.codePostalLivraison !== undefined && {
        codePostalLivraison: body.codePostalLivraison,
      }),
      ...(body.villeLivraison !== undefined && { villeLivraison: body.villeLivraison }),
      updatedAt: new Date(),
    })
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .returning();

  return { data: updated };
});
