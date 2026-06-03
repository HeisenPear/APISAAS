import { sql } from 'drizzle-orm';

/**
 * Tableau de bord analytics admin — comportement produit & présence.
 *
 * Agrège les événements d'activité (`evenements_activite`) et la présence
 * (`profils.derniere_activite_at`) pour donner une vue temps réel et des
 * tendances d'usage. Réservé aux admins.
 */
const EMPTY = {
  enLigne: [] as unknown[],
  kpis: {},
  inscriptionsParJour: [] as unknown[],
  activiteParJour: [] as unknown[],
  topPages: [] as unknown[],
  topActions: [] as unknown[],
  feed: [] as unknown[],
  schemaReady: false,
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    return { data: await collectAnalytics() };
  } catch (err) {
    // Tables/colonnes d'analytics absentes (db:push pas encore exécuté) :
    // on renvoie un état vide plutôt qu'une 500, le front affiche un message.
    console.error('[admin/analytics] query failed', err);
    return { data: EMPTY };
  }
});

async function collectAnalytics() {
  const [enLigne, kpisRows, inscriptionsParJour, activiteParJour, topPages, topActions, feed] =
    await Promise.all([
      // Qui est en ligne maintenant (actif < 5 min) + page courante
      db.execute(sql`
        select id, nom, prenom, email, plan,
               derniere_page as "dernierePage",
               derniere_activite_at as "derniereActiviteAt"
        from profils
        where derniere_activite_at > now() - interval '5 minutes'
        order by derniere_activite_at desc
        limit 100
      `),
      // KPIs de présence / activité
      db.execute(sql`
        select
          (select count(*) from profils where derniere_activite_at > now() - interval '5 minutes')::int as "enLigne",
          (select count(*) from profils where derniere_activite_at > now() - interval '24 hours')::int as "actifs24h",
          (select count(*) from profils where derniere_activite_at > now() - interval '7 days')::int as "actifs7j",
          (select count(*) from profils where derniere_activite_at > now() - interval '30 days')::int as "actifs30j",
          (select count(*) from evenements_activite where created_at >= date_trunc('day', now()))::int as "evenementsAujourdhui",
          (select count(*) from profils where created_at > now() - interval '7 days')::int as "inscriptions7j",
          (select count(*) from profils)::int as "totalUsers"
      `),
      // Inscriptions / jour (30 j)
      db.execute(sql`
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as jour, count(*)::int as count
        from profils
        where created_at > now() - interval '30 days'
        group by 1 order by 1
      `),
      // Activité / jour (14 j) : volume d'événements + utilisateurs actifs
      db.execute(sql`
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as jour,
               count(*)::int as evenements,
               count(distinct user_id)::int as utilisateurs
        from evenements_activite
        where created_at > now() - interval '14 days'
        group by 1 order by 1
      `),
      // Pages les plus vues (7 j)
      db.execute(sql`
        select nom, count(*)::int as count
        from evenements_activite
        where type = 'page' and created_at > now() - interval '7 days'
        group by nom order by count desc limit 12
      `),
      // Actions clés les plus fréquentes (7 j)
      db.execute(sql`
        select nom, count(*)::int as count
        from evenements_activite
        where type = 'action' and created_at > now() - interval '7 days'
        group by nom order by count desc limit 12
      `),
      // Flux d'activité récent — qui fait quoi
      db.execute(sql`
        select e.id, e.type, e.nom, e.titre, e.created_at as "createdAt",
               p.nom as "userNom", p.prenom as "userPrenom", p.email as "userEmail"
        from evenements_activite e
        join profils p on p.id = e.user_id
        order by e.created_at desc
        limit 40
      `),
    ]);

  return {
    enLigne: enLigne as unknown[],
    kpis: (kpisRows as Record<string, number>[])[0] ?? {},
    inscriptionsParJour: inscriptionsParJour as unknown[],
    activiteParJour: activiteParJour as unknown[],
    topPages: topPages as unknown[],
    topActions: topActions as unknown[],
    feed: feed as unknown[],
    schemaReady: true,
  };
}
