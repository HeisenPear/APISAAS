import { eq, and, or, desc, gte, lt, sql, isNull, inArray } from 'drizzle-orm';
import {
  ruchers,
  ruches,
  interventions,
  stocks,
  transactions,
  alertes,
  recoltes,
} from '~~/server/database/schema';
import { computeScore, type InspectionRow } from '~~/server/utils/santeScore';
import { anneeParis, moisParis, debutDuMoisDecaleParis } from '~~/server/utils/horloge';
import { STATUTS_CA_REALISE } from '~~/server/utils/statutsFacture';
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
  // « Ruche gérée » = même définition que chargerRuches/getRuchesSante
  // (`statut != 'vendue'`) : le compte affiché doit correspondre aux ruches sur
  // lesquelles le copilote agit réellement — sinon on affichait « 0 ruche active »
  // alors qu'une commande en LOT venait d'en contrôler des dizaines.
  return db
    .select({
      nom: ruchers.nom,
      commune: ruchers.commune,
      nbRuchesActives: sql<number>`(select count(*)::int from ruches r where r.rucher_id = ${ruchers.id} and r.statut <> 'vendue')`,
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
  // L'année par défaut se lit à Paris : le 1er janvier à 00 h 30, `getFullYear()`
  // sur une lambda UTC répond encore l'année ÉCOULÉE, et Maya présentait le
  // bilan de l'an dernier comme celui de l'année en cours.
  const an = annee || anneeParis(new Date());
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
        // ⚠️ IL N'Y AVAIT AUCUN FILTRE DE STATUT ICI, et Maya annonçait donc un
        // chiffre d'affaires gonflé des BROUILLONS et des factures ANNULÉES —
        // pendant que la page Finances, elle, les excluait. Deux chiffres
        // différents pour la même question, selon l'endroit où on la posait.
        inArray(transactions.statut, STATUTS_CA_REALISE),
        gte(transactions.dateTransaction, debut),
        // lt() typé, PAS un fragment sql brut : une Date brute dans sql`…` n'est
        // pas sérialisée par le driver (→ « Received an instance of Date »).
        lt(transactions.dateTransaction, fin),
      ),
    );
  /**
   * ⚠️ UNE FACTURE MARQUÉE « EN RETARD » EST UN IMPAYÉ, MÊME SANS ÉCHÉANCE.
   *
   * Cette requête ne regardait que `envoyee` + échéance dépassée. Or `en_retard`
   * est un statut que l'apiculteur pose LUI-MÊME, et que tout le reste du
   * produit compte comme ouvert (factures ouvertes, rapprochement bancaire,
   * fiche client : tous font `IN ('envoyee', 'en_retard')`). L'échéance étant
   * de surcroît nullable, une facture explicitement marquée en retard sans date
   * d'échéance était invisible deux fois — et Maya annonçait « 0 impayé »
   * pendant que la page Ventes en affichait.
   *
   * Le second membre reproduit `statutEffectif` de la page Ventes : une facture
   * envoyée dont l'échéance est passée est en retard, qu'on l'ait dit ou non.
   */
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
        or(
          eq(transactions.statut, 'en_retard'),
          and(eq(transactions.statut, 'envoyee'), sql`${transactions.dateEcheance} < now()`),
        ),
      ),
    );
  const [prod] = await db
    .select({ kg: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float` })
    .from(recoltes)
    .where(
      and(
        eq(recoltes.userId, userId),
        gte(recoltes.dateRecolte, debut),
        lt(recoltes.dateRecolte, fin),
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

/** Comparaison analytique entre deux années (déterministe, pure). */
export interface ComparaisonFinances {
  /** Année la plus ancienne (base de comparaison). */
  ancienne: FinancesResume;
  /** Année la plus récente. */
  recente: FinancesResume;
  deltaCA: number;
  /** Variation en % (null si base = 0 → non défini). */
  pctCA: number | null;
  deltaProduction: number;
  pctProduction: number | null;
  deltaVentes: number;
}

/** Variation en % arrondie (null si la base est nulle → pourcentage non défini). */
function variationPct(avant: number, apres: number): number | null {
  if (avant === 0) return apres === 0 ? 0 : null;
  return Math.round(((apres - avant) / avant) * 100);
}

/**
 * Compare deux bilans annuels (CA, production, ventes) et calcule les deltas +
 * variations. Pure : ordonne les années (ancienne → récente) et ne touche pas la
 * base. Alimente la réponse « compare 2023 vs 2024 » du copilote.
 */
export function comparerFinances(a: FinancesResume, b: FinancesResume): ComparaisonFinances {
  const [ancienne, recente] = a.annee <= b.annee ? [a, b] : [b, a];
  const arr2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ancienne,
    recente,
    deltaCA: arr2(recente.caVentesEuros - ancienne.caVentesEuros),
    pctCA: variationPct(ancienne.caVentesEuros, recente.caVentesEuros),
    deltaProduction: arr2(recente.productionMielKg - ancienne.productionMielKg),
    pctProduction: variationPct(ancienne.productionMielKg, recente.productionMielKg),
    deltaVentes: recente.nbVentes - ancienne.nbVentes,
  };
}

export interface AlerteRow {
  type: string;
  titre: string;
  message: string | null;
  priorite: string | null;
  /** Date de création — sert au brief pour le delta « depuis cette nuit ». */
  createdAt?: string | Date | null;
}

export async function getAlertes(userId: string): Promise<AlerteRow[]> {
  return db
    .select({
      type: alertes.type,
      titre: alertes.titre,
      message: alertes.message,
      priorite: alertes.priorite,
      createdAt: alertes.createdAt,
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
      scoreVisite: scoreVisite({
        tempMax: meteo.daily.temperature_2m_max[i] ?? 0,
        pluieMm: meteo.daily.precipitation_sum[i] ?? 0,
        probPluie: 0,
        ventMax: meteo.daily.wind_speed_10m_max[i] ?? 0,
        rafaleMax: meteo.daily.wind_speed_10m_max[i] ?? 0,
        humidite: 60,
        code: meteo.daily.weather_code[i] ?? 0,
      }),
    })),
  };
}

export interface Serie12Mois {
  labels: string[];
  ca: number[];
  production: number[];
}

/** Séries mensuelles (CA des ventes + production de miel) sur les 12 derniers mois. */
export async function getSerie12Mois(userId: string): Promise<Serie12Mois> {
  /**
   * ⚠️ LA FENÊTRE DÉMARRAIT UN MOIS TROP TARD, ET SE TERMINAIT SUR UN MOIS À VENIR.
   *
   * C'était `debut.setMonth(debut.getMonth() - 11)` posé sur la date du jour.
   * `setMonth` ne borne pas le jour : le 31 mars moins onze mois donne « le 31
   * avril », reporté au 1er MAI. Le `setDate(1)` qui suivait remettait bien le
   * premier du mois — mais du MAUVAIS mois, le mal était déjà fait.
   *
   * Résultat, sept jours par an (29, 30 et 31 janvier, 31 mars, 31 mai,
   * 31 août, 31 octobre) : le plus ancien des douze mois disparaissait du
   * graphique, et la douzième colonne portait le nom d'un mois QUI N'A PAS
   * ENCORE EU LIEU — donc vide, à zéro, à droite de la courbe. Maya répondait
   * « voici vos 12 derniers mois » en montrant onze mois et un mois futur.
   *
   * Assez rare pour n'être jamais reproduit à la demande, assez fréquent pour
   * être vu : sept fois par an, sur tous les comptes à la fois.
   */
  const debut = debutDuMoisDecaleParis(new Date(), -11);

  const [ventes, recoltesRows] = await Promise.all([
    db
      .select({ d: transactions.dateTransaction, total: transactions.total })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'vente'),
          // Même vérité que `getFinances` : une courbe qui compterait les
          // brouillons montrerait une hausse là où rien n'a été facturé.
          inArray(transactions.statut, STATUTS_CA_REALISE),
          gte(transactions.dateTransaction, debut),
        ),
      ),
    db
      .select({ d: recoltes.dateRecolte, kg: recoltes.quantiteKg })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, debut))),
  ]);

  const labels: string[] = [];
  const ca = new Array<number>(12).fill(0);
  const production = new Array<number>(12).fill(0);
  const index: Record<string, number> = {};
  /**
   * La clé de regroupement se lit à PARIS. `getFullYear()/getMonth()` répondait
   * dans le fuseau du serveur — UTC sur Vercel : une vente du 1er juillet à
   * 01 h 30 à Paris est horodatée 30 juin 23 h 30 UTC et s'imputait à JUIN.
   * Les deux dernières heures de chaque mois tombaient dans la mauvaise colonne.
   */
  const cle = (dt: Date) => `${anneeParis(dt)}-${moisParis(dt)}`;

  for (let i = 0; i < 12; i++) {
    const dt = debutDuMoisDecaleParis(debut, i);
    index[cle(dt)] = i;
    // Le libellé aussi : `toLocaleDateString` sans fuseau lit l'heure du
    // serveur, et minuit à Paris est encore la veille en UTC — le 1er février
    // se serait affiché « janv. ».
    labels.push(dt.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'Europe/Paris' }));
  }
  for (const v of ventes) {
    const dt = v.d instanceof Date ? v.d : new Date(v.d as string);
    const i = index[cle(dt)];
    if (i != null) ca[i] = (ca[i] ?? 0) + Number(v.total ?? 0);
  }
  for (const r of recoltesRows) {
    const dt = r.d instanceof Date ? r.d : new Date(r.d as string);
    const i = index[cle(dt)];
    if (i != null) production[i] = (production[i] ?? 0) + Number(r.kg ?? 0);
  }

  return {
    labels,
    ca: ca.map((n) => Math.round(n)),
    production: production.map((n) => Math.round(n)),
  };
}

/**
 * Les derniers contrôles de CHAQUE ruche active, pour la projection de santé.
 *
 * `predictSante` raisonne sur l'historique d'UNE ruche. Interrogé ruche par
 * ruche, il coûterait une requête par colonie — quarante-huit allers-retours
 * pour répondre à « qu'est-ce qui peut arriver ». Un seul `LATERAL` ramène les
 * cinq derniers contrôles de toutes les ruches ; le regroupement se fait en
 * mémoire, où il est gratuit.
 *
 * `LEFT JOIN` et non `JOIN` : une ruche SANS aucun contrôle doit apparaître.
 * C'est même l'information la plus utile de la liste — une colonie qu'on n'a
 * jamais ouverte est celle dont on ne sait rien. `predictSante` la traite avec
 * son garde `donneesInsuffisantes`, et Maya le dit au lieu d'inventer un score.
 */
export interface InspectionsRuche {
  rucheId: string;
  numero: string;
  rucher: string;
  /** Du plus récent au plus ancien. Vide si la ruche n'a jamais été contrôlée. */
  inspections: InspectionRow[];
}

export async function getInspectionsParRuche(userId: string): Promise<InspectionsRuche[]> {
  const rows = (await db.execute(sql`
    SELECT r.id AS ruche_id, r.numero, r.rucher_id, r.statut, r.qualite_reine,
      rc.nom AS rucher,
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
      ORDER BY i.date_visite DESC LIMIT 5
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
    ORDER BY rc.nom, r.numero, li.date_visite DESC NULLS LAST
    LIMIT 800
  `)) as unknown as Array<{
    ruche_id: string;
    numero: string;
    rucher_id: string;
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

  const parRuche = new Map<string, InspectionsRuche>();
  for (const r of rows) {
    let entree = parRuche.get(r.ruche_id);
    if (!entree) {
      entree = { rucheId: r.ruche_id, numero: r.numero, rucher: r.rucher, inspections: [] };
      parRuche.set(r.ruche_id, entree);
    }
    // Le LEFT JOIN produit une ligne à colonnes nulles pour une ruche sans
    // contrôle : elle doit rester dans la liste, mais SANS inspection factice.
    if (r.date_visite == null) continue;
    entree.inspections.push({
      rucheId: r.ruche_id,
      numero: r.numero,
      rucherId: r.rucher_id,
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
      rucherNom: r.rucher,
    });
  }
  return [...parRuche.values()];
}

// ═══════════════════════════════════════════════════════════════════════════
// LE MODULE REINE ET L'ÉLEVAGE — deux domaines que Maya ne savait pas lire.
//
// Elle lisait sept tables sur les soixante-deux du schéma. Les reines, les
// lignées, le greffage : invisibles. Un apiculteur qui greffe tient là son
// travail le plus technique de l'année, et sa copilote n'en savait rien.
// ═══════════════════════════════════════════════════════════════════════════

export interface ReineRow {
  ruche: string;
  rucher: string;
  couleur: string | null;
  annee: number | null;
  race: string | null;
  qualite: string | null;
}

/** Les reines EN PLACE, vues depuis les ruches (module Reine, plan Starter). */
export async function getReines(userId: string): Promise<ReineRow[]> {
  const rows = (await db.execute(sql`
    SELECT r.numero AS ruche, rc.nom AS rucher,
      r.reine_couleur AS couleur, r.reine_annee AS annee,
      r.reine_race AS race, r.qualite_reine AS qualite
    FROM ruches r
    JOIN ruchers rc ON rc.id = r.rucher_id
    WHERE r.user_id = ${userId} AND r.statut = 'active'
    ORDER BY r.reine_annee NULLS LAST, rc.nom, r.numero
    LIMIT 500
  `)) as unknown as Array<{
    ruche: string;
    rucher: string;
    couleur: string | null;
    annee: number | null;
    race: string | null;
    qualite: string | null;
  }>;
  return rows;
}

export interface SessionGreffageRow {
  date: string | null;
  technique: string | null;
  greffees: number;
  acceptees: number | null;
  nees: number | null;
  terminee: boolean;
  lignee: string | null;
}

/**
 * Les sessions de greffage (élevage, plan Expert).
 *
 * `nombre_cellules_acceptees` peut être NULL tant que la session n'a pas été
 * relevée — c'est une donnée MANQUANTE, pas un zéro. Le distinguer compte :
 * un taux d'acceptation calculé en traitant les nulls comme des zéros
 * afficherait un échec là où il n'y a qu'une saisie en attente.
 */
export async function getSessionsGreffage(userId: string): Promise<SessionGreffageRow[]> {
  const rows = (await db.execute(sql`
    SELECT s.date_greffage AS date, s.technique,
      s.nombre_cellules_greffees AS greffees,
      s.nombre_cellules_acceptees AS acceptees,
      s.nombre_cellules_naissance AS nees,
      s.est_terminee AS terminee,
      l.nom AS lignee
    FROM sessions_greffage s
    LEFT JOIN reines_elevage re ON re.id = s.reine_mere_id
    LEFT JOIN lignees l ON l.id = re.lignee_id
    WHERE s.user_id = ${userId}
    ORDER BY s.date_greffage DESC
    LIMIT 40
  `)) as unknown as Array<{
    date: string | null;
    technique: string | null;
    greffees: number;
    acceptees: number | null;
    nees: number | null;
    terminee: boolean;
    lignee: string | null;
  }>;
  return rows;
}

export interface BalanceRow {
  nom: string;
  ruche: string | null;
  rucher: string | null;
  poidsNetKg: number | null;
  variation24hKg: number | null;
  batteriePct: number | null;
  mesureeAt: string | null;
  /** Seuils PROPRES à cette balance (surchargent les défauts). */
  seuilBatteriePct: number | null;
  seuilSilenceHeures: number | null;
}

/**
 * Les balances et leur DERNIÈRE mesure (plan Starter).
 *
 * Un `LATERAL` par balance plutôt qu'une requête par balance : le nombre de
 * mesures est très grand (une toutes les 4-6 h par capteur), et seule la
 * dernière compte pour répondre à « où en sont mes ruches ».
 *
 * Les seuils remontent AVEC la balance : ils sont surchargeables une par une
 * (`seuil_batterie_pct`, `seuil_silence_heures`), et juger toutes les balances
 * sur le défaut ferait mentir les réglages de l'apiculteur.
 */
export async function getBalances(userId: string): Promise<BalanceRow[]> {
  const rows = (await db.execute(sql`
    SELECT b.nom, r.numero AS ruche, rc.nom AS rucher,
      b.seuil_batterie_pct, b.seuil_silence_heures,
      m.poids_net_kg, m.variation_24h_kg, m.batterie_pct, m.mesuree_at
    FROM balances b
    LEFT JOIN ruches r ON r.id = b.ruche_id
    LEFT JOIN ruchers rc ON rc.id = COALESCE(b.rucher_id, r.rucher_id)
    LEFT JOIN LATERAL (
      SELECT poids_net_kg, variation_24h_kg, batterie_pct, mesuree_at
      FROM mesures_balance mb
      WHERE mb.balance_id = b.id
      ORDER BY mb.mesuree_at DESC LIMIT 1
    ) m ON true
    WHERE b.user_id = ${userId}
    ORDER BY b.nom
    LIMIT 200
  `)) as unknown as Array<{
    nom: string;
    ruche: string | null;
    rucher: string | null;
    seuil_batterie_pct: number | null;
    seuil_silence_heures: number | null;
    poids_net_kg: string | null;
    variation_24h_kg: string | null;
    batterie_pct: number | null;
    mesuree_at: string | null;
  }>;

  const nombre = (v: string | null): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return rows.map((r) => ({
    nom: r.nom,
    ruche: r.ruche,
    rucher: r.rucher,
    poidsNetKg: nombre(r.poids_net_kg),
    variation24hKg: nombre(r.variation_24h_kg),
    batteriePct: r.batterie_pct,
    mesureeAt: r.mesuree_at,
    seuilBatteriePct: r.seuil_batterie_pct,
    seuilSilenceHeures: r.seuil_silence_heures,
  }));
}

export interface PlanTranshumanceRow {
  miellee: string | null;
  datePrevue: string | null;
  dateRealisee: string | null;
  statut: string;
  origine: string | null;
  destination: string | null;
  ruchesPrevues: number;
  ruchesRealisees: number | null;
  productionKg: number | null;
  coutEuros: number | null;
  distanceKm: number | null;
}

export interface EmplacementRow {
  nom: string;
  commune: string | null;
  capaciteMaxRuches: number | null;
  accordSigne: boolean;
  proprietaireTerrain: string | null;
}

export interface TranshumanceData {
  plans: PlanTranshumanceRow[];
  emplacements: EmplacementRow[];
}

/**
 * La transhumance : les plans de l'année et les emplacements (plan Pro).
 *
 * Deux requêtes plutôt qu'une jointure : les emplacements existent
 * indépendamment des plans (on prospecte un terrain avant de savoir si on ira),
 * et une jointure les ferait disparaître de la réponse tant qu'aucun plan ne
 * les vise — c'est-à-dire exactement quand l'apiculteur a besoin de les revoir.
 */
export async function getTranshumance(userId: string, annee: number): Promise<TranshumanceData> {
  const nombre = (v: string | null): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const plans = (await db.execute(sql`
    SELECT p.miellee, p.date_prevue, p.date_realisee, p.statut,
      ro.nom AS origine, e.nom AS destination,
      p.nombre_ruches_prevues, p.nombre_ruches_realisees,
      p.production_kg, p.cout_carburant_euros, p.distance_km
    FROM plans_transhumance p
    LEFT JOIN ruchers ro ON ro.id = p.rucher_origine_id
    LEFT JOIN emplacements e ON e.id = p.emplacement_destination_id
    WHERE p.user_id = ${userId} AND p.annee = ${annee}
    ORDER BY p.date_prevue
    LIMIT 120
  `)) as unknown as Array<{
    miellee: string | null;
    date_prevue: string | null;
    date_realisee: string | null;
    statut: string;
    origine: string | null;
    destination: string | null;
    nombre_ruches_prevues: number;
    nombre_ruches_realisees: number | null;
    production_kg: string | null;
    cout_carburant_euros: string | null;
    distance_km: string | null;
  }>;

  const emplacements = (await db.execute(sql`
    SELECT nom, commune, capacite_max_ruches, accord_signe, proprietaire_terrain
    FROM emplacements
    WHERE user_id = ${userId}
    ORDER BY accord_signe, nom
    LIMIT 120
  `)) as unknown as Array<{
    nom: string;
    commune: string | null;
    capacite_max_ruches: number | null;
    accord_signe: boolean;
    proprietaire_terrain: string | null;
  }>;

  return {
    plans: plans.map((p) => ({
      miellee: p.miellee,
      datePrevue: p.date_prevue,
      dateRealisee: p.date_realisee,
      statut: p.statut,
      origine: p.origine,
      destination: p.destination,
      ruchesPrevues: p.nombre_ruches_prevues,
      ruchesRealisees: p.nombre_ruches_realisees,
      productionKg: nombre(p.production_kg),
      coutEuros: nombre(p.cout_carburant_euros),
      distanceKm: nombre(p.distance_km),
    })),
    emplacements: emplacements.map((e) => ({
      nom: e.nom,
      commune: e.commune,
      capaciteMaxRuches: e.capacite_max_ruches,
      accordSigne: e.accord_signe,
      proprietaireTerrain: e.proprietaire_terrain,
    })),
  };
}

export interface ClientRow {
  nom: string;
  type: string | null;
  nbVentes: number;
  caEuros: number;
  derniereVente: string | null;
  impayeEuros: number;
  nbImpayees: number;
}

/**
 * Les clients, avec ce qu'ils ont acheté (feature `clients`).
 *
 * ⚠️ LA DÉFINITION D'UN IMPAYÉ EST CELLE DU RESTE DU PRODUIT, PAS UNE AUTRE.
 * Une facture est ouverte si son statut est `envoyee` OU `en_retard` — c'est
 * ce que retiennent `factures-ouvertes.get.ts`, les suggestions de rapprochement
 * bancaire et la fiche client. Ne garder que `envoyee` ferait disparaître de la
 * réponse les factures que l'apiculteur a lui-même marquées « en retard » :
 * précisément celles qu'il surveille.
 *
 * La jointure part des clients et non des ventes : un client sans commande doit
 * rester visible — c'est justement celui dont on veut parler.
 */
export async function getClients(userId: string): Promise<ClientRow[]> {
  const rows = (await db.execute(sql`
    SELECT
      coalesce(nullif(c.entreprise, ''), trim(coalesce(c.prenom, '') || ' ' || c.nom)) AS nom,
      c.type,
      coalesce(v.nb, 0)::int AS nb_ventes,
      coalesce(v.ca, 0)::float AS ca_euros,
      v.derniere_vente,
      coalesce(v.impaye, 0)::float AS impaye_euros,
      coalesce(v.nb_impayees, 0)::int AS nb_impayees
    FROM clients c
    LEFT JOIN LATERAL (
      SELECT count(*) AS nb,
        sum(t.total::numeric) AS ca,
        max(t.date_transaction) AS derniere_vente,
        sum(t.total::numeric) FILTER (WHERE t.statut IN ('envoyee', 'en_retard')) AS impaye,
        count(*) FILTER (WHERE t.statut IN ('envoyee', 'en_retard')) AS nb_impayees
      FROM transactions t
      WHERE t.client_id = c.id AND t.user_id = ${userId}
        AND t.type = 'vente'
        AND t.statut = ANY(${STATUTS_CA_REALISE})
    ) v ON true
    WHERE c.user_id = ${userId}
    ORDER BY coalesce(v.ca, 0) DESC
    LIMIT 200
  `)) as unknown as Array<{
    nom: string;
    type: string | null;
    nb_ventes: number;
    ca_euros: number;
    derniere_vente: string | null;
    impaye_euros: number;
    nb_impayees: number;
  }>;

  return rows.map((r) => ({
    nom: r.nom,
    type: r.type,
    nbVentes: r.nb_ventes,
    caEuros: r.ca_euros,
    derniereVente: r.derniere_vente,
    impayeEuros: r.impaye_euros,
    nbImpayees: r.nb_impayees,
  }));
}

export interface LotRow {
  numeroLot: string;
  typeMiel: string | null;
  quantiteKg: number | null;
  derniereRecolte: string | null;
  nbRecoltes: number;
  /** Teneur en eau finale du conditionnement, sinon moyenne des récoltes. */
  teneurEauPct: number | null;
  hmfMgKg: number | null;
  /** `false` quand le lot n'a jamais été mis en pot. */
  conditionne: boolean;
  nombrePots: number | null;
}

export interface LotsData {
  lots: LotRow[];
  /** Kilos récoltés SANS numéro de lot — intraçables en l'état. */
  kgSansLot: number;
  nbRecoltesSansLot: number;
}

/**
 * La traçabilité des lots (feature `tracabiliteLots`).
 *
 * Un lot n'est pas une table : c'est l'ensemble des récoltes partageant un
 * `numero_lot`, plus au plus un `conditionnement`. Les récoltes SANS numéro de
 * lot sont comptées à part et non ignorées : ce sont elles le vrai trou de
 * traçabilité — du miel qu'on ne peut rattacher à rien si un contrôle remonte
 * la chaîne.
 */
export async function getLots(userId: string): Promise<LotsData> {
  const nombre = (v: string | number | null): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const lots = (await db.execute(sql`
    SELECT r.numero_lot,
      (array_agg(r.type_miel ORDER BY r.date_recolte DESC) FILTER (WHERE r.type_miel IS NOT NULL))[1] AS type_miel,
      sum(r.quantite_kg::numeric) AS quantite_kg,
      max(r.date_recolte) AS derniere_recolte,
      count(*)::int AS nb_recoltes,
      avg(r.humidite::numeric) AS humidite_moyenne,
      max(c.teneur_eau_pct::numeric) AS teneur_eau_pct,
      max(c.hmf_mg_kg::numeric) AS hmf_mg_kg,
      bool_or(c.id IS NOT NULL) AS conditionne,
      max(c.nombre_pots) AS nombre_pots
    FROM recoltes r
    LEFT JOIN conditionnements c
      ON c.numero_lot = r.numero_lot AND c.user_id = r.user_id
    WHERE r.user_id = ${userId} AND r.numero_lot IS NOT NULL AND r.numero_lot <> ''
    GROUP BY r.numero_lot
    ORDER BY max(r.date_recolte) DESC
    LIMIT 150
  `)) as unknown as Array<{
    numero_lot: string;
    type_miel: string | null;
    quantite_kg: string | null;
    derniere_recolte: string | null;
    nb_recoltes: number;
    humidite_moyenne: string | null;
    teneur_eau_pct: string | null;
    hmf_mg_kg: string | null;
    conditionne: boolean;
    nombre_pots: number | null;
  }>;

  const [sansLot] = (await db.execute(sql`
    SELECT coalesce(sum(quantite_kg::numeric), 0)::float AS kg, count(*)::int AS nb
    FROM recoltes
    WHERE user_id = ${userId} AND (numero_lot IS NULL OR numero_lot = '')
  `)) as unknown as Array<{ kg: number; nb: number }>;

  return {
    lots: lots.map((l) => ({
      numeroLot: l.numero_lot,
      typeMiel: l.type_miel,
      quantiteKg: nombre(l.quantite_kg),
      derniereRecolte: l.derniere_recolte,
      nbRecoltes: l.nb_recoltes,
      // La mesure du conditionnement PRIME sur la moyenne des récoltes : c'est
      // la teneur en eau du miel réellement mis en pot, après maturation.
      teneurEauPct: nombre(l.teneur_eau_pct) ?? nombre(l.humidite_moyenne),
      hmfMgKg: nombre(l.hmf_mg_kg),
      conditionne: l.conditionne,
      nombrePots: l.nombre_pots,
    })),
    kgSansLot: sansLot?.kg ?? 0,
    nbRecoltesSansLot: sansLot?.nb ?? 0,
  };
}
