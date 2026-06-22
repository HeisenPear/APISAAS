import { eq, and, sql } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

/**
 * GET /api/export/ruches.xlsx
 * Export Excel de toutes les ruches avec la dernière intervention (Beekube parity)
 */
export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  // Lazy import to avoid SSR issues
  const ExcelJS = await import('exceljs').then((m) => m.default ?? m);

  // Fetch ruches with rucher name and last intervention date
  const rows = await db
    .select({
      id: ruches.id,
      numero: ruches.numero,
      type: ruches.type,
      statut: ruches.statut,
      raceAbeille: ruches.raceAbeille,
      qualiteReine: ruches.qualiteReine,
      dateInstallation: ruches.dateInstallation,
      origineEssaim: ruches.origineEssaim,
      marquageReine: ruches.marquageReine,
      nombreCadres: ruches.nombreCadres,
      nombreHausses: ruches.nombreHausses,
      notes: ruches.notes,
      rucherNom: ruchers.nom,
      rucherCommune: ruchers.commune,
      lastVisite: sql<string | null>`(
        SELECT date_visite FROM interventions
        WHERE ruche_id = ${ruches.id}
        ORDER BY date_visite DESC LIMIT 1
      )`,
    })
    .from(ruches)
    .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
    .where(and(eq(ruches.userId, user.id)))
    .orderBy(ruchers.nom, ruches.numero);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'APIGO';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Ruches');

  // Header style
  const headerFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFF5A623' },
  };
  const headerFont = { bold: true, color: { argb: 'FF1C1C1E' } };

  ws.columns = [
    { header: 'Numéro', key: 'numero', width: 15 },
    { header: 'Rucher', key: 'rucher', width: 20 },
    { header: 'Commune', key: 'commune', width: 18 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Statut', key: 'statut', width: 12 },
    { header: 'Race', key: 'race', width: 14 },
    { header: 'Qualité Reine', key: 'qualiteReine', width: 14 },
    { header: 'Cadres', key: 'cadres', width: 8 },
    { header: 'Hausses', key: 'hausses', width: 8 },
    { header: 'Installation', key: 'installation', width: 14 },
    { header: 'Origine', key: 'origine', width: 16 },
    { header: 'Marquage Reine', key: 'marquage', width: 14 },
    { header: 'Dernière Visite', key: 'lastVisite', width: 16 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  // Style headers
  ws.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } },
    };
  });
  ws.getRow(1).height = 22;

  // Data rows
  for (const r of rows) {
    ws.addRow({
      numero: r.numero,
      rucher: r.rucherNom ?? '',
      commune: r.rucherCommune ?? '',
      type: r.type,
      statut: r.statut,
      race: r.raceAbeille ?? '',
      qualiteReine: r.qualiteReine ?? '',
      cadres: r.nombreCadres ?? '',
      hausses: r.nombreHausses ?? '',
      installation: r.dateInstallation
        ? new Date(r.dateInstallation).toLocaleDateString('fr-FR')
        : '',
      origine: r.origineEssaim ?? '',
      marquage: r.marquageReine ?? '',
      lastVisite: r.lastVisite ? new Date(r.lastVisite).toLocaleDateString('fr-FR') : '',
      notes: r.notes ?? '',
    });
  }

  // Alternate row coloring
  ws.eachRow((row, rowNum) => {
    if (rowNum > 1 && rowNum % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAF8' } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  setResponseHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="ruches.xlsx"');

  return buffer;
});
