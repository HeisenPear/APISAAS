import { eq, and, desc, sql } from 'drizzle-orm';
import { mouvementsStock, stocks } from '~~/server/database/schema';

/**
 * Écriture centralisée des mouvements de stock.
 *
 * `stocks.quantite` reste la valeur courante autoritaire (aucun changement de
 * sémantique, aucun recalcul rétroactif) ; les mouvements sont l'HISTORIQUE
 * écrit à côté. C'est ce qui permet de remonter d'un pot vendu jusqu'à la
 * récolte, à la ruche, et à la courbe de miellée de la balance qui l'a produit.
 *
 * Les flux existants (achats, bons de livraison, cron d'achats récurrents)
 * écrivaient déjà dans cette table avec un `motif` en texte libre. On garde ce
 * champ tel quel comme LIBELLÉ LISIBLE, et on ajoute `referenceType`/
 * `referenceId` pour l'origine exploitable par la machine.
 */

export type TypeMouvement = 'entree' | 'sortie' | 'ajustement';

/** Origine machine d'un mouvement — ce qui permet de recoudre la traçabilité. */
export type OrigineMouvement =
  | 'recolte'
  | 'achat'
  | 'vente'
  | 'bon_livraison'
  | 'inventaire'
  | 'perte'
  | 'don'
  | 'transformation'
  | 'balance';

export interface MouvementInput {
  stockId: string;
  userId: string;
  type: TypeMouvement;
  /** Quantité TOUJOURS positive — c'est `type` qui porte le sens. */
  quantite: number;
  /** Libellé lisible affiché à l'utilisateur (ex. « Achat 2026-014 »). */
  motif?: string | null;
  origine?: OrigineMouvement | null;
  referenceId?: string | null;
  unite?: string | null;
  prixUnitaire?: number | null;
  dateMouvement?: Date | null;
  notes?: string | null;
}

/**
 * Enregistre un mouvement SANS toucher à `stocks.quantite`.
 * À utiliser quand l'appelant met déjà la quantité à jour lui-même (cas des
 * flux existants, qu'on ne veut surtout pas faire compter double).
 */
export async function enregistrerMouvement(input: MouvementInput): Promise<void> {
  await db.insert(mouvementsStock).values({
    stockId: input.stockId,
    userId: input.userId,
    type: input.type,
    quantite: Math.abs(input.quantite).toString(),
    motif: input.motif ?? null,
    referenceType: input.origine ?? null,
    referenceId: input.referenceId ?? null,
    unite: input.unite ?? null,
    prixUnitaire: input.prixUnitaire != null ? input.prixUnitaire.toFixed(2) : null,
    dateMouvement: input.dateMouvement ?? new Date(),
    notes: input.notes ?? null,
  });
}

/**
 * Enregistre un mouvement ET applique la variation sur `stocks.quantite`,
 * dans la même transaction. Pour les nouveaux flux (récolte issue d'une
 * balance, inventaire, perte…) où l'appelant n'a pas déjà bougé la quantité.
 *
 * La quantité est bornée à 0 : un stock négatif n'a aucun sens physique et
 * fausserait la valorisation.
 */
export async function enregistrerMouvementEtMajStock(input: MouvementInput): Promise<void> {
  const quantite = Math.abs(input.quantite);
  if (input.type === 'ajustement') {
    // Un ajustement d'inventaire POSE la quantité, il ne l'incrémente pas.
    await db
      .update(stocks)
      .set({ quantite: quantite.toString(), updatedAt: new Date() })
      .where(and(eq(stocks.id, input.stockId), eq(stocks.userId, input.userId)));
  } else {
    const signe = input.type === 'entree' ? '+' : '-';
    await db
      .update(stocks)
      .set({
        quantite: sql`GREATEST(0, ${stocks.quantite}::numeric ${sql.raw(signe)} ${quantite}::numeric)`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, input.stockId), eq(stocks.userId, input.userId)));
  }

  await enregistrerMouvement(input);
}

/** Historique d'un article, du plus récent au plus ancien. Rescopé sur le propriétaire. */
export async function historiqueMouvements(stockId: string, ownerId: string, limite = 100) {
  return withDbRetry(
    () =>
      db
        .select()
        .from(mouvementsStock)
        .where(and(eq(mouvementsStock.stockId, stockId), eq(mouvementsStock.userId, ownerId)))
        .orderBy(desc(mouvementsStock.dateMouvement))
        .limit(limite),
    'stocks:mouvements:historique',
  );
}

// ─── Fonctions pures (testables sans base) ────────────────────────────────

export interface MouvementCalcul {
  type: TypeMouvement;
  quantite: string | number;
  prixUnitaire?: string | number | null;
}

/**
 * Solde net d'une liste de mouvements. Un `ajustement` REDÉFINIT le solde
 * (inventaire physique) au lieu de s'ajouter : tout ce qui précède est effacé.
 */
export function soldeMouvements(mouvements: MouvementCalcul[]): number {
  let solde = 0;
  for (const m of mouvements) {
    const q = Math.abs(Number(m.quantite) || 0);
    if (m.type === 'ajustement') solde = q;
    else if (m.type === 'entree') solde += q;
    else solde -= q;
  }
  return Math.max(0, Math.round(solde * 100) / 100);
}

/**
 * Valeur des ENTRÉES sur une période — sert à valoriser ce qui est rentré en
 * stock. Les mouvements sans prix sont ignorés (on ne devine pas une valeur).
 */
export function valeurEntrees(mouvements: MouvementCalcul[]): number {
  let total = 0;
  for (const m of mouvements) {
    if (m.type !== 'entree') continue;
    const pu = m.prixUnitaire == null ? null : Number(m.prixUnitaire);
    if (pu == null || Number.isNaN(pu)) continue;
    total += Math.abs(Number(m.quantite) || 0) * pu;
  }
  return Math.round(total * 100) / 100;
}
