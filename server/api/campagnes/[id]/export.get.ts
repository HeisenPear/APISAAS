import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import {
  organisations,
  campagnesCommande,
  commandesGroupees,
  produitsCampagne,
} from '~~/server/database/schema';
import { ligneTotalHt } from '~~/server/utils/pricing';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, ownerId)));

  if (!campagne) throw notFound('Campagne introuvable');

  // Fetch commandes + produits in parallel
  const [commandes, produits] = await Promise.all([
    db
      .select()
      .from(commandesGroupees)
      .where(eq(commandesGroupees.campagneId, campagneId))
      .orderBy(commandesGroupees.createdAt),
    db
      .select()
      .from(produitsCampagne)
      .where(eq(produitsCampagne.campagneId, campagneId))
      .orderBy(produitsCampagne.ordre),
  ]);

  // Lazy import to avoid SSR issues
  const ExcelJS = await import('exceljs').then((m) => m.default ?? m);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'APIGO';
  workbook.created = new Date();

  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF5A623' },
  };
  const headerFont = { bold: true, color: { argb: 'FF1C1C1E' } };

  // ── Sheet 1: Commandes ──
  const wsCommandes = workbook.addWorksheet('Commandes');
  wsCommandes.columns = [
    { header: 'Nom', key: 'nom', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Telephone', key: 'telephone', width: 18 },
    { header: 'Statut', key: 'statut', width: 14 },
    { header: 'Total HT', key: 'totalHt', width: 14 },
    { header: 'Total TTC', key: 'totalTtc', width: 14 },
    { header: 'Mode paiement', key: 'modePaiement', width: 18 },
    { header: 'Date', key: 'date', width: 18 },
  ];

  wsCommandes.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } } };
  });
  wsCommandes.getRow(1).height = 22;

  for (const cmd of commandes) {
    wsCommandes.addRow({
      nom: cmd.nomInvite ?? '',
      email: cmd.emailInvite ?? '',
      telephone: cmd.telephoneInvite ?? '',
      statut: cmd.statut,
      totalHt: cmd.totalHt ? `${Number(cmd.totalHt).toFixed(2)} €` : '',
      totalTtc: cmd.totalTtc ? `${Number(cmd.totalTtc).toFixed(2)} €` : '',
      modePaiement: cmd.modePaiement ?? '',
      date: new Date(cmd.createdAt).toLocaleDateString('fr-FR'),
    });
  }

  // Alternate row coloring
  wsCommandes.eachRow((row, rowNum) => {
    if (rowNum > 1 && rowNum % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAF8' } };
      });
    }
  });

  // ── Sheet 2: Recapitulatif produits ──
  const wsRecap = workbook.addWorksheet('Recapitulatif produits');
  wsRecap.columns = [
    { header: 'Produit', key: 'produit', width: 30 },
    { header: 'Quantite totale', key: 'quantite', width: 18 },
    { header: 'Total HT', key: 'totalHt', width: 18 },
  ];

  wsRecap.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } } };
  });
  wsRecap.getRow(1).height = 22;

  // Aggregate quantities per product from all commandes
  const recapMap = new Map<string, { nom: string; quantite: number; totalHt: number }>();

  for (const produit of produits) {
    recapMap.set(produit.id, { nom: produit.nom, quantite: 0, totalHt: 0 });
  }

  for (const cmd of commandes) {
    const lignes = cmd.lignes as Array<{
      produitId: string;
      quantite: number;
      prixUnitaireHt: number;
      totalLigneHt?: number;
      modePrix?: 'format' | 'poids' | null;
      contenance?: number | null;
    }>;
    if (!Array.isArray(lignes)) continue;

    for (const ligne of lignes) {
      const existing = recapMap.get(ligne.produitId);
      if (existing) {
        existing.quantite += ligne.quantite;
        // Le repli passe par `pricing.ts` : il recalculait `prixUnitaireHt ×
        // quantite`, donc sans `modePrix` ni `contenance` — dix seaux de 25 kg
        // à 10 €/kg seraient sortis à 100 € au lieu de 2 500 € dans le
        // récapitulatif exporté. Il ne sert plus qu'aux commandes anciennes :
        // les deux portes stockent désormais `totalLigneHt`.
        existing.totalHt +=
          ligne.totalLigneHt ??
          ligneTotalHt({
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaireHt,
            modePrix: ligne.modePrix,
            contenance: ligne.contenance,
          });
      }
    }
  }

  for (const recap of recapMap.values()) {
    wsRecap.addRow({
      produit: recap.nom,
      quantite: recap.quantite,
      totalHt: `${recap.totalHt.toFixed(2)} €`,
    });
  }

  wsRecap.eachRow((row, rowNum) => {
    if (rowNum > 1 && rowNum % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAF8' } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `campagne-${campagne.campagnes_commande.nom.replace(/[^a-zA-Z0-9-_]/g, '_')}.xlsx`;
  setResponseHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  return buffer;
});
