import { eq, and } from 'drizzle-orm';
import { uuidSchema } from '~~/server/utils/validators';
import { bonsLivraison } from '~~/server/database/schema';
import type { LigneBL } from '~~/server/database/schema';
import { appliquerStockBonLivraison, empreinteDuBon } from '~~/server/utils/bonLivraisonStock';
import { lignesBonLivraisonAvecTotaux } from '~~/server/utils/bonLivraison';
import type { LigneBonLivraisonSaisie } from '~~/server/utils/bonLivraison';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero,
} from '~~/server/utils/numerotation';
import { aUnReliquat, quantiteReliquat } from '~~/app/utils/bonLivraisonLigne';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LE BON DU RELIQUAT — ce qui reste à livrer, dans un document à part.
 *
 * Quand huit pots partent sur dix commandés, les deux manquants ne
 * disparaissent pas : ils restent dus. Cette route en fait un nouveau bon, en
 * BROUILLON, que l'apiculteur emportera à la prochaine tournée.
 *
 * ⚠️ C'EST UN GESTE EXPLICITE, JAMAIS AUTOMATIQUE. Créer le bon de rattrapage
 * dès qu'une livraison partielle est constatée fabriquerait un document
 * fantôme à chaque faute de frappe — et CLAUDE.md est catégorique : « rien ne
 * s'écrit sans accord, sauf ce qui sait se défaire entièrement ». Un bon de
 * rattrapage se défait (il se supprime, et le stock revient), mais il porte un
 * NUMÉRO pris dans la séquence : le créer par erreur laisse un trou. On
 * demande donc.
 *
 * ⚠️ ET IL NE PEUT ÊTRE CRÉÉ QU'UNE FOIS. Deux clics — ou deux requêtes
 * simultanées — produiraient deux bons de rattrapage, donc DEUX sorties de
 * stock pour une seule marchandise manquante. La colonne `reliquat_de_id` est
 * là d'abord pour ça : elle rend le lien interrogeable, donc le second appel
 * refusable. Ce n'est pas une garde parfaite contre la course HTTP (le dépôt a
 * la même dette ouverte sur la numérotation, cf. le corps de la PR), mais elle
 * ferme le cas réel : celui du double clic.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = uuidSchema.parse(getRouterParam(event, 'id'));

  const [source] = await db
    .select()
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!source) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });

  /**
   * Un bon ANNULÉ n'a rien livré : son empreinte de stock est vide, la
   * marchandise est déjà revenue. Un « reliquat » n'y a aucun sens — ce serait
   * une seconde sortie pour une livraison qui n'a pas eu lieu.
   */
  if (source.statut === 'annule') {
    throw createError({
      statusCode: 400,
      message:
        'Ce bon a été annulé : la marchandise est déjà revenue en stock. ' +
        'Créez un nouveau bon de livraison plutôt qu’un reliquat.',
    });
  }

  const lignesSource = (source.lignes ?? []) as LigneBL[];
  if (!lignesSource.some(aUnReliquat)) {
    throw createError({
      statusCode: 400,
      message:
        'Ce bon n’a rien en reliquat : tout ce qui était commandé a été livré, ' +
        'ou aucune quantité livrée n’a encore été saisie.',
    });
  }

  /**
   * ⚠️ LE CONTRÔLE D'UNICITÉ EST UNE LECTURE FILTRÉE SUR LE PROPRIÉTAIRE, comme
   * tout le reste : la RLS ne protège rien côté serveur.
   */
  const [dejaFait] = await db
    .select({ id: bonsLivraison.id, numero: bonsLivraison.numero })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.reliquatDeId, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (dejaFait) {
    throw createError({
      statusCode: 400,
      message: `Le bon du reliquat ${dejaFait.numero} a déjà été créé pour ce bon.`,
    });
  }

  /**
   * Les lignes du rattrapage : ce qui RESTE, et rien d'autre.
   *
   * `quantiteLivree` est délibérément ABSENTE des lignes créées — le nouveau
   * bon n'a rien livré. La reprendre y mettrait la quantité livrée du bon
   * PRÉCÉDENT, et le rattrapage naîtrait en se croyant déjà honoré.
   */
  const lignesReliquat: LigneBonLivraisonSaisie[] = lignesSource.filter(aUnReliquat).map((l) => ({
    description: l.description,
    quantite: quantiteReliquat(l),
    prixUnitaire: l.prixUnitaire,
    /**
     * ⚠️ LE MÊME DÉFAUT PAR DÉFAUT QUE PARTOUT AILLEURS : `5.5`. Il est écrit
     * ici et non lu de la source parce qu'une ligne de bon ancienne peut ne pas
     * porter de taux du tout, et que le schéma en exige un. C'est la valeur que
     * `ligneBonLivraisonSchema` pose déjà, et que les deux routes de conversion
     * reprennent — pas une quatrième idée du taux applicable.
     */
    tauxTva: l.tauxTva ?? 5.5,
    modePrix: l.modePrix,
    contenance: l.contenance,
    uniteContenance: l.uniteContenance,
    stockId: l.stockId,
    typeMiel: l.typeMiel,
    presentation: l.presentation,
    numLot: l.numLot,
    origineGeo: l.origineGeo,
    anneeRecolte: l.anneeRecolte,
  }));

  const prefixe = prefixeMillesime('bonLivraison', anneeParis(new Date()));
  const [dernier] = await db
    .select({ numero: bonsLivraison.numero })
    .from(bonsLivraison)
    .where(eq(bonsLivraison.userId, ownerId))
    .orderBy(...ordreNumeroDecroissant(bonsLivraison.numero))
    .limit(1);
  const numero = prochainNumero(dernier?.numero ?? null, prefixe, {
    politique: FAMILLES_NUMERO.bonLivraison.politique,
    largeur: FAMILLES_NUMERO.bonLivraison.largeur,
  });

  const lignesAvecTotaux = lignesBonLivraisonAvecTotaux(lignesReliquat);

  const [bon] = await db
    .insert(bonsLivraison)
    .values({
      userId: ownerId,
      clientId: source.clientId ?? null,
      numero,
      /**
       * ⚠️ LA DATE EST CELLE D'AUJOURD'HUI, PAS CELLE DE LA SOURCE. Le
       * rattrapage est un document neuf : lui donner la date du bon d'origine
       * l'antidaterait, et un bon de livraison est une pièce opposable.
       */
      dateCreation: new Date(),
      dateLivraison: null,
      statut: 'brouillon',
      lignes: lignesAvecTotaux,
      reliquatDeId: source.id,
      notes: `Reliquat du bon de livraison ${source.numero}.`,
      adresseLivraison: source.adresseLivraison ?? null,
      codePostalLivraison: source.codePostalLivraison ?? null,
      villeLivraison: source.villeLivraison ?? null,
    })
    .returning();

  if (!bon) {
    throw createError({
      statusCode: 500,
      message: 'Erreur lors de la création du bon du reliquat',
    });
  }

  /**
   * Le rattrapage tient du stock dès sa création, comme tout brouillon — et
   * c'est exactement ce qu'il faut : les deux pots rendus au stock quand la
   * livraison partielle a été constatée en ressortent ici, réservés pour la
   * prochaine tournée. Le compte est nul, et l'historique raconte les deux
   * mouvements.
   */
  await appliquerStockBonLivraison({
    ownerId,
    bonId: bon.id,
    numero: bon.numero,
    apres: empreinteDuBon(bon.statut, lignesAvecTotaux as LigneBL[]),
    motif: 'Bon de livraison',
  });

  setResponseStatus(event, 201);
  return { data: bon };
});
