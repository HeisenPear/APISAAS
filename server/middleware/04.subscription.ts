import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { compterRessource } from '~~/server/utils/compteursDePlan';
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

  // ─── Auth + profil ───────────────────────────────────────────────
  // On laisse les 401 propres passer silencieusement (la route gere son
  // propre requireAuth qui renverra 401), mais on logge les vrais errors
  // pour ne pas masquer un bug Supabase / reseau qui causerait un comportement
  // imprevu cote business (limite de plan ignoree par exemple).
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth(event);
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status !== 401) {
      console.error('[subscription middleware] requireAuth failed unexpectedly', err);
    }
    return; // La route gerera l'auth (et fail-open sur les checks de plan)
  }

  // Multi-utilisateurs : un membre opère sous le plan ET les limites du
  // propriétaire de l'espace, pas les siens. resolveWorkspace renvoie
  // ownerId = user.id pour un non-membre → aucun changement de comportement
  // pour les comptes solo (la quasi-totalité aujourd'hui).
  const ws = await resolveWorkspace(event);

  // Protégé : ce middleware garde TOUTES les écritures gatées. Un pool DB
  // momentanément mort (CONNECTION_DESTROYED après réveil de lambda) faisait
  // échouer en 500 une création pourtant légitime (rucher, facture…) — et sans
  // passer par un watchdog, le pool empoisonné n'était pas recyclé, ce qui
  // pouvait faire cascader l'erreur sur les requêtes suivantes.
  const profilRows = await withDbRetry(
    () =>
      db
        .select({
          plan: profils.plan,
          trialActive: profils.trialActive,
        })
        .from(profils)
        .where(eq(profils.id, ws.ownerId))
        .limit(1),
    'subscription:profil',
  );

  const profil = profilRows[0];
  if (!profil) return;

  // ─── ADMIN BYPASS ─── Aucune restriction pour les emails whitelistés
  if (isAdminEmail(user.email)) return;

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
    const maxAllowed = getLimit(plan, gate.limit);

    // ⚠️ `null` = ressource NON comptable, et ce n'est PAS zéro. L'ancien
    // compteur avait un `default: return 0` : une limite inconnue passait pour
    // « vide », donc toujours sous le plafond, donc jamais appliquée — en
    // silence. Devant une porte qu'on ne sait pas mesurer, on refuse.
    // Aucune route ne déclare aujourd'hui une limite non comptable, et
    // `tests/unit/server/compteursDePlan.test.ts` l'exige : cette branche est
    // un garde-fou, pas un chemin ordinaire.
    const currentCount = await withDbRetry(
      () => compterRessource(db, ws.ownerId, gate.limit!),
      `subscription:count:${gate.limit}`,
    );
    if (currentCount === null) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Plafond invérifiable',
        data: {
          code: 'LIMIT_UNCOUNTABLE',
          limit: gate.limit,
          message:
            'Impossible de vérifier le plafond de votre plan pour cette ressource. ' +
            'Rien n’a été enregistré.',
        },
      });
    }

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
