import { z } from 'zod';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { transactions, clients } from '~~/server/database/schema';

// Export CSV des transactions (finance). Le format FEC (écritures comptables) a été
// retiré : APIGO n'est pas un outil de comptabilité — on garde une finance poussée
// (ventes, achats/dépenses, bilans) sans le volet comptable réglementaire.
const exportQuerySchema = z.object({
  format: z.enum(['csv']).default('csv'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, exportQuerySchema.parse);

  const conditions = [eq(transactions.userId, ownerId)];

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
