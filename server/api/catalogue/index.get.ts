import { eq, asc } from 'drizzle-orm';
import { produitsCatalogue } from '~~/server/database/schema';
import type { categorieStockEnum, categorieVenteEnum } from '~~/server/database/schema';
import { CATALOGUE_DEFAUT } from '~~/server/utils/catalogue-defaults';

type CatStock = (typeof categorieStockEnum.enumValues)[number];
type CatVente = (typeof categorieVenteEnum.enumValues)[number];

/** Liste le catalogue de l'utilisateur. Premier accès → sème les presets par défaut. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const existing = await db
    .select()
    .from(produitsCatalogue)
    .where(eq(produitsCatalogue.userId, user.id))
    .orderBy(asc(produitsCatalogue.groupe), asc(produitsCatalogue.nom));

  if (existing.length > 0) return { data: existing };

  const seeded = await db
    .insert(produitsCatalogue)
    .values(
      CATALOGUE_DEFAUT.map((p) => ({
        userId: user.id,
        nom: p.nom,
        categorie: p.categorie as CatStock,
        categorieVente: (p.categorieVente ?? null) as CatVente | null,
        tauxTva: p.tauxTva?.toString(),
        uniteTypique: p.uniteTypique,
        modePrix: p.modePrix,
        icon: p.icon,
        groupe: p.groupe,
        estDefaut: true,
      })),
    )
    .returning();

  seeded.sort(
    (a, b) => (a.groupe ?? '').localeCompare(b.groupe ?? '') || a.nom.localeCompare(b.nom),
  );
  return { data: seeded };
});
