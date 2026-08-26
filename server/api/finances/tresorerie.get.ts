import { z } from 'zod';
import { eq, and, gte, ne, sql } from 'drizzle-orm';
import { transactions, profils, previsionsTresorerie } from '~~/server/database/schema';
import {
  projeterTresorerie,
  type ChargeRecurrente,
  type HistoriqueMois,
  type PrevisionItem,
} from '~~/server/utils/tresorerie';
import { anneeParis, minuitParis, moisParis } from '~~/server/utils/horloge';

const querySchema = z.object({
  // Optionnel : override ponctuel. Sinon on prend le solde PERSISTÉ du propriétaire.
  soldeActuel: z.coerce.number().optional(),
  horizon: z.coerce.number().int().min(1).max(24).default(12),
  lookbackYears: z.coerce.number().int().min(1).max(5).default(3),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const {
    soldeActuel: soldeOverride,
    horizon,
    lookbackYears,
  } = await getValidatedQuery(event, querySchema.parse);

  /**
   * ⚠️ TOUT SE LIT À PARIS. `getFullYear()` / `getMonth()` répondent dans le
   * fuseau du SERVEUR, et les lambdas Vercel tournent en UTC : le 1er janvier
   * à 00 h 30 à Paris, la projection de trésorerie repartait sur l'année
   * ÉCOULÉE, et le 1er de chaque mois à la même heure, sur le mois précédent.
   */
  const now = new Date();
  const anneeCourante = anneeParis(now);
  const moisCourant = moisParis(now);
  // Une BORNE se pose à minuit à Paris (voir `horloge.ts`) : posée à minuit
  // UTC, elle laissait dehors la première heure de l'année pour l'apiculteur.
  const dateDebut = minuitParis(anneeCourante - lookbackYears, 1, 1);

  // Solde de trésorerie PERSISTÉ (préférences du propriétaire de l'espace) —
  // fini le montant ressaisi à chaque visite. Un override query reste possible.
  const [ownerProfil] = await db
    .select({ preferences: profils.preferences })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  const tresoPrefs = (ownerProfil?.preferences?.tresorerie ?? {}) as {
    solde?: number;
    soldeDate?: string;
  };
  const soldePersiste = typeof tresoPrefs.solde === 'number' ? tresoPrefs.solde : 0;
  const soldeActuel = typeof soldeOverride === 'number' ? soldeOverride : soldePersiste;

  // Historique mensuel réalisé + charges récurrentes : 2 lectures indépendantes → en parallèle.
  const [histoRows, recurRows] = await Promise.all([
    // Historique mensuel réalisé (hors brouillons), ventes & achats par mois.
    db
      .select({
        annee: sql<number>`extract(year from ${transactions.dateTransaction})::int`,
        mois: sql<number>`extract(month from ${transactions.dateTransaction})::int`,
        ventes: sql<string>`coalesce(sum(case when ${transactions.type} = 'vente' then ${transactions.total} else 0 end), 0)`,
        achats: sql<string>`coalesce(sum(case when ${transactions.type} = 'achat' then ${transactions.total} else 0 end), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, ownerId),
          gte(transactions.dateTransaction, dateDebut),
          ne(transactions.statut, 'brouillon'),
        ),
      )
      .groupBy(
        sql`extract(year from ${transactions.dateTransaction})`,
        sql`extract(month from ${transactions.dateTransaction})`,
      ),
    // Charges récurrentes connues (achats récurrents).
    db
      .select({
        categorie: transactions.categorie,
        notes: transactions.notes,
        total: transactions.total,
        recurringInterval: transactions.recurringInterval,
        nextRecurringDate: transactions.nextRecurringDate,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, ownerId),
          eq(transactions.type, 'achat'),
          eq(transactions.isRecurring, true),
        ),
      ),
  ]);

  const historique: HistoriqueMois[] = histoRows.map((r) => ({
    annee: r.annee,
    mois: r.mois,
    ventes: Number(r.ventes),
    achats: Number(r.achats),
  }));

  const recurrents: ChargeRecurrente[] = recurRows
    .filter(
      (r) =>
        r.total !== null && (r.recurringInterval === 'mensuel' || r.recurringInterval === 'annuel'),
    )
    .map((r) => ({
      libelle: r.categorie || r.notes?.slice(0, 40) || 'Charge récurrente',
      montant: Number(r.total),
      intervalle: r.recurringInterval as 'mensuel' | 'annuel',
      // Le mois de l'échéance se lit à Paris. Il se lisait sur le serveur, et
      // une échéance posée du mauvais côté de minuit avançait la charge d'un
      // mois entier dans la projection — voir `horloge.ts`, « deux façons de
      // représenter un jour ».
      moisProchain: r.nextRecurringDate ? moisParis(new Date(r.nextRecurringDate)) : moisCourant,
    }));

  // Postes planifiés saisis à la main (dépenses / investissements / recettes).
  // Tolérant : si la table n'est pas encore migrée, on projette sans (page non cassée).
  let previsionsRows: {
    libelle: string;
    montant: string;
    type: string;
    recurrence: string;
    datePrevue: Date;
    notes: string | null;
  }[] = [];
  try {
    previsionsRows = await db
      .select({
        libelle: previsionsTresorerie.libelle,
        montant: previsionsTresorerie.montant,
        type: previsionsTresorerie.type,
        recurrence: previsionsTresorerie.recurrence,
        datePrevue: previsionsTresorerie.datePrevue,
        notes: previsionsTresorerie.notes,
      })
      .from(previsionsTresorerie)
      .where(eq(previsionsTresorerie.userId, ownerId));
  } catch (err) {
    console.warn(
      '[tresorerie] table previsions_tresorerie indisponible (migration ?)',
      String(err),
    );
    previsionsRows = [];
  }

  const previsions: PrevisionItem[] = previsionsRows.map((p) => {
    const d = new Date(p.datePrevue);
    return {
      montant: Number(p.montant),
      type: (p.type === 'investissement' || p.type === 'recette' ? p.type : 'depense') as
        | 'depense'
        | 'investissement'
        | 'recette',
      recurrence: (p.recurrence === 'mensuel' || p.recurrence === 'annuel'
        ? p.recurrence
        : 'ponctuel') as 'ponctuel' | 'mensuel' | 'annuel',
      annee: anneeParis(d),
      mois: moisParis(d),
    };
  });

  const resultat = projeterTresorerie({
    historique,
    recurrents,
    previsions,
    soldeActuel,
    horizonMois: horizon,
    anneeCourante,
    moisCourant,
  });

  return {
    ...resultat,
    recurrents,
    parametres: {
      soldeActuel,
      soldeDate: tresoPrefs.soldeDate ?? null,
      soldePersiste,
      horizon,
      lookbackYears,
    },
    aHistorique: historique.length > 0,
    aPrevisions: previsions.length > 0,
  };
});
