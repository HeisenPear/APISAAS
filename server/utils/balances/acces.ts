// ═══════════════════════════════════════════════════════════════════════════
// Briques partagées par les routes /api/balances : schémas Zod, résolution
// d'une balance DANS L'ESPACE de l'utilisateur, génération du secret
// d'ingestion, débit de la route publique.
// ═══════════════════════════════════════════════════════════════════════════

import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { balances } from '~~/server/database/schema';

export type Balance = typeof balances.$inferSelect;

/** Secret d'ingestion : 32 octets d'entropie cryptographique, non devinable. */
export function genererIngestToken(): string {
  return `bal_${randomBytes(32).toString('hex')}`;
}

/** URL que l'utilisateur configure dans son capteur / son gateway. */
export function urlIngestion(origine: string, token: string): string {
  return `${origine.replace(/\/+$/, '')}/api/balances/ingest/${token}`;
}

/**
 * Champs modifiables d'une balance. `nom` est le seul obligatoire à la
 * création ; le reste est optionnel et borné (protège aussi la précision des
 * colonnes `decimal`).
 */
export const champsBalanceSchema = z.object({
  nom: z.string().trim().min(1).max(120),
  marque: z.string().trim().max(80).nullish(),
  modele: z.string().trim().max(80).nullish(),
  source: z.enum(['webhook', 'beep', 'csv', 'manuelle']).default('webhook'),
  identifiantExterne: z.string().trim().max(120).nullish(),
  rucheId: z.string().uuid().nullish(),
  hausseId: z.string().uuid().nullish(),
  rucherId: z.string().uuid().nullish(),
  poidsTare: z.number().min(0).max(500).nullish(),
  statut: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  seuilVariationKg: z.number().min(0.1).max(50).nullish(),
  seuilPoidsRecolteKg: z.number().min(0).max(500).nullish(),
  seuilBatteriePct: z.number().int().min(0).max(100).nullish(),
  seuilSilenceHeures: z.number().int().min(1).max(720).nullish(),
  notes: z.string().max(2000).nullish(),
});

/** Toutes les propriétés deviennent optionnelles pour le PUT (mise à jour partielle). */
export const majBalanceSchema = champsBalanceSchema.partial().extend({
  /** Révoque l'ancien secret d'ingestion et en émet un neuf. */
  regenererToken: z.boolean().optional(),
  /**
   * Correction manuelle de l'unité de poids. Normalement apprise toute seule à
   * la connexion de la balance ; ce réglage est le filet quand la déduction
   * s'est trompée. `null` remet en apprentissage automatique.
   */
  unitePoids: z.enum(['kg', 'g']).nullable().optional(),
});

/**
 * Charge une balance en la RESCOPANT sur le propriétaire de l'espace.
 * Toute route authentifiée doit passer par ici : c'est le point unique qui
 * garantit qu'on ne lit/écrit jamais la balance d'un autre locataire (le client
 * Drizzle est service-role et bypasse la RLS — l'isolation est ici, en code).
 */
export async function chargerBalance(ownerId: string, id: string): Promise<Balance | null> {
  const rows = await withDbRetry(
    () =>
      db
        .select()
        .from(balances)
        .where(and(eq(balances.id, id), eq(balances.userId, ownerId)))
        .limit(1),
    'balances:charger',
  );
  return rows[0] ?? null;
}

// ─── Débit de la route publique d'ingestion ─────────────────────────────────

/**
 * Un capteur normal émet toutes les 5 à 60 min ; une passerelle peut poster un
 * lot après une coupure réseau. 60 requêtes/min par token laisse largement la
 * place au trafic légitime tout en bornant un token compromis. Le rate-limit
 * général par IP (middleware 03) s'applique en plus.
 *
 * Store MÉMOIRE par instance serverless — même compromis que le middleware 03 :
 * ce n'est pas une limite globale, c'est un garde-fou anti-emballement.
 */
const DEBIT_MAX = 60;
const DEBIT_FENETRE_MS = 60_000;
const compteurs = new Map<string, { n: number; expireA: number }>();

export function verifierDebitIngestion(token: string, maintenant = Date.now()): boolean {
  // Purge opportuniste — le Map ne doit pas grossir indéfiniment sur une lambda chaude.
  if (compteurs.size > 5000) {
    for (const [k, v] of compteurs) if (maintenant >= v.expireA) compteurs.delete(k);
  }
  const courant = compteurs.get(token);
  if (!courant || maintenant >= courant.expireA) {
    compteurs.set(token, { n: 1, expireA: maintenant + DEBIT_FENETRE_MS });
    return true;
  }
  courant.n += 1;
  return courant.n <= DEBIT_MAX;
}
