import { sql } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const rows = (await db.execute(sql`
    SELECT
      l->>'typeMiel' AS type_miel,
      SUM((l->>'quantite')::numeric) AS total_kg,
      SUM(COALESCE((l->>'total')::numeric, 0)) AS total_ht,
      AVG(NULLIF((l->>'prixUnitaire')::numeric, 0)) AS prix_moyen,
      COUNT(*) AS nb_lignes
    FROM ${transactions},
         jsonb_array_elements(lignes) AS l
    WHERE user_id = ${user.id}
      AND type = 'vente'
      AND statut NOT IN ('annulee', 'brouillon')
      AND l->>'typeMiel' IS NOT NULL
    GROUP BY l->>'typeMiel'
    ORDER BY total_ht DESC
  `)) as unknown as Array<{
    type_miel: string;
    total_kg: string;
    total_ht: string;
    prix_moyen: string | null;
    nb_lignes: string;
  }>;

  return {
    data: rows.map((r) => ({
      typeMiel: r.type_miel,
      totalKg: r.total_kg,
      totalHt: r.total_ht,
      prixMoyen: r.prix_moyen ?? '0',
      nbLignes: r.nb_lignes,
    })),
  };
});
