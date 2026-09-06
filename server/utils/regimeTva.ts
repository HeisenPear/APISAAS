import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LA FRANCHISE EN BASE DE TVA — UNE SEULE RÈGLE, SUR LES QUATRE PORTES.
 *
 * L'article 293 B du CGI dispense certains exploitants de facturer la TVA. Le
 * dépôt en tenait compte à DEUX endroits — `finances/ventes.post.ts` (création
 * d'une facture) et `factures/[id].put.ts` (édition) — chacun avec sa propre
 * copie de la même requête et de la même boucle.
 *
 * ⚠️ LES DEUX AUTRES PORTES NE LA CONNAISSAIENT PAS. `convertir.post.ts` et
 * `facturer-groupe.post.ts` émettent de vraies factures depuis un bon de
 * livraison, en reprenant `l.tauxTva ?? 5.5`. Un apiculteur en franchise qui
 * convertissait un bon obtenait donc une facture NUMÉROTÉE portant 5,5 % de
 * TVA — une taxe qu'il n'a pas le droit de collecter, sur une pièce
 * comptable qu'il remet à son client.
 *
 * C'est le schéma que ce dépôt paie le plus cher, et il est déjà écrit dans
 * `convertir.post.ts` à propos de la NUMÉROTATION : « la correction n'a jamais
 * été back-portée sur les deux routes de bons de livraison ». Mêmes deux
 * routes, même oubli, autre règle.
 *
 * On ne recopie donc pas une troisième fois : la règle vit ici, et les quatre
 * portes l'appellent.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** L'exploitation est-elle dispensée de facturer la TVA ? */
export async function estEnFranchiseTva(ownerId: string): Promise<boolean> {
  const [profil] = await db
    .select({ franchiseTva: profils.franchiseTva })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  return profil?.franchiseTva === true;
}

/**
 * Remet à zéro le taux de chaque ligne quand l'exploitation est en franchise.
 *
 * ⚠️ ZÉRO, ET NON « PAS DE CHAMP ». Un taux absent retombe sur le défaut de
 * 5,5 % un peu partout dans le dépôt (`l.tauxTva ?? 5.5`) : effacer le champ
 * ferait donc réapparaître la TVA au premier recalcul. On POSE le zéro.
 *
 * ⚠️ ET ON NE FAIT RIEN QUAND L'EXPLOITATION N'EST PAS EN FRANCHISE. Écraser
 * les taux dans les deux cas reviendrait à supprimer la TVA de tout le monde ;
 * la garde est donc portée par la fonction, pas par chaque appelant — c'est
 * exactement l'endroit où un appelant distrait aurait fait l'erreur.
 */
export function appliquerFranchise<T extends { tauxTva?: number | string | null }>(
  lignes: T[],
  enFranchise: boolean,
): T[] {
  if (!enFranchise) return lignes;
  for (const ligne of lignes) ligne.tauxTva = 0;
  return lignes;
}
