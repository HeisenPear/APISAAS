import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '~~/server/database/schema';

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
}

export interface HandlerResult {
  type: string;
  created?: Array<{ table: string; id: string }>;
  updated?: Array<{ table: string; id: string; changes: Record<string, unknown> }>;
  alerts?: Array<{ type: string; titre: string; message: string; priorite: string }>;
}
