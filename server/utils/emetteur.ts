import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import type { ProfilEmetteurDoc } from '~~/app/config/identite-emetteur';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUI SIGNE UN DOCUMENT — LES MÊMES COLONNES, PARTOUT.
 *
 * ⚠️ CETTE SÉLECTION EXISTAIT EN QUATRE EXEMPLAIRES, ET LA CINQUIÈME MANQUAIT.
 *
 * `app/config/identite-emetteur.ts` a supprimé la triple recopie de la RÈGLE
 * (« comment on compose le nom du vendeur »). Restait la recopie de la
 * LECTURE : quatre routes écrivaient à la main la liste des colonnes de
 * `profils` à lire, chacune avec sa propre idée de ce qu'un document affiche.
 * Trois d'entre elles omettaient `logoUrl`, pourtant vendu en Pro et Expert.
 *
 * Et la cinquième porte, celle du BON DE LIVRAISON, ne lisait RIEN DU TOUT :
 * `GET /api/bons-livraison/[id]` ne joignait même pas `profils`. Le document
 * qui part physiquement avec la marchandise sortait donc ANONYME — sans nom,
 * sans adresse, sans SIRET, sans logo. Le client recevait un papier qui ne dit
 * pas qui lui a livré, puis une facture qui, elle, le dit.
 *
 * Une colonne ajoutée ici arrive désormais sur tous les documents à la fois.
 *
 * ⚠️ ON NE REND QUE CE QU'UN DOCUMENT IMPRIME. Pas de plan, pas
 * d'identifiants Stripe, pas de préférences : c'est la même règle que
 * `GET /api/profils/emetteur`, et pour la même raison — un membre d'équipe n'a
 * aucune raison de lire le dossier d'abonnement du propriétaire pour imprimer
 * un bon de livraison. Les routes qui ont besoin de plus (le régime de TVA
 * pour une facture) ÉTENDENT cette liste, elles ne la remplacent pas.
 *
 * ⚠️ C'EST TOUJOURS LE PROPRIÉTAIRE DE L'EXPLOITATION, jamais l'utilisateur
 * connecté : passez `resolveOwnerId(event)`, pas l'identifiant de session. Un
 * technicien qui imprime un document y gravait sinon SON nom, sur une pièce
 * qui engage l'exploitation.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const COLONNES_EMETTEUR = {
  nom: profils.nom,
  prenom: profils.prenom,
  nomCommercial: profils.nomCommercial,
  logoUrl: profils.logoUrl,
  adresse: profils.adresse,
  codePostal: profils.codePostal,
  ville: profils.ville,
  siret: profils.siret,
  napi: profils.napi,
  email: profils.email,
  telephone: profils.telephone,
} as const;

/**
 * L'émetteur d'un document, ou `null` si le profil n'existe pas.
 *
 * Rendre `null` plutôt que lever : c'est à l'appelant de décider si le document
 * peut sortir sans identité. La facture REFUSE (cf. `refusIdentiteEmetteur`) ;
 * un bon de livraison en brouillon, lui, peut encore s'afficher.
 */
export async function chargerEmetteur(ownerId: string): Promise<ProfilEmetteurDoc | null> {
  const [profil] = await db
    .select(COLONNES_EMETTEUR)
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  return profil ?? null;
}
