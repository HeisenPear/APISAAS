import { eq, and } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { COLONNES_EMETTEUR } from '~~/server/utils/emetteur';
import { identiteEmetteur, refusIdentiteEmetteur } from '~~/app/config/identite-emetteur';
import { generateFacturXml, calcTvaIntra } from '~~/server/utils/facturx-xml';
import { ligneTotalHt, ligneTva, round2, totauxRemise } from '~~/server/utils/pricing';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Récupérer la facture complète
  const [row] = await db
    .select({
      id: transactions.id,
      numero: transactions.numero,
      dateTransaction: transactions.dateTransaction,
      dateEcheance: transactions.dateEcheance,
      sousTotal: transactions.sousTotal,
      remise: transactions.remise,
      tva: transactions.tva,
      total: transactions.total,
      lignes: transactions.lignes,
      categorieOperation: transactions.categorieOperation,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      clientEntreprise: clients.entreprise,
      clientSiret: clients.siret,
      clientSiren: clients.siren,
      clientAdresse: clients.adresse,
      clientCodePostal: clients.codePostal,
      clientVille: clients.ville,
      clientAdresseLivraison: clients.adresseLivraison,
      clientCodePostalLivraison: clients.codePostalLivraison,
      clientVilleLivraison: clients.villeLivraison,
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(and(eq(transactions.id, id!), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!row) notFound('Facture introuvable');

  const [profil] = await db
    .select({
      ...COLONNES_EMETTEUR,
      optionTvaDebits: profils.optionTvaDebits,
      franchiseTva: profils.franchiseTva,
    })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);

  if (!profil?.siret) {
    throw createError({ statusCode: 400, message: 'SIRET émetteur manquant dans vos paramètres.' });
  }

  /**
   * ⚠️ ON N'INVENTE PAS DE VENDEUR. Le nom légal valait auparavant
   * `[prenom, nom].join(' ') || 'APIGO'` : un profil vide produisait une
   * facture électronique signée du nom de l'ÉDITEUR du logiciel, avec le SIREN
   * de l'apiculteur juste à côté. Une plateforme agréée recoupe les deux — la
   * facture aurait été rejetée, et pour cause : elle désignait le mauvais
   * vendeur sur une pièce comptable.
   *
   * On refuse donc, avec la même mécanique que le SIRET absent trois lignes
   * plus haut, et une phrase qui dit où compléter.
   */
  const identite = identiteEmetteur(profil);
  const refus = refusIdentiteEmetteur(profil);
  if (refus) throw createError({ statusCode: 400, message: refus });

  const siren = profil.siret.slice(0, 9);
  const tvaIntra = calcTvaIntra(siren);

  /**
   * ⚠️ LA VENTILATION IGNORAIT LE TARIF AU POIDS, SUR LA FACTURE ÉLECTRONIQUE.
   *
   * `montantHt` valait `quantité × prixUnitaire`, sans jamais regarder
   * `modePrix` ni `contenance` — alors que la vente, elle, les gère (le
   * formulaire les reprend de l'article de stock, et `computeFactureTotals`
   * les applique). Dix seaux de 25 kg à 10 €/kg valent 2 500 € : la facture
   * stockait bien 2 500 € de HT et 137,50 € de TVA, et l'export Factur-X
   * déclarait à côté une ventilation de 100 € de base et 5,50 € de TVA.
   *
   * Un facteur 25, sur le document même dont ce produit vend la conformité —
   * et une ventilation qui ne correspond pas aux totaux rend la facture
   * électronique invalide, donc rejetable par la plateforme qui la reçoit.
   *
   * Le calcul passe désormais par `pricing.ts`, comme partout ailleurs.
   */
  const lignes = (row!.lignes ?? []).map((l) => ({
    description: l.description,
    quantite: l.quantite,
    prixUnitaireHt: l.prixUnitaire ?? 0,
    tauxTva: l.tauxTva ?? 5.5,
    montantHt: ligneTotalHt({
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire ?? 0,
      modePrix: l.modePrix,
      contenance: l.contenance,
    }),
  }));

  const totalHt = Number(row!.sousTotal ?? 0);
  const totalTva = Number(row!.tva ?? 0);
  const totalTtc = Number(row!.total ?? 0);

  /**
   * ⚠️ LA REMISE ÉTAIT ABSENTE DE CE GÉNÉRATEUR, ET LE XML NE S'ÉQUILIBRAIT
   * PLUS. La colonne `remise` n'était même pas lue : `TaxBasisTotalAmount`
   * recevait le HT AVANT remise pendant que `GrandTotalAmount` venait du TTC
   * APRÈS. Sur toute facture remisée, la règle BR-CO-15 de l'EN 16931 — « le
   * total TTC est la base taxable plus la TVA » — était donc violée, et une
   * plateforme agréée rejette la facture.
   *
   * Même règle que l'écran et que le serveur : `totauxRemise`.
   */
  const { pourcentage: remisePct, remiseMontant } = totauxRemise(totalHt, row!.remise);

  /**
   * ⚠️ LA VENTILATION SE DÉRIVE DE LA REMISE, PAS L'INVERSE — sans quoi elle
   * manque un centime sur les taux mixtes.
   *
   * Chaque base arrondie séparément, leur somme ne retombait pas sur BT-109
   * (mesuré : 84,32 au lieu de 84,31 sur une facture à deux taux remisée de
   * 12,5 %). On calcule donc la part de REMISE par taux, on la réconcilie sur
   * le montant du document, puis chaque base est le brut MOINS sa part. La
   * somme est alors exacte par construction : Σbrut − Σremise = HT − remise.
   */
  const brutParTaux: Record<number, number> = {};
  for (const l of lignes) {
    brutParTaux[l.tauxTva] = round2((brutParTaux[l.tauxTva] ?? 0) + l.montantHt);
  }
  const ventilationTva = Object.entries(brutParTaux).map(([taux, brut]) => ({
    taux: Number(taux),
    brutHt: brut,
    remiseHt: remisePct > 0 ? round2((brut * remisePct) / 100) : 0,
    baseHt: 0,
    montantTva: 0,
  }));

  /**
   * ⚠️ LES ARRONDIS DOIVENT RETOMBER SUR LEURS PIEDS, DEUX FOIS. Les parts sont
   * arrondies séparément : leur somme peut manquer ou dépasser d'un centime le
   * montant du document. On verse l'écart sur la plus grosse part — d'abord
   * pour la remise (sans quoi `AllowanceTotalAmount` ne serait pas la somme des
   * remises déclarées), puis pour la TVA (sans quoi `TaxTotalAmount` ne serait
   * pas la somme des `CalculatedAmount`, ce qu'exige BR-CO-14).
   */
  const recaler = (
    cle: 'remiseHt' | 'montantTva',
    cible: number,
    lignesV: typeof ventilationTva,
  ) => {
    if (!lignesV.length) return;
    const ecart = round2(cible - round2(lignesV.reduce((s, v) => s + v[cle], 0)));
    if (ecart === 0) return;
    const plusGrosse = lignesV.reduce((a, b) => (b[cle] > a[cle] ? b : a));
    plusGrosse[cle] = round2(plusGrosse[cle] + ecart);
  };

  recaler('remiseHt', remiseMontant, ventilationTva);
  for (const v of ventilationTva) {
    v.baseHt = round2(v.brutHt - v.remiseHt);
    v.montantTva = ligneTva(v.baseHt, v.taux);
  }
  recaler('montantTva', totalTva, ventilationTva);

  const dateIso = (
    row!.dateTransaction instanceof Date ? row!.dateTransaction : new Date(row!.dateTransaction)
  )
    .toISOString()
    .slice(0, 10);

  const echeanceIso = row!.dateEcheance
    ? (row!.dateEcheance instanceof Date ? row!.dateEcheance : new Date(row!.dateEcheance))
        .toISOString()
        .slice(0, 10)
    : null;

  const factureData = {
    numero: row!.numero ?? '',
    date: dateIso,
    echeance: echeanceIso,
    categorieOperation: (row!.categorieOperation ?? 'livraison_biens') as
      | 'livraison_biens'
      | 'prestation_services'
      | 'mixte',
    emetteur: {
      // BT-27 : le nom LÉGAL, toujours. Le nom commercial part en BT-28.
      denomination: identite.legal,
      nomCommercial: identite.affichage === identite.legal ? null : identite.affichage,
      siren,
      siret: profil.siret,
      tvaIntra,
      adresse: profil.adresse ?? '',
      codePostal: profil.codePostal ?? '',
      ville: profil.ville ?? '',
      pays: 'FR',
    },
    client: {
      denomination:
        row!.clientEntreprise ??
        [row!.clientNom, row!.clientPrenom].filter(Boolean).join(' ') ??
        'Client',
      siren: row!.clientSiren,
      siret: row!.clientSiret,
      tvaIntra: row!.clientSiren ? calcTvaIntra(row!.clientSiren) : null,
      adresse: row!.clientAdresse ?? '',
      codePostal: row!.clientCodePostal ?? '',
      ville: row!.clientVille ?? '',
      pays: 'FR',
      adresseLivraison: row!.clientAdresseLivraison,
      codePostalLivraison: row!.clientCodePostalLivraison,
      villeLivraison: row!.clientVilleLivraison,
    },
    lignes,
    totaux: { totalHt, remiseMontant, totalTva, totalTtc, ventilationTva },
    optionTvaDebits: profil.optionTvaDebits ?? false,
    franchiseTva: profil.franchiseTva ?? false,
  };

  const xmlContent = generateFacturXml(factureData);

  // Retourner le XML Factur-X standalone (CII, conforme EN 16931 / profil BASIC)
  // L'utilisateur dépose ce fichier sur sa plateforme agréée (Qonto, Pennylane, etc.)
  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="facture-${factureData.numero}-facturx.xml"`,
  );
  return xmlContent;
});
