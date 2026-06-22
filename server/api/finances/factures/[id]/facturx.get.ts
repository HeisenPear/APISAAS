import { eq, and } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { generateFacturXml, calcTvaIntra } from '~~/server/utils/facturx-xml';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
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
    .where(and(eq(transactions.id, id!), eq(transactions.userId, user.id)))
    .limit(1);

  if (!row) notFound('Facture introuvable');

  const [profil] = await db
    .select({
      nom: profils.nom,
      prenom: profils.prenom,
      siret: profils.siret,
      adresse: profils.adresse,
      codePostal: profils.codePostal,
      ville: profils.ville,
      optionTvaDebits: profils.optionTvaDebits,
    })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil?.siret) {
    throw createError({ statusCode: 400, message: 'SIRET émetteur manquant dans vos paramètres.' });
  }

  const siren = profil.siret.slice(0, 9);
  const tvaIntra = calcTvaIntra(siren);

  // Calcul ventilation TVA depuis les lignes
  const lignes = (row!.lignes ?? []).map((l) => ({
    description: l.description,
    quantite: l.quantite,
    prixUnitaireHt: l.prixUnitaire ?? 0,
    tauxTva: l.tauxTva ?? 5.5,
    montantHt: Math.round(l.quantite * (l.prixUnitaire ?? 0) * 100) / 100,
  }));

  const ventilationMap: Record<number, { baseHt: number; montantTva: number }> = {};
  for (const l of lignes) {
    const tva = Math.round(l.montantHt * l.tauxTva) / 100;
    if (!ventilationMap[l.tauxTva]) ventilationMap[l.tauxTva] = { baseHt: 0, montantTva: 0 };
    ventilationMap[l.tauxTva]!.baseHt += l.montantHt;
    ventilationMap[l.tauxTva]!.montantTva += tva;
  }
  const ventilationTva = Object.entries(ventilationMap).map(([taux, vals]) => ({
    taux: Number(taux),
    ...vals,
  }));

  const totalHt = Number(row!.sousTotal ?? 0);
  const totalTva = Number(row!.tva ?? 0);
  const totalTtc = Number(row!.total ?? 0);

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
      denomination: [profil.prenom, profil.nom].filter(Boolean).join(' ') || 'APIGO',
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
    totaux: { totalHt, totalTva, totalTtc, ventilationTva },
    optionTvaDebits: profil.optionTvaDebits ?? false,
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
