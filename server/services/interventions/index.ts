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
