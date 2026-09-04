import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { serverSupabaseServiceRole } from '#supabase/server';
import { IMAGE_MIME_EXTENSIONS } from '~~/server/utils/image-mime';

/**
 * DELETE /api/profils/logo — retirer son logo.
 *
 * ⚠️ CETTE ROUTE N'EST PAS GATÉE, ET C'EST DÉLIBÉRÉ. Le TÉLÉVERSEMENT est une
 * fonctionnalité de formule (`route-gates.ts` : `logoExploitation`) ; le RETRAIT
 * n'en est pas une. Un apiculteur rétrogradé qui ne pourrait plus retirer son
 * logo serait enfermé dans un état qu'il n'a plus le droit d'avoir — un blocage
 * sans porte de sortie, ce que le produit s'interdit.
 *
 * Le fichier est effacé du bucket EN PLUS de la colonne : laisser l'image
 * publiquement accessible après un retrait, c'est ne pas l'avoir retirée. On
 * tente les trois extensions possibles — le chemin est déterministe
 * (`logos/<id>/logo.<ext>`), mais on ne sait pas laquelle a servi.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const supabase = serverSupabaseServiceRole(event);
  const chemins = [...new Set(Object.values(IMAGE_MIME_EXTENSIONS))].map(
    (ext) => `logos/${user.id}/logo.${ext}`,
  );

  /**
   * L'effacement du fichier est « au mieux » : si le bucket refuse, on retire
   * quand même la référence. L'inverse serait pire — une colonne qui pointe un
   * fichier qu'on a promis de supprimer.
   */
  const { error } = await supabase.storage.from('apiculture').remove(chemins);
  if (error) console.error(`[profils/logo] fichier non supprimé pour ${user.id}`, error.message);

  await db
    .update(profils)
    .set({ logoUrl: null, updatedAt: new Date() })
    .where(eq(profils.id, user.id));

  return { data: { logoUrl: null } };
});
