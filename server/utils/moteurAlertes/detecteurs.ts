import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { interventions, stocks, transactions } from '~~/server/database/schema';
import { detecterVisites, detecterSanteCritique } from '~~/server/utils/alertesCore';
import {
  construireAlertesExtra,
  resolutionsExtra,
  resolutionsTraitementFin,
} from '~~/server/utils/alertesExtra';
import {
  construireAlertesAvancees,
  resolutionsAvancees,
  TYPES_AVANCES,
} from '~~/server/utils/alertesAvancees';
import { construireAlertesSaison, resolutionsSaison } from '~~/server/utils/alertesSaison';
import { construireAlertesMeteo, resolutionsMeteo } from '~~/server/utils/alertesMeteo';
import { construireAlertesBalancesMuettes } from '~~/server/utils/balances/alertes';
import { RDV_TYPE_LABELS } from '~~/server/utils/rdv';
import { heureMinuteParis, memeJourParis } from '~~/server/utils/horloge';
import {
  resoudreFactures,
  resoudreRdv,
  resoudreSanteCritique,
  resoudreStocks,
  resoudreVisites,
} from './resolution';
import type { AlerteInsert, ContexteResolution, Detecteur } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// LE REGISTRE DES RÈGLES.
//
// Chaque règle déclare ce qu'elle produit, ce qu'elle résout et ce qu'elle
// exige. Un profil n'est plus qu'une liste de règles — c'est ce qui rend
// impossible la divergence qui s'était installée entre la route dashboard et le
// cron (une résolution ici, pas là ; un libellé qui change d'un mot).
// ═══════════════════════════════════════════════════════════════════════════

export const DETECTEUR_VISITE: Detecteur = {
  cle: 'visite',
  types: ['visite_requise', 'premiere_visite'],
  detecter: (ctx) => detecterVisites(ctx.userId, ctx.cheptel, ctx.dejaExiste, ctx.maintenant),
  resoudre: resoudreVisites,
};

export const DETECTEUR_SANTE_CRITIQUE: Detecteur = {
  cle: 'sante-critique',
  types: ['sante_critique'],
  detecter: (ctx) => detecterSanteCritique(ctx.userId, ctx.cheptel, ctx.dejaExiste, ctx.maintenant),
  resoudre: resoudreSanteCritique,
};

export const DETECTEUR_STOCK_BAS: Detecteur = {
  cle: 'stock-bas',
  types: ['stock_bas'],
  detecter: async ({ userId, dejaExiste }) => {
    const bas = await db
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.userId, userId),
          sql`${stocks.seuilAlerte} IS NOT NULL AND ${stocks.quantite}::numeric <= ${stocks.seuilAlerte}::numeric`,
        ),
      );
    return bas
      .filter((s) => !dejaExiste('stock_bas', s.id))
      .map((s) => ({
        userId,
        type: 'stock_bas',
        titre: `Stock bas — ${s.nom}`,
        message: `Quantité actuelle : ${s.quantite} ${s.unite ?? ''}. Seuil d'alerte : ${s.seuilAlerte} ${s.unite ?? ''}.`,
        priorite: 'moyenne' as const,
        referenceType: 'stock',
        referenceId: s.id,
        actionUrl: '/stocks',
        lue: false,
      }));
  },
  resoudre: resoudreStocks,
};

export const DETECTEUR_FACTURE_RETARD: Detecteur = {
  cle: 'facture-retard',
  types: ['facture_retard'],
  detecter: async ({ userId, dejaExiste, maintenant }) => {
    const retard = await db
      .select({ id: transactions.id, numero: transactions.numero, total: transactions.total })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'vente'),
          eq(transactions.statut, 'envoyee'),
          lte(transactions.dateEcheance, maintenant),
        ),
      );
    return retard
      .filter((f) => !dejaExiste('facture_retard', f.id))
      .map((f) => ({
        userId,
        type: 'facture_retard',
        titre: `Facture en retard — ${f.numero ?? f.id.slice(0, 8)}`,
        message: `Montant : ${f.total ?? 0} €. Échéance dépassée.`,
        priorite: 'haute' as const,
        referenceType: 'transaction',
        referenceId: f.id,
        actionUrl: '/finances/ventes',
        lue: false,
      }));
  },
  resoudre: resoudreFactures,
};

/**
 * Rendez-vous professionnels des prochaines 36 h — le cron tourne le matin,
 * la fenêtre couvre donc le jour même et le lendemain matin.
 */
export const DETECTEUR_RDV: Detecteur = {
  cle: 'rdv',
  types: ['rdv_rappel'],
  detecter: async ({ userId, dejaExiste, maintenant }) => {
    const proches = await db
      .select({
        id: interventions.id,
        dateVisite: interventions.dateVisite,
        donnees: interventions.donnees,
        notes: interventions.notes,
      })
      .from(interventions)
      .where(
        and(
          eq(interventions.userId, userId),
          eq(interventions.type, 'rendez_vous_pro'),
          gte(interventions.dateVisite, maintenant),
          lte(interventions.dateVisite, new Date(maintenant.getTime() + 36 * 3_600_000)),
        ),
      )
      .orderBy(interventions.dateVisite)
      .limit(20);

    const out: AlerteInsert[] = [];
    for (const rdv of proches) {
      if (!rdv.dateVisite || dejaExiste('rdv_rappel', rdv.id)) continue;
      const date = new Date(rdv.dateVisite);
      const donnees = rdv.donnees as { typeRdv?: string; contact?: string } | null;
      const quand = `${memeJourParis(date, maintenant) ? "aujourd'hui" : 'demain'} à ${heureMinuteParis(date)}`;
      const typeLabel = RDV_TYPE_LABELS[donnees?.typeRdv ?? ''] || '';
      const contact = donnees?.contact ? ` avec ${donnees.contact}` : '';
      out.push({
        userId,
        type: 'rdv_rappel',
        titre: `Rendez-vous ${typeLabel || 'pro'} ${quand}`,
        message: `${rdv.notes ?? `RDV${contact}`} — pensez à préparer vos documents.`,
        priorite: 'haute',
        referenceType: 'intervention',
        referenceId: rdv.id,
        actionUrl: '/calendrier',
        lue: false,
      });
    }
    return out;
  },
  resoudre: resoudreRdv,
};

export const DETECTEUR_EXTRA: Detecteur = {
  cle: 'extra',
  types: ['transhumance_proche', 'reine_agee', 'traitement_fin'],
  detecter: ({ userId, dejaExiste, maintenant }) =>
    construireAlertesExtra(userId, dejaExiste, maintenant),
  resoudre: async (ctx: ContexteResolution) => [
    ...(await resolutionsExtra(ctx)),
    ...(await resolutionsTraitementFin(ctx)),
  ],
};

export const DETECTEUR_AVANCEES: Detecteur = {
  cle: 'avancees',
  types: TYPES_AVANCES,
  detecter: ({ userId, dejaExiste, maintenant }) =>
    construireAlertesAvancees(userId, dejaExiste, maintenant),
  resoudre: resolutionsAvancees,
};

export const DETECTEUR_SAISON: Detecteur = {
  cle: 'saison',
  types: ['rappel_saison'],
  requiertCheptel: true,
  detecter: ({ userId, dejaExiste, maintenant }) =>
    construireAlertesSaison(userId, maintenant, dejaExiste),
  resoudre: resolutionsSaison,
};

export const DETECTEUR_METEO: Detecteur = {
  cle: 'meteo',
  types: ['meteo_danger', 'meteo_favorable'],
  requiertCheptel: true,
  detecter: ({ userId, dejaExiste }) => construireAlertesMeteo(userId, dejaExiste),
  resoudre: resolutionsMeteo,
};

/**
 * Balance muette : la SEULE alerte de balance qui ne peut pas être détectée à
 * l'ingestion — par définition, rien n'arrive. Sans ce passage par le cron, un
 * capteur mort resterait silencieux indéfiniment.
 */
export const DETECTEUR_BALANCES_MUETTES: Detecteur = {
  cle: 'balances-muettes',
  types: ['balance_muette'],
  detecter: ({ userId, dejaExiste, maintenant }) =>
    construireAlertesBalancesMuettes(userId, dejaExiste, maintenant),
  sansResolution: {
    balance_muette:
      'Éteinte à l’ingestion : la première mesure qui arrive résout l’alerte (cf. evaluerAlertesLot).',
  },
};
