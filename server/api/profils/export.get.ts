import { eq } from 'drizzle-orm';
import { logAudit } from '~~/server/utils/audit';
import {
  profils,
  ruchers,
  ruches,
  interventions,
  recoltes,
  stocks,
  mouvementsStock,
  clients,
  transactions,
  alertes,
  pesees,
  comptagesVarroa,
  traitementsVarroa,
  mouvementsMateriel,
  deplacementsRuches,
  divisions,
  mouvementsBancaires,
  connexionsBancaires,
} from '~~/server/database/schema';

/**
 * GET /api/profils/me/export
 *
 * Export complet des donnees personnelles de l'utilisateur (RGPD article 20 —
 * droit a la portabilite). Retourne un JSON contenant toutes les tables
 * pour lesquelles l'utilisateur est `userId`.
 *
 * Le client telecharge ensuite ce JSON en .json. Pour gros volumes, prevoir
 * une evolution en .zip avec un fichier par table.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const [
    profilRow,
    ruchersRows,
    ruchesRows,
    interventionsRows,
    recoltesRows,
    stocksRows,
    mouvementsStockRows,
    clientsRows,
    transactionsRows,
    alertesRows,
    peseesRows,
    comptagesVarroaRows,
    traitementsVarroaRows,
    mouvementsMaterielRows,
    deplacementsRuchesRows,
    divisionsRows,
    mouvementsBancairesRows,
    connexionsBancairesRows,
  ] = await Promise.all([
    db.select().from(profils).where(eq(profils.id, user.id)),
    db.select().from(ruchers).where(eq(ruchers.userId, user.id)),
    db.select().from(ruches).where(eq(ruches.userId, user.id)),
    db.select().from(interventions).where(eq(interventions.userId, user.id)),
    db.select().from(recoltes).where(eq(recoltes.userId, user.id)),
    db.select().from(stocks).where(eq(stocks.userId, user.id)),
    db.select().from(mouvementsStock).where(eq(mouvementsStock.userId, user.id)),
    db.select().from(clients).where(eq(clients.userId, user.id)),
    db.select().from(transactions).where(eq(transactions.userId, user.id)),
    db.select().from(alertes).where(eq(alertes.userId, user.id)),
    db.select().from(pesees).where(eq(pesees.userId, user.id)),
    db.select().from(comptagesVarroa).where(eq(comptagesVarroa.userId, user.id)),
    db.select().from(traitementsVarroa).where(eq(traitementsVarroa.userId, user.id)),
    db.select().from(mouvementsMateriel).where(eq(mouvementsMateriel.userId, user.id)),
    db.select().from(deplacementsRuches).where(eq(deplacementsRuches.userId, user.id)),
    db.select().from(divisions).where(eq(divisions.userId, user.id)),
    db.select().from(mouvementsBancaires).where(eq(mouvementsBancaires.userId, user.id)),
    db.select().from(connexionsBancaires).where(eq(connexionsBancaires.userId, user.id)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    data: {
      profil: profilRow[0] ?? null,
      ruchers: ruchersRows,
      ruches: ruchesRows,
      interventions: interventionsRows,
      recoltes: recoltesRows,
      stocks: stocksRows,
      mouvementsStock: mouvementsStockRows,
      clients: clientsRows,
      transactions: transactionsRows,
      alertes: alertesRows,
      pesees: peseesRows,
      comptagesVarroa: comptagesVarroaRows,
      traitementsVarroa: traitementsVarroaRows,
      mouvementsMateriel: mouvementsMaterielRows,
      deplacementsRuches: deplacementsRuchesRows,
      divisions: divisionsRows,
      mouvementsBancaires: mouvementsBancairesRows,
      connexionsBancaires: connexionsBancairesRows,
    },
  };

  setHeader(event, 'Content-Type', 'application/json; charset=utf-8');
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="apigo-export-${user.id}-${Date.now()}.json"`,
  );

  await logAudit({ event, action: 'account.exported', userId: user.id });

  return payload;
});
