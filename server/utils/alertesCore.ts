import { sql } from 'drizzle-orm';
import type { alertes } from '~~/server/database/schema';
import { intervalleVisiteJours } from '~~/server/utils/cadence';

// ═══════════════════════════════════════════════════════════════════════════
// SOCLE PARTAGÉ de génération d'alertes « visite », commun au déclenchement à la
// demande (dashboard → /api/alertes/generate) et au cron quotidien. Une seule
// implémentation = pas de divergence (ex. le flood à la création en masse).
// ═══════════════════════════════════════════════════════════════════════════

// Seuil de repli (automne). Le seuil réel dépend désormais de la SAISON via
// `intervalleVisiteJours(now)` — cf. server/utils/cadence.ts. Conservé pour les
// consommateurs qui importent encore la constante.
export const VISITE_DELAI_JOURS = 21;

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

/**
 * Alertes de visite pour un utilisateur :
 *  - ruches DÉJÀ visitées mais en retard (> seuil) → une alerte PAR ruche
 *    (action individuelle pertinente) ;
 *  - ruches JAMAIS visitées → UNE seule alerte groupée « première visite »
 *    (créer 100/1000 ruches = 1 notif, jamais 100). Patron réutilisable.
 */
export async function construireAlertesVisite(
  userId: string,
  dejaExiste: DejaExiste,
): Promise<AlerteInsert[]> {
  const ruches = (await db.execute(sql`
    SELECT r.id, r.numero, li.date_visite
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
  `)) as unknown as Array<{ id: string; numero: string; date_visite: string | null }>;

  const out: AlerteInsert[] = [];
  const seuilJours = intervalleVisiteJours(new Date());
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - seuilJours);

  // En retard mais déjà suivies → une par ruche.
  for (const r of ruches) {
    const derniere = r.date_visite ? new Date(r.date_visite) : null;
    if (derniere && derniere < cutoff && !dejaExiste('visite_requise', r.id)) {
      const joursDepuis = Math.floor((Date.now() - derniere.getTime()) / 86_400_000);
      out.push({
        userId,
        type: 'visite_requise',
        titre: `Ruche ${r.numero} non visitée`,
        message: `Dernière visite il y a ${joursDepuis} jours (seuil de saison : ${seuilJours} j)`,
        priorite: joursDepuis > 45 ? 'haute' : 'moyenne',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

  // Jamais visitées → une seule alerte groupée et douce.
  const nbJamais = ruches.filter((r) => !r.date_visite).length;
  if (nbJamais > 0 && !dejaExiste('premiere_visite')) {
    out.push({
      userId,
      type: 'premiere_visite',
      titre:
        nbJamais > 1
          ? `${nbJamais} ruches attendent leur première visite`
          : `Une ruche attend sa première visite`,
      message:
        'Fais un premier contrôle dès que tu peux : ça lance leur suivi et leur score de santé. 🐝',
      priorite: 'basse',
      actionUrl: '/ruches',
      lue: false,
    });
  }

  return out;
}

/** L'utilisateur a-t-il au moins une ruche active ? (pour ne pas nudge les comptes vides) */
export async function aDesRuchesActives(userId: string): Promise<boolean> {
  const res = (await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM ruches r WHERE r.user_id = ${userId} AND r.statut = 'active'
    ) AS ok
  `)) as unknown as Array<{ ok: boolean }>;
  return res[0]?.ok ?? false;
}

/** Nombre de ruches actives jamais contrôlées (pour résoudre « première visite »). */
export async function compterRuchesJamaisVisitees(userId: string): Promise<number> {
  const res = (await db.execute(sql`
    SELECT count(*)::int AS n FROM ruches r
    WHERE r.user_id = ${userId} AND r.statut = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM interventions i WHERE i.ruche_id = r.id AND i.type = 'controle'
      )
  `)) as unknown as Array<{ n: number }>;
  return res[0]?.n ?? 0;
}
