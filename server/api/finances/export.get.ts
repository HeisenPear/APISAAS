import { z } from 'zod';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { hasFeature, minimumPlanFor } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

const exportQuerySchema = z.object({
  format: z.enum(['csv', 'fec']).default('csv'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, exportQuerySchema.parse);

  // L'export FEC est réservé aux plans avec la feature exportFec (Pro+). La même
  // route sert aussi le CSV (exportCsv, Starter+), donc le gate de route ne suffit
  // pas — on vérifie le format ici (bypass admin, cohérent avec le middleware).
  if (query.format === 'fec' && !isAdminEmail(user.email)) {
    const [profil] = await db
      .select({ plan: profils.plan })
      .from(profils)
      .where(eq(profils.id, user.id))
      .limit(1);
    const plan = (profil?.plan ?? 'decouverte') as Plan;
    if (!hasFeature(plan, 'exportFec')) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Plan insuffisant',
        data: {
          code: 'PLAN_REQUIRED',
          feature: 'exportFec',
          requiredPlan: minimumPlanFor('exportFec'),
        },
      });
    }
  }

  const conditions = [eq(transactions.userId, user.id)];

  if (query.from) conditions.push(gte(transactions.dateTransaction, query.from));
  if (query.to) conditions.push(lte(transactions.dateTransaction, query.to));

  const rows = await db
    .select({
      numero: transactions.numero,
      type: transactions.type,
      date: transactions.dateTransaction,
      statut: transactions.statut,
      sousTotal: transactions.sousTotal,
      tva: transactions.tva,
      total: transactions.total,
      categorie: transactions.categorie,
      notes: transactions.notes,
      clientNom: clients.nom,
      clientEntreprise: clients.entreprise,
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(asc(transactions.dateTransaction));

  if (query.format === 'fec') {
    // Simplified FEC format
    const header =
      'JournalCode;JournalLib;EcritureNum;EcritureDate;CompteNum;CompteLib;CompAuxNum;CompAuxLib;PieceRef;PieceDate;EcritureLib;Debit;Credit;EcrtureLet;DateLet;ValidDate;Montantdevise;Idevise';
    const lines = rows.map((r) => {
      const dateStr = new Date(r.date).toISOString().slice(0, 10).replace(/-/g, '');
      const isVente = r.type === 'vente';
      const ecritureLib = (r.notes ?? '').replace(/;/g, ',').replace(/\r?\n/g, ' ');
      return `${isVente ? 'VE' : 'HA'};${isVente ? 'Ventes' : 'Achats'};${r.numero ?? ''};${dateStr};${isVente ? '707000' : '607000'};${isVente ? 'Ventes produits' : 'Achats'};${r.clientNom ?? ''};${r.clientEntreprise ?? ''};${r.numero ?? ''};${dateStr};${ecritureLib};${isVente ? '' : (r.total ?? '0')};${isVente ? (r.total ?? '0') : ''};;;;;`;
    });

    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="FEC_export.txt"');
    return [header, ...lines].join('\n');
  }

  // CSV format
  const header = 'Numero;Type;Date;Statut;Client;Categorie;Sous-total HT;TVA;Total TTC;Notes';
  const lines = rows.map((r) => {
    const dateStr = new Date(r.date).toLocaleDateString('fr-FR');
    const client = r.clientEntreprise || r.clientNom || '';
    const notes = (r.notes ?? '').replace(/;/g, ',').replace(/\r?\n/g, ' ');
    return `${r.numero ?? ''};${r.type};${dateStr};${r.statut};${client};${r.categorie ?? ''};${r.sousTotal ?? '0'};${r.tva ?? '0'};${r.total ?? '0'};${notes}`;
  });

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="finances_export.csv"');
  return [header, ...lines].join('\n');
});
