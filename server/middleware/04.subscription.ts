import { eq, and, gte, sql } from 'drizzle-orm';
import {
  profils,
  ruchers,
  ruches,
  clients,
  transactions,
  membres,
  templatesIntervention,
} from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { findMatchingGate, ROUTE_GATES } from '~~/app/config/route-gates';
import {
  getPlanConfig,
  hasFeature,
  getLimit,
  minimumPlanFor,
  minimumPlanForLimit,
} from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

// Constant à l'échelle du module — inutile de rescanner ROUTE_GATES par requête
const HAS_GET_GATE = Object.keys(ROUTE_GATES).some((k) => k.startsWith('GET '));

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const method = getMethod(event);
  const path = url.pathname;

  // ─── Routes toujours exemptées ───────────────────────────────────
  if (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/stripe/') ||
    path.startsWith('/api/public/') ||
    path.startsWith('/api/cron/') ||
    path.startsWith('/api/subscription/')
  )
    return;

  // ─── GET requests : exempter sauf si explicitement gatés ─────────
  if (method === 'GET' && !HAS_GET_GATE) return;

  // ─── Trouver le gate applicable ──────────────────────────────────
  const gate = findMatchingGate(method, path);
  if (!gate) return;

  // ─── Espace de travail (acteur + propriétaire effectif) ──────────
  // Les routes data sont gatées par le plan/quotas du PROPRIÉTAIRE (un membre
  // hérite des features de l'exploitation où il travaille) ; les routes compte
  // (`account`) restent gatées sur l'acteur lui-même.
  // On laisse les 401 propres passer silencieusement (la route gere son propre
  // requireAuth), mais on logge les vrais errors pour ne pas masquer un bug.
  let ws: Awaited<ReturnType<typeof resolveWorkspace>>;
  try {
    ws = await resolveWorkspace(event);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status !== 401) {
      console.error('[subscription middleware] resolveWorkspace failed unexpectedly', err);
    }
    return; // La route gerera l'auth (et fail-open sur les checks de plan)
  }

  // ─── ADMIN BYPASS ─── Aucune restriction pour les emails whitelistés (acteur)
  if (isAdminEmail(ws.actorEmail)) return;

  const scopeId = domainForPath(path) === 'account' ? ws.actorId : ws.ownerId;

  const profilRows = await db
    .select({
      plan: profils.plan,
      trialActive: profils.trialActive,
    })
    .from(profils)
    .where(eq(profils.id, scopeId))
    .limit(1);

  const profil = profilRows[0];
  if (!profil) return;

  const plan = profil.plan as Plan;

  // ─── Vérifier la feature ─────────────────────────────────────────
  if (gate.feature && !hasFeature(plan, gate.feature)) {
    const requiredPlan = minimumPlanFor(gate.feature);
    throw createError({
      statusCode: 402,
      statusMessage: 'Plan insuffisant',
      data: {
        code: 'PLAN_REQUIRED',
        feature: gate.feature,
        currentPlan: plan,
        requiredPlan,
        message: `Cette fonctionnalité nécessite le plan ${getPlanConfig(requiredPlan).label}`,
      },
    });
  }

  // ─── Vérifier la limite ──────────────────────────────────────────
  if (gate.limit) {
    const currentCount = await countUserResource(scopeId, gate.limit);
    const maxAllowed = getLimit(plan, gate.limit);

    if (maxAllowed !== Infinity && currentCount >= maxAllowed) {
      const requiredPlan = minimumPlanForLimit(gate.limit, currentCount + 1);
      throw createError({
        statusCode: 402,
        statusMessage: 'Limite du plan atteinte',
        data: {
          code: 'LIMIT_REACHED',
          limit: gate.limit,
          current: currentCount,
          max: maxAllowed,
          currentPlan: plan,
          requiredPlan,
          message: `Vous avez atteint la limite de ${maxAllowed} ${gate.limit} de votre plan ${getPlanConfig(plan).label}`,
        },
      });
    }
  }
});

async function countUserResource(userId: string, resource: string): Promise<number> {
  switch (resource) {
    case 'ruchers': {
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ruchers)
        .where(eq(ruchers.userId, userId));
      return r[0]?.count ?? 0;
    }
    case 'ruches': {
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ruches)
        .where(
          and(
            eq(ruches.userId, userId),
            sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
          ),
        );
      return r[0]?.count ?? 0;
    }
    case 'clients': {
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(clients)
        .where(eq(clients.userId, userId));
      return r[0]?.count ?? 0;
    }
    case 'facturesParMois': {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'vente'),
            gte(transactions.createdAt, startOfMonth),
          ),
        );
      return r[0]?.count ?? 0;
    }
    case 'membresEquipe': {
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(membres)
        .where(and(eq(membres.ownerId, userId), eq(membres.statut, 'acceptee')));
      return r[0]?.count ?? 0;
    }
    case 'templatesIntervention': {
      const r = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(templatesIntervention)
        .where(eq(templatesIntervention.userId, userId));
      return r[0]?.count ?? 0;
    }
    default:
      return 0;
  }
}
