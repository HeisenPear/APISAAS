import { createError } from 'h3';
import { getPlanConfig, hasFeature, minimumPlanFor } from '~~/app/config/plans';
import type { PlanFeatures } from '~~/app/config/plans';
import type {
  DrizzleTransaction,
  InterventionContext,
  HandlerResult,
} from '~~/server/types/interventions';
import { handleMateriel } from './materiel';
import { handleControle } from './controle';
import { handleRecolte } from './recolte';
import { handleNourrissement } from './nourrissement';
import { handleEssaimage } from './essaimage';
import { handleDivision } from './division';
import { handleDeplacement } from './deplacement';
import { handleVarroa } from './varroa';
import { handlePesee } from './pesee';
import { handleCommentaire } from './commentaire';
import { handleEmpilement } from './empilement';
import { handleSanitaire } from './sanitaire';
import { handleTransvasement } from './transvasement';
import { handleReine } from './reine';

// ═══════════════════════════════════════════════════════════
// Dispatch map : catégorie → handler
// ═══════════════════════════════════════════════════════════

type HandlerFn = (tx: DrizzleTransaction, ctx: InterventionContext) => Promise<HandlerResult>;

export const handlerMap: Record<string, HandlerFn> = {
  materiel: handleMateriel,
  controle: handleControle,
  recolte: handleRecolte,
  nourrissement: handleNourrissement,
  essaimage: handleEssaimage,
  division: handleDivision,
  deplacement: handleDeplacement,
  varroa: handleVarroa,
  pesee: handlePesee,
  commentaire: handleCommentaire,
  empilement: handleEmpilement,
  sanitaire: handleSanitaire,
  transvasement: handleTransvasement,
  reine: handleReine,
};

/**
 * Catégories dont l'équivalent EN ROUTE DIRECTE est gaté sur une feature.
 *
 * Sans cette table, `POST /api/interventions/bulk` était un contournement
 * universel : la route n'a aucune entrée dans `ROUTE_GATES`, donc un compte
 * Découverte y enregistrait des récoltes (`POST /api/production/recoltes` est
 * pourtant gaté sur `production`) et des événements de reine
 * (`POST /api/ruches/*\/evenements-reine`, gaté sur `moduleReine`).
 * Constaté en prod : `laruchebleue17` a saisi une récolte le 19/05 par ce
 * chemin, sur un plan où `production` est faux.
 *
 * Le contrôle vit ICI et non dans les routes : `dispatchHandler` est le seul
 * passage obligé vers les handlers, donc tout appelant est couvert d'office.
 */
export const FEATURE_PAR_CATEGORIE: Partial<Record<string, keyof PlanFeatures>> = {
  recolte: 'production',
  reine: 'moduleReine',
};

/**
 * Dispatch une catégorie vers son handler.
 * Appelé par l'orchestrateur bulk.post.ts dans une transaction.
 */
export async function dispatchHandler(
  tx: DrizzleTransaction,
  categorie: string,
  ctx: InterventionContext,
): Promise<HandlerResult> {
  const handler = handlerMap[categorie];
  if (!handler) {
    throw new Error(`Handler inconnu pour la catégorie : ${categorie}`);
  }

  const feature = FEATURE_PAR_CATEGORIE[categorie];
  if (feature && !hasFeature(ctx.plan, feature)) {
    const requiredPlan = minimumPlanFor(feature);
    throw createError({
      statusCode: 402,
      statusMessage: 'Plan insuffisant',
      data: {
        code: 'PLAN_REQUIRED',
        feature,
        currentPlan: ctx.plan,
        requiredPlan,
        message: `Cette fonctionnalité nécessite le plan ${getPlanConfig(requiredPlan).label}`,
      },
    });
  }

  return handler(tx, ctx);
}

export {
  handleMateriel,
  handleControle,
  handleRecolte,
  handleNourrissement,
  handleEssaimage,
  handleDivision,
  handleDeplacement,
  handleVarroa,
  handlePesee,
  handleCommentaire,
  handleEmpilement,
  handleSanitaire,
  handleTransvasement,
  handleReine,
};
