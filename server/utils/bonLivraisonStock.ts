import { eq, and, sql } from 'drizzle-orm';
import { mouvementsStock, stocks } from '~~/server/database/schema';
import type { LigneBL } from '~~/server/database/schema';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CE QU'UN BON DE LIVRAISON RETIRE DU STOCK — UNE SEULE MÉCANIQUE.
 *
 * ⚠️ QUATRE PORTES BOUGEAIENT LE STOCK, ET ELLES NE SE RESSEMBLAIENT PAS.
 *
 *   · `index.post.ts`  — création : `quantite - ligne.quantite`, AUCUNE trace ;
 *   · `[id].put.ts`    — annulation : `+ ligne.quantite`, plus une trace SANS
 *                        `referenceType` ni `referenceId`, motif « Annulation BL » ;
 *   · `[id].delete.ts` — suppression : `+ ligne.quantite`, AUCUNE trace ;
 *   · `[id].put.ts`    — édition des lignes : RIEN DU TOUT.
 *
 * Trois conséquences, de la plus discrète à la plus coûteuse :
 *
 * 1. L'HISTORIQUE ÉTAIT INCOHÉRENT. `mouvements_stock` portait des entrées
 *    « Annulation BL » sans la sortie correspondante — un mouvement qui annule
 *    quelque chose qui n'a jamais été écrit. Impossible de rapprocher le stock
 *    de son historique, alors que c'est précisément ce que la table promet :
 *    « remonter d'un pot vendu jusqu'à la récolte ».
 *
 * 2. ON NE POUVAIT PAS REMONTER AU BON. Le schéma prévoit `referenceType` et
 *    `referenceId`, et cite `'bon_livraison'` en exemple. Aucune des quatre
 *    portes ne les écrivait.
 *
 * 3. ÉDITER LES LIGNES PERDAIT DU STOCK, DÉFINITIVEMENT. Créer un bon de dix
 *    pots retire dix. Corriger la ligne à deux ne rend rien. Annuler ensuite
 *    réintègre DEUX — la quantité alors stockée. Huit pots disparaissent du
 *    stock sans qu'aucun mouvement ne l'explique. Le défaut est ARMÉ et non
 *    vivant (l'interface n'appelle aujourd'hui `PUT` qu'avec `{ statut }`),
 *    mais la route est un point d'entrée authentifié comme un autre.
 *
 * ─── LA FORME RETENUE ──────────────────────────────────────────────────────
 * Une seule question, posée partout : « de quoi le bon a-t-il besoin AVANT, de
 * quoi a-t-il besoin APRÈS ? ». Le reste est un delta.
 *
 *   création    : avant = rien,            après = les lignes  → sortie
 *   édition     : avant = anciennes lignes, après = nouvelles  → delta
 *   annulation  : avant = les lignes,       après = rien       → entrée
 *   suppression : avant = les lignes,       après = rien       → entrée
 *
 * Le jour où l'apiculteur décidera que le stock se déduit à la LIVRAISON et
 * non à la création, il n'y aura qu'un appel à déplacer — pas quatre
 * arithmétiques à réécrire.
 *
 * ⚠️ ON NE BORNE PAS À ZÉRO, CONTRAIREMENT À `enregistrerMouvementEtMajStock`.
 * Ce n'est pas un oubli. Rien n'empêche aujourd'hui de livrer plus que ce qu'on
 * a en stock, et c'est un choix qui appartient à l'apiculteur — un stock mal
 * tenu ne doit pas bloquer une livraison réelle. Mais si la sortie était bornée
 * à zéro, la réintégration, elle, ne le serait pas : sortir 10 d'un stock de 3
 * donnerait 0, et l'annulation rendrait 10. Sept pots créés de rien. Un stock
 * négatif se voit et se corrige ; du stock fantôme se propage dans la
 * valorisation. On garde donc une arithmétique EXACTEMENT réversible.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * LES ÉTATS DANS LESQUELS UN BON TIENT DU STOCK.
 *
 * ⚠️ C'EST ICI, ET NULLE PART AILLEURS, QUE SE DÉCIDE « QUAND LE STOCK PART ».
 * Aujourd'hui le stock est retiré dès la CRÉATION : un brouillon tient donc
 * déjà la marchandise. L'apiculteur a demandé que ce soit à la LIVRAISON — un
 * changement qui touche des bons DÉJÀ EN BASE, donc une décision qui lui
 * appartient et qui n'est pas prise ici. Le jour où elle le sera, il suffira de
 * retirer `'brouillon'` de cette liste : les quatre portes suivront, puisque
 * toutes calculent leur empreinte à partir d'elle.
 *
 * `annule` en est absent, et c'est ce qui rend l'annulation réversible sans
 * cas particulier : un bon annulé a une empreinte VIDE, donc le delta rend
 * exactement ce qui avait été pris.
 */
export const STATUTS_QUI_TIENNENT_LE_STOCK = ['brouillon', 'livre', 'facture'] as const;

export function tientLeStock(statut: string | null | undefined): boolean {
  return (STATUTS_QUI_TIENNENT_LE_STOCK as readonly string[]).includes(statut ?? '');
}

/**
 * L'EMPREINTE D'UN BON : ses lignes s'il tient du stock, rien sinon.
 *
 * Cette seule fonction absorbe tous les cas particuliers que les quatre routes
 * traitaient à la main — ou ne traitaient pas :
 *
 *   création          empreinte(absent) → empreinte(brouillon, lignes)  = sortie
 *   édition           empreinte(statut, avant) → empreinte(statut, après) = delta
 *   annulation        empreinte(livre, lignes) → empreinte(annule, …)   = entrée
 *   RÉ-OUVERTURE      empreinte(annule, …) → empreinte(brouillon, lignes) = sortie
 *   suppression       empreinte(brouillon, lignes) → empreinte(absent)   = entrée
 *
 * La ré-ouverture est le cas que personne n'avait vu : le schéma d'édition
 * accepte `statut: 'brouillon'` sur un bon annulé, et le stock ne repartait
 * jamais. Il ne s'agit pas d'ajouter une branche, mais de ne plus en avoir.
 */
export function empreinteDuBon(
  statut: string | null | undefined,
  lignes: ReadonlyArray<LigneBL> | null | undefined,
): ReadonlyArray<LigneBL> {
  return tientLeStock(statut) ? (lignes ?? []) : [];
}

/** Ce que le bon retire du stock, article par article. Fonction PURE. */
export function empreinteStock(
  lignes: ReadonlyArray<LigneBL> | null | undefined,
): Map<string, number> {
  const par = new Map<string, number>();
  for (const ligne of lignes ?? []) {
    if (!ligne.stockId) continue;
    const quantite = Number(ligne.quantite);
    if (!Number.isFinite(quantite) || quantite === 0) continue;
    par.set(ligne.stockId, (par.get(ligne.stockId) ?? 0) + quantite);
  }
  return par;
}

export interface VariationStock {
  stockId: string;
  /** Positive = le bon prend DAVANTAGE (sortie) ; négative = il rend (entrée). */
  variation: number;
}

/**
 * Le mouvement à appliquer pour passer d'un état du bon à l'autre. Fonction PURE.
 *
 * Les articles qui ne bougent pas sont ABSENTS du résultat : écrire un
 * mouvement de zéro polluerait l'historique sans rien dire.
 */
export function deltaStock(
  avant: ReadonlyArray<LigneBL> | null | undefined,
  apres: ReadonlyArray<LigneBL> | null | undefined,
): VariationStock[] {
  const empreinteAvant = empreinteStock(avant);
  const empreinteApres = empreinteStock(apres);
  const articles = new Set([...empreinteAvant.keys(), ...empreinteApres.keys()]);

  const variations: VariationStock[] = [];
  for (const stockId of articles) {
    const variation =
      Math.round(((empreinteApres.get(stockId) ?? 0) - (empreinteAvant.get(stockId) ?? 0)) * 100) /
      100;
    if (variation !== 0) variations.push({ stockId, variation });
  }
  return variations.sort((a, b) => a.stockId.localeCompare(b.stockId));
}

export interface ContexteStockBl {
  ownerId: string;
  /** L'identifiant du bon — écrit en `referenceId`, pour remonter au document. */
  bonId: string;
  /** Son numéro, pour le libellé lisible : « Bon de livraison BL-2026-0007 ». */
  numero: string | null;
  avant?: ReadonlyArray<LigneBL> | null;
  apres?: ReadonlyArray<LigneBL> | null;
  /** Ce qui a provoqué le mouvement, en clair. */
  motif: string;
}

/**
 * Applique le delta au stock ET écrit sa trace, article par article.
 *
 * ⚠️ LA CONDITION DE PROPRIÉTÉ EST DANS LE `where` DE L'ÉCRITURE, pas dans un
 * contrôle qui la précède. La RLS ne protège rien côté serveur (`db.ts` ouvre
 * une connexion service-role qui la contourne) : c'est ce `eq(stocks.userId,
 * ownerId)` qui empêche un bon d'une exploitation de bouger le stock d'une
 * autre. Un identifiant d'article inconnu ne met donc simplement aucune ligne
 * à jour.
 */
export async function appliquerStockBonLivraison(ctx: ContexteStockBl): Promise<VariationStock[]> {
  const variations = deltaStock(ctx.avant, ctx.apres);
  const libelle = ctx.numero ? `${ctx.motif} ${ctx.numero}` : ctx.motif;

  for (const { stockId, variation } of variations) {
    const signe = variation > 0 ? '-' : '+';
    const quantite = Math.abs(variation);

    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric ${sql.raw(signe)} ${quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, stockId), eq(stocks.userId, ctx.ownerId)));

    await db.insert(mouvementsStock).values({
      stockId,
      userId: ctx.ownerId,
      type: variation > 0 ? 'sortie' : 'entree',
      quantite: quantite.toString(),
      motif: libelle,
      referenceType: 'bon_livraison',
      referenceId: ctx.bonId,
    });
  }

  return variations;
}
