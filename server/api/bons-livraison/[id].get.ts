import { eq, and } from 'drizzle-orm';
import { bonsLivraison, clients, transactions } from '~~/server/database/schema';
import { chargerEmetteur } from '~~/server/utils/emetteur';
import { uuidSchema } from '~~/server/utils/validators';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  /**
   * ⚠️ L'IDENTIFIANT SE VALIDE AVANT D'ATTEINDRE SQL. Les routes de facture le
   * font depuis toujours (`uuidSchema.parse(id)`) ; les trois routes de bon de
   * livraison ne le faisaient pas. Un identifiant mal formé descendait jusqu'à
   * Postgres, qui répondait par une erreur de type — un 500 là où c'est un 400,
   * et une trace d'erreur pour une simple faute de frappe dans une URL.
   */
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [bl] = await db
    .select({
      id: bonsLivraison.id,
      numero: bonsLivraison.numero,
      dateCreation: bonsLivraison.dateCreation,
      dateLivraison: bonsLivraison.dateLivraison,
      statut: bonsLivraison.statut,
      lignes: bonsLivraison.lignes,
      transactionId: bonsLivraison.transactionId,
      notes: bonsLivraison.notes,
      adresseLivraison: bonsLivraison.adresseLivraison,
      codePostalLivraison: bonsLivraison.codePostalLivraison,
      villeLivraison: bonsLivraison.villeLivraison,
      createdAt: bonsLivraison.createdAt,
      updatedAt: bonsLivraison.updatedAt,
      // La trace d'envoi : est-ce parti, quand, et sinon pourquoi.
      emailEnvoyeLe: bonsLivraison.emailEnvoyeLe,
      emailMessageId: bonsLivraison.emailMessageId,
      emailDernierEchec: bonsLivraison.emailDernierEchec,
      /**
       * ⚠️ SANS CETTE COLONNE, L'ÉCRAN NE PEUT RIEN DIRE DU RELIQUAT.
       *
       * La sélection est explicite, colonne par colonne : une colonne absente
       * ici n'existe pas pour la page, même si la base la porte. Il lui faut
       * `reliquatDeId` pour deux phrases : « le bon du reliquat BL-… a déjà été
       * créé » (sinon le bouton propose un geste que la route refusera) et
       * « ce bon est lui-même le reliquat de BL-… », qui explique d'où il sort.
       */
      reliquatDeId: bonsLivraison.reliquatDeId,
      signatureNom: bonsLivraison.signatureNom,
      signatureLe: bonsLivraison.signatureLe,
      clientId: bonsLivraison.clientId,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      clientEntreprise: clients.entreprise,
      clientType: clients.type,
      clientAdresse: clients.adresse,
      clientCodePostal: clients.codePostal,
      clientVille: clients.ville,
      clientTelephone: clients.telephone,
      clientEmail: clients.email,
      clientAdresseLivraison: clients.adresseLivraison,
      clientCodePostalLivraison: clients.codePostalLivraison,
      clientVilleLivraison: clients.villeLivraison,
      transactionNumero: transactions.numero,
    })
    .from(bonsLivraison)
    .leftJoin(clients, eq(bonsLivraison.clientId, clients.id))
    .leftJoin(transactions, eq(bonsLivraison.transactionId, transactions.id))
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!bl) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });

  /**
   * ⚠️ LE DOCUMENT SORTAIT ANONYME. Cette route ne joignait pas `profils` :
   * le bon de livraison qui part PHYSIQUEMENT avec la marchandise n'affichait
   * ni nom, ni adresse, ni SIRET, ni logo. Le client recevait un papier qui ne
   * dit pas qui l'a livré, puis une facture qui, elle, le dit — et les deux
   * doivent se répondre, puisque l'un devient l'autre.
   *
   * Chargé APRÈS le bon, et seulement s'il existe : inutile d'interroger
   * `profils` pour répondre 404.
   */
  const emetteur = await chargerEmetteur(ownerId);

  /**
   * ⚠️ LE BON DU RELIQUAT DÉJÀ CRÉÉ — pour que l'écran n'offre JAMAIS un geste
   * que la route refusera.
   *
   * `reliquat.post.ts` refuse un second rattrapage, avec sa phrase : « Le bon
   * du reliquat BL-… a déjà été créé ». Sans cette lecture, la page n'en sait
   * rien : elle afficherait le bouton, l'apiculteur cliquerait, et recevrait un
   * refus pour un geste qu'on venait de lui proposer. C'est le défaut vécu que
   * `EcranPropose.feature` a été créé pour fermer sur les cartes de Maya —
   * proposer, puis refuser.
   *
   * Le lien est plus utile que l'absence de bouton : « le reliquat est le
   * BL-2026-0043 » dit où est passée la marchandise restante.
   */
  const [reliquat] = await db
    .select({ id: bonsLivraison.id, numero: bonsLivraison.numero })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.reliquatDeId, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  return { data: { ...bl, emetteur, reliquat: reliquat ?? null } };
});
