import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '~~/server/database/schema';
import type { Plan } from '~~/app/config/plans';

// ─── Types pour les handlers d'intervention ─────────────

export type DrizzleTransaction = Parameters<
  Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]
>[0];

export interface InterventionContext {
  userId: string;
  inspectionId: string;
  rucheId: string;
  rucherId: string;
  donnees: Record<string, unknown>;
  /** ISO string de la date de visite — utilisé comme fallback par certains handlers */
  dateVisite?: string;
  /**
   * Plan de l'espace de travail. OBLIGATOIRE : le handler `division` crée des
   * ruches, et aucune route de dispatch n'est gatée sur la limite `ruches`
   * (`POST /api/interventions/bulk` n'a même aucun gate). Champ requis pour que
   * tout futur appelant de `dispatchHandler` ne COMPILE PAS sans fournir le
   * plan — la garde est ainsi vérifiée par TypeScript, pas par la vigilance.
   * Les appelants passent `'expert'` pour un admin (cf. `planEffectif`).
   */
  plan: Plan;
}

export interface HandlerResult {
  type: string;
  created?: Array<{ table: string; id: string }>;
  updated?: Array<{ table: string; id: string; changes: Record<string, unknown> }>;
  alerts?: Array<{ type: string; titre: string; message: string; priorite: string }>;
}
