import { sql } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Tableau de bord analytics admin — comportement produit & présence.
 *
 * Agrège les événements d'activité (`evenements_activite`) et la présence
 * (`profils.derniere_activite_at`) pour donner une vue temps réel et des
 * tendances d'usage. Réservé aux admins.
 *
 * `?userId=<uuid>` ajoute un bloc `client` : fiche (email, téléphone, plan)
 * + historique d'activité de ce client — le « suivi par client ».
 */
const EMPTY = {
  enLigne: [] as unknown[],
  kpis: {},
  inscriptionsParJour: [] as unknown[],
  activiteParJour: [] as unknown[],
  topPages: [] as unknown[],
  topActions: [] as unknown[],
  feed: [] as unknown[],
  client: null as unknown,
  schemaReady: false,
};

const querySchema = z.object({ userId: z.string().uuid().optional() });

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { userId } = await getValidatedQuery(event, querySchema.parse);

  try {
    const [analytics, client] = await Promise.all([
      collectAnalytics(),
      userId ? collectClientDetail(userId) : Promise.resolve(null),
    ]);
    return { data: { ...analytics, client } };
  } catch (err) {
    // Tables/colonnes d'analytics absentes (db:push pas encore exécuté) :
    // on renvoie un état vide plutôt qu'une 500, le front affiche un message.
    console.error('[admin/analytics] query failed', err);
    return { data: EMPTY };
  }
});

/** Fiche + historique d'activité d'un client donné (suivi par client). */
async function collectClientDetail(userId: string) {
  const [profilRows, evenements, statsRows] = await Promise.all([
    db.execute(sql`
      select id, nom, prenom, email, telephone, plan,
             trial_active as "trialActive",
             onboarding_complete as "onboardingComplete",
             created_at as "createdAt",
             derniere_page as "dernierePage",
             derniere_activite_at as "derniereActiviteAt"
      from profils where id = ${userId} limit 1
    `),
    db.execute(sql`
      select id, type, nom, titre, created_at as "createdAt"
      from evenements_activite
      where user_id = ${userId}
      order by created_at desc
      limit 80
    `),
    db.execute(sql`
      select
        (select count(*) from evenements_activite where user_id = ${userId} and type = 'page' and created_at > now() - interval '7 days')::int as "pages7j",
        (select count(*) from evenements_activite where user_id = ${userId} and type = 'action' and created_at > now() - interval '7 days')::int as "actions7j",
        (select count(distinct date_trunc('day', created_at)) from evenements_activite where user_id = ${userId} and created_at > now() - interval '30 days')::int as "joursActifs30j"
    `),
  ]);

  const profil = (profilRows as unknown[])[0];
  if (!profil) return null;
  return {
    profil,
    evenements: evenements as unknown[],
    stats: (statsRows as unknown[])[0] ?? {},
  };
}

// Une requête qui échoue ne doit pas vider tout le tableau de bord : chaque
// bloc tombe sur une valeur neutre en cas d'erreur (ex: pic de latence DB sur
// une seule agrégation) plutôt que de rejeter le Promise.all entier.
async function safe(p: Promise<unknown>, label: string): Promise<unknown[]> {
  try {
    return (await p) as unknown[];
  } catch (err) {
    console.error(`[admin/analytics] bloc "${label}" a échoué:`, err);
    return [];
  }
}

async function collectAnalytics() {
  const [enLigne, kpisRows, inscriptionsParJour, activiteParJour, topPages, topActions, feed] =
    await Promise.all([
      // Qui est en ligne maintenant (actif < 5 min) + page courante
      safe(
        db.execute(sql`
          select id, nom, prenom, email, plan,
                 derniere_page as "dernierePage",
                 derniere_activite_at as "derniereActiviteAt"
          from profils
          where derniere_activite_at > now() - interval '5 minutes'
          order by derniere_activite_at desc
          limit 100
        `),
        'enLigne',
      ),
      // KPIs de présence / activité
      safe(
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
        'kpis',
      ),
      // Inscriptions / jour (30 j)
      safe(
        db.execute(sql`
          select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as jour, count(*)::int as count
          from profils
          where created_at > now() - interval '30 days'
          group by 1 order by 1
        `),
        'inscriptionsParJour',
      ),
      // Activité / jour (14 j) : volume d'événements + utilisateurs actifs
      safe(
        db.execute(sql`
          select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as jour,
                 count(*)::int as evenements,
                 count(distinct user_id)::int as utilisateurs
          from evenements_activite
          where created_at > now() - interval '14 days'
          group by 1 order by 1
        `),
        'activiteParJour',
      ),
      // Pages les plus vues (7 j)
      safe(
        db.execute(sql`
          select nom, count(*)::int as count
          from evenements_activite
          where type = 'page' and created_at > now() - interval '7 days'
          group by nom order by count desc limit 12
        `),
        'topPages',
      ),
      // Actions clés les plus fréquentes (7 j)
      safe(
        db.execute(sql`
          select nom, count(*)::int as count
          from evenements_activite
          where type = 'action' and created_at > now() - interval '7 days'
          group by nom order by count desc limit 12
        `),
        'topActions',
      ),
      // Flux d'activité récent — qui fait quoi (user_id + plan pour ouvrir
      // le suivi par client d'un clic)
      safe(
        db.execute(sql`
          select e.id, e.type, e.nom, e.titre, e.created_at as "createdAt",
                 e.user_id as "userId",
                 p.nom as "userNom", p.prenom as "userPrenom", p.email as "userEmail",
                 p.plan as "userPlan"
          from evenements_activite e
          join profils p on p.id = e.user_id
          order by e.created_at desc
          limit 60
        `),
        'feed',
      ),
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
