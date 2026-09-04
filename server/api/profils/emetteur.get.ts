import { chargerEmetteur } from '~~/server/utils/emetteur';

/**
 * L'IDENTITÉ QUI SIGNE LES DOCUMENTS — celle du PROPRIÉTAIRE de l'exploitation.
 *
 * ⚠️ CETTE ROUTE EXISTE PARCE QUE LES DOCUMENTS COMPOSÉS CÔTÉ NAVIGATEUR
 * NOMMAIENT LA MAUVAISE PERSONNE. Deux sources coexistaient sans que personne
 * l'ait décidé :
 *
 *   · côté SERVEUR (facture, Factur-X, email d'envoi) → `resolveOwnerId`,
 *     donc le PROPRIÉTAIRE de l'espace de travail ;
 *   · côté CLIENT (registre d'élevage, bilan annuel, étiquette de pot,
 *     passeport) → `/api/profils/me` ou `authStore.profil`, donc
 *     l'UTILISATEUR CONNECTÉ.
 *
 * Un technicien ou un comptable qui imprime le registre d'élevage y gravait SON
 * nom — pas celui de l'exploitation dont c'est le cheptel. Sur un document
 * réglementaire présenté en contrôle sanitaire, ce n'est pas un détail
 * d'affichage.
 *
 * ⚠️ ON NE RENVOIE QUE CE QU'UN DOCUMENT AFFICHE. Pas de plan, pas
 * d'identifiants Stripe, pas de préférences : un membre d'équipe n'a aucune
 * raison de lire le dossier d'abonnement du propriétaire pour imprimer une
 * étiquette.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const profil = await chargerEmetteur(ownerId);

  if (!profil) notFound('Profil introuvable');

  return { data: profil };
});
