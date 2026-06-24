import { eq, and, sql } from 'drizzle-orm';
import { ruches } from '~~/server/database/schema';

/**
 * GET /api/analytics/suggestions
 * Suggestions d'actions prioritaires basées sur l'état des colonies
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  // Fetch all ruches with last intervention data
  const rows = await db
    .select({
      id: ruches.id,
      numero: ruches.numero,
      statut: ruches.statut,
      rucherId: ruches.rucherId,
      qualiteReine: ruches.qualiteReine,
      lastDateVisite: sql<string | null>`(
        SELECT date_visite FROM interventions WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
      lastForceColonie: sql<number | null>`(
        SELECT force_colonie FROM interventions WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
      lastVarroa: sql<number | null>`(
        SELECT varroa FROM interventions WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
      lastReserves: sql<number | null>`(
        SELECT reserves FROM interventions WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
      lastReineVue: sql<boolean | null>`(
        SELECT reine_vue FROM interventions WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
    })
    .from(ruches)
    .where(and(eq(ruches.userId, ownerId)));

  interface Suggestion {
    type: 'urgente' | 'attention' | 'info';
    rucheId: string;
    rucheNumero: string;
    titre: string;
    detail: string;
  }

  const suggestions: Suggestion[] = [];

  for (const row of rows) {
    // Ruches sans visite depuis > 21 jours
    if (row.lastDateVisite) {
      const days = Math.floor((Date.now() - new Date(row.lastDateVisite).getTime()) / 86400000);
      if (days > 30) {
        suggestions.push({
          type: 'attention',
          rucheId: row.id,
          rucheNumero: row.numero,
          titre: 'Visite en retard',
          detail: `Pas de visite depuis ${days} jours`,
        });
      }
    } else {
      suggestions.push({
        type: 'info',
        rucheId: row.id,
        rucheNumero: row.numero,
        titre: 'Première inspection à réaliser',
        detail: 'Aucune inspection enregistrée pour cette ruche',
      });
    }

    // Varroa critique
    if (row.lastVarroa != null && row.lastVarroa > 5) {
      suggestions.push({
        type: 'urgente',
        rucheId: row.id,
        rucheNumero: row.numero,
        titre: 'Varroa critique',
        detail: `Taux varroa : ${row.lastVarroa} — traitement urgent`,
      });
    }

    // Réserves basses
    if (row.lastReserves != null && row.lastReserves <= 1) {
      suggestions.push({
        type: 'urgente',
        rucheId: row.id,
        rucheNumero: row.numero,
        titre: 'Réserves insuffisantes',
        detail: 'Nourrir la colonie en urgence',
      });
    }

    // Colonie orpheline non traitée
    if (row.statut === 'orpheline') {
      suggestions.push({
        type: 'urgente',
        rucheId: row.id,
        rucheNumero: row.numero,
        titre: 'Colonie orpheline',
        detail: "Introduction d'une reine ou fusion recommandée",
      });
    }

    // Reine non vue lors de la dernière inspection
    if (row.lastReineVue === false && row.statut === 'active') {
      suggestions.push({
        type: 'attention',
        rucheId: row.id,
        rucheNumero: row.numero,
        titre: 'Reine non observée',
        detail: 'Vérifier la présence de la reine',
      });
    }
  }

  // Trier par urgence
  const ORDER = { urgente: 0, attention: 1, info: 2 };
  suggestions.sort((a, b) => ORDER[a.type] - ORDER[b.type]);

  return {
    data: {
      suggestions: suggestions.slice(0, 20),
      totalUrgentes: suggestions.filter((s) => s.type === 'urgente').length,
      totalAttention: suggestions.filter((s) => s.type === 'attention').length,
    },
  };
});
