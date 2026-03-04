import { alertes } from '~~/server/database/schema';
import type { DrizzleTransaction } from '~~/server/types/interventions';

// ═══════════════════════════════════════════════════════════
// Utilitaire alertes transactionnel
// Utilisé par les handlers d'intervention pour créer des
// alertes automatiques dans la même transaction PostgreSQL
// ═══════════════════════════════════════════════════════════

export interface CreateAlerteParams {
  userId: string;
  type: string;
  titre: string;
  message: string;
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
}

/**
 * Crée une alerte dans la même transaction Drizzle.
 * Utilisé par les handlers d'intervention pour les side-effects automatiques :
 * - Cellules royales détectées (haute)
 * - Force colonie <= 1 (haute)
 * - Chute varroa > 3/jour (haute)
 * - VPH > 2% (haute)
 * - Perte poids > 2 kg (moyenne)
 * - Mortalité constatée (moyenne)
 */
export async function createAlerte(tx: DrizzleTransaction, params: CreateAlerteParams) {
  const [alerte] = await tx
    .insert(alertes)
    .values({
      userId: params.userId,
      type: params.type,
      titre: params.titre,
      message: params.message,
      priorite: params.priorite,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      actionUrl: params.actionUrl,
    })
    .returning({ id: alertes.id });

  return alerte;
}

/**
 * Crée plusieurs alertes en batch dans la même transaction.
 */
export async function createAlertes(tx: DrizzleTransaction, params: CreateAlerteParams[]) {
  if (params.length === 0) return [];

  const result = await tx
    .insert(alertes)
    .values(
      params.map((p) => ({
        userId: p.userId,
        type: p.type,
        titre: p.titre,
        message: p.message,
        priorite: p.priorite,
        referenceType: p.referenceType,
        referenceId: p.referenceId,
        actionUrl: p.actionUrl,
      })),
    )
    .returning({ id: alertes.id });

  return result;
}
