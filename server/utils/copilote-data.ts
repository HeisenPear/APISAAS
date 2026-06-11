import { eq, and, desc, gte, sql, isNull } from 'drizzle-orm';
import {
  ruchers,
  ruches,
  interventions,
  stocks,
  transactions,
  alertes,
  recoltes,
} from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';
import { scoreVisite, wmo } from '~~/server/utils/meteo';

/**
 * Accès données du Copilote — LECTURE SEULE, toujours scopé userId.
 *
 * Module partagé : utilisé par le moteur local (copilote-local.ts) et, en
 * option, par le mode Claude (copilote.ts). Chaque fonction renvoie un objet
 * typé ; le formatage en texte français vit dans le moteur appelant.
 */

export interface RucherRow {
  nom: string;
  commune: string | null;
  nbRuchesActives: number;
}

export async function getRuchers(userId: string): Promise<RucherRow[]> {
  return db
    .select({
      nom: ruchers.nom,
      commune: ruchers.commune,
      nbRuchesActives: sql<number>`(select count(*)::int from ruches r where r.rucher_id = ${ruchers.id} and r.statut = 'active')`,
    })
    .from(ruchers)
    .where(eq(ruchers.userId, userId));
}

export interface RucheSante {
  numero: string;
  rucher: string;
  statut: string;
  scoreSante: number;
  derniereVisite: string | null;
  joursDepuisVisite: number | null;
  varroa: number | null;
  maladieObservee: string | null;
}

export async function getRuchesSante(userId: string, rucherNom?: string): Promise<RucheSante[]> {
  const rows = (await db.execute(sql`
    SELECT r.numero, rc.nom AS rucher, r.statut, r.qualite_reine,
      li.date_visite, li.force_colonie, li.couvain, li.reserves,
      li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
    FROM ruches r
    JOIN ruchers rc ON rc.id = r.rucher_id
    LEFT JOIN LATERAL (
      SELECT i.date_visite,
        COALESCE((i.donnees->>'force_colonie')::int, i.force_colonie) AS force_colonie,
        CASE WHEN i.donnees->>'reine_vue' IS NOT NULL THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
        CASE WHEN i.donnees->>'couvain_present' IS NOT NULL THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
        CASE WHEN i.donnees->>'reserves_presentes' IS NOT NULL THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
        COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
        i.varroa, i.signe_essaimage, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut != 'vendue'
    ORDER BY rc.nom, r.numero
    LIMIT 300
  `)) as unknown as Array<{
    numero: string;
    rucher: string;
    statut: string;
    qualite_reine: string | null;
    date_visite: string | null;
    force_colonie: number | null;
    couvain: number | null;
    reserves: number | null;
    reine_vue: boolean | null;
    varroa: number | null;
    comportement: string | null;
    signe_essaimage: boolean | null;
    maladie_observee: string | null;
  }>;

  const filtre = rucherNom?.toLowerCase().trim();
  return rows
    .filter((r) => !filtre || r.rucher.toLowerCase().includes(filtre))
    .map((r) => {
      const score = computeScore({
        rucheId: '',
        numero: r.numero,
        rucherId: '',
        statut: r.statut,
        qualiteReine: r.qualite_reine,
        dateVisite: r.date_visite,
        forceColonie: r.force_colonie,
        couvain: r.couvain,
        reserves: r.reserves,
        reineVue: r.reine_vue,
        varroa: r.varroa,
        comportement: r.comportement,
        signeEssaimage: r.signe_essaimage,
        maladieObservee: r.maladie_observee,
      });
      const jours = r.date_visite
        ? Math.floor((Date.now() - new Date(r.date_visite).getTime()) / 86400000)
        : null;
      return {
        numero: r.numero,
        rucher: r.rucher,
        statut: r.statut,
        scoreSante: score,
        derniereVisite: r.date_visite?.slice(0, 10) ?? null,
        joursDepuisVisite: jours,
        varroa: r.varroa,
        maladieObservee: r.maladie_observee,
      };
    });
}

export interface InterventionRow {
  date: string | null;
  type: string | null;
  ruche: string | null;
  notes: string | null;
}

export async function getInterventionsRecentes(
  userId: string,
  limite = 15,
): Promise<InterventionRow[]> {
  const n = Math.min(Math.max(limite, 1), 30);
  const rows = await db
    .select({
      date: interventions.dateVisite,
      type: interventions.type,
      rucheNumero: ruches.numero,
      notes: interventions.notes,
    })
    .from(interventions)
    .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
    .where(eq(interventions.userId, userId))
    .orderBy(desc(interventions.dateVisite))
    .limit(n);
  return rows.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : (r.date as string | null),
    type: r.type,
    ruche: r.rucheNumero,
    notes: r.notes ? String(r.notes).slice(0, 200) : null,
  }));
}

export interface StockRow {
  nom: string;
  categorie: string;
  quantite: string | null;
  unite: string | null;
  seuilAlerte: string | null;
  sousLeSeuil: boolean;
}

export async function getStocks(userId: string): Promise<StockRow[]> {
  const rows = await db
    .select({
      nom: stocks.nom,
      categorie: stocks.categorie,
      quantite: stocks.quantite,
      unite: stocks.unite,
      seuilAlerte: stocks.seuilAlerte,
    })
    .from(stocks)
    .where(eq(stocks.userId, userId))
    .limit(150);
  return rows.map((s) => ({
    nom: s.nom,
    categorie: s.categorie as string,
    quantite: s.quantite,
    unite: s.unite,
    seuilAlerte: s.seuilAlerte,
    sousLeSeuil:
      s.seuilAlerte != null && s.quantite != null
        ? Number(s.quantite) <= Number(s.seuilAlerte)
        : false,
  }));
}

export interface FinancesResume {
  annee: number;
  caVentesEuros: number;
  nbVentes: number;
  facturesEnRetard: number;
  montantImpayeEuros: number;
  productionMielKg: number;
}

export async function getFinances(userId: string, annee?: number): Promise<FinancesResume> {
  const an = annee || new Date().getFullYear();
  const debut = new Date(`${an}-01-01T00:00:00Z`);
  const fin = new Date(`${an + 1}-01-01T00:00:00Z`);
  const [ventes] = await db
    .select({
      ca: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
      nb: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        gte(transactions.dateTransaction, debut),
        sql`${transactions.dateTransaction} < ${fin}`,
      ),
    );
  const [impayes] = await db
    .select({
      nb: sql<number>`count(*)::int`,
      montant: sql<number>`coalesce(sum(${transactions.total}::numeric), 0)::float`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        eq(transactions.statut, 'envoyee'),
        sql`${transactions.dateEcheance} < now()`,
      ),
    );
  const [prod] = await db
    .select({ kg: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float` })
    .from(recoltes)
    .where(
      and(
        eq(recoltes.userId, userId),
        gte(recoltes.dateRecolte, debut),
        sql`${recoltes.dateRecolte} < ${fin}`,
      ),
    );
  return {
    annee: an,
    caVentesEuros: ventes?.ca ?? 0,
    nbVentes: ventes?.nb ?? 0,
    facturesEnRetard: impayes?.nb ?? 0,
    montantImpayeEuros: impayes?.montant ?? 0,
    productionMielKg: prod?.kg ?? 0,
  };
}

export interface AlerteRow {
  type: string;
  titre: string;
  message: string | null;
  priorite: string | null;
}

export async function getAlertes(userId: string): Promise<AlerteRow[]> {
  return db
    .select({
      type: alertes.type,
      titre: alertes.titre,
      message: alertes.message,
      priorite: alertes.priorite,
    })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), isNull(alertes.resolvedAt), eq(alertes.lue, false)))
    .orderBy(desc(alertes.createdAt))
    .limit(20);
}

export interface MeteoJour {
  date: string;
  conditions: string;
  tempMax: number;
  tempMin: number;
  pluieMm: number;
  ventMaxKmh: number;
  scoreVisite: number;
}

export interface MeteoResultat {
  rucher: string;
  previsions: MeteoJour[];
}

export async function getMeteoRucher(
  userId: string,
  rucherNom?: string,
): Promise<MeteoResultat | { erreur: string }> {
  const tous = await db
    .select({ nom: ruchers.nom, latitude: ruchers.latitude, longitude: ruchers.longitude })
    .from(ruchers)
    .where(eq(ruchers.userId, userId));
  const filtre = rucherNom?.toLowerCase().trim();
  const rucher =
    (filtre ? tous.find((r) => r.nom.toLowerCase().includes(filtre)) : tous[0]) ?? null;
  if (!rucher) return { erreur: 'aucun_rucher' };
  if (!rucher.latitude || !rucher.longitude) return { erreur: 'pas_de_gps' };

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${rucher.latitude}&longitude=${rucher.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FParis&forecast_days=5`;
  const meteo = (await $fetch(url, { timeout: 8000 })) as {
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      wind_speed_10m_max: number[];
    };
  };
  return {
    rucher: rucher.nom,
    previsions: meteo.daily.time.map((date, i) => ({
      date,
      conditions: wmo(meteo.daily.weather_code[i] ?? 0).label,
      tempMax: meteo.daily.temperature_2m_max[i] ?? 0,
      tempMin: meteo.daily.temperature_2m_min[i] ?? 0,
      pluieMm: meteo.daily.precipitation_sum[i] ?? 0,
      ventMaxKmh: meteo.daily.wind_speed_10m_max[i] ?? 0,
      scoreVisite: scoreVisite(
        meteo.daily.temperature_2m_max[i] ?? 0,
        meteo.daily.precipitation_sum[i] ?? 0,
        meteo.daily.wind_speed_10m_max[i] ?? 0,
        meteo.daily.weather_code[i] ?? 0,
      ),
    })),
  };
}
