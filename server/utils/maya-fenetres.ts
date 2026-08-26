import { eq, sql } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';
import { scoreVisite, wmo } from '~~/server/utils/meteo';
import { moisParis } from '~~/server/utils/horloge';

/**
 * Maya — Fenêtres d'intervention prédictives (capacité Beekube #4).
 *
 * 100 % DÉTERMINISTE, sans LLM : croise l'historique d'interventions, la
 * saison apicole française et la météo PRÉVUE (Open-Meteo, même score de
 * conditions de visite que le reste de l'app) pour proposer, par rucher, les
 * meilleurs créneaux de visite / récolte / traitement varroa / nourrissement —
 * et permettre d'en créer une alerte.
 *
 * Architecture : un cœur PUR et testable (`calculerFenetresRucher`) + un
 * orchestrateur (`getFenetres`) qui lit la base et appelle la météo. La date du
 * jour est injectée pour rendre la logique reproductible en test.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TacheFenetre = 'controle' | 'recolte' | 'varroa' | 'nourrissement';

export const TACHE_LABEL: Record<TacheFenetre, string> = {
  controle: 'Contrôle',
  recolte: 'Récolte',
  varroa: 'Traitement varroa',
  nourrissement: 'Nourrissement',
};

export const TACHE_ICON: Record<TacheFenetre, string> = {
  controle: 'i-lucide-search',
  recolte: 'i-lucide-droplets',
  varroa: 'i-lucide-bug',
  nourrissement: 'i-lucide-utensils',
};

export type Urgence = 'haute' | 'moyenne' | 'basse';

export interface MeteoJourFenetre {
  date: string; // YYYY-MM-DD
  scoreVisite: number; // 0-100
  tempMax: number;
  ventMaxKmh: number;
  pluieMm: number;
  conditions: string;
}

export interface FenetreSuggestion {
  rucherId: string;
  rucherNom: string;
  tache: TacheFenetre;
  tacheLabel: string;
  icon: string;
  urgence: Urgence;
  /** Justification citant la donnée réelle (« dernière visite il y a 23 j… »). */
  raison: string;
  /** Meilleur jour de la fenêtre météo (tâches sensibles au temps). */
  meilleureDate: string | null;
  meilleureDateLabel: string | null;
  scoreMeteo: number | null;
  meteoResume: string | null;
  /** Tout le nécessaire pour matérialiser l'alerte (POST fenetres-alerte). */
  alerte: {
    type: string;
    titre: string;
    message: string;
    priorite: Urgence;
    actionUrl: string;
  };
}

export interface RucherFenetreInput {
  rucherId: string;
  rucherNom: string;
  /** Date ISO (YYYY-MM-DD) de la dernière intervention de chaque catégorie. */
  derniers: Partial<Record<TacheFenetre, string | null>>;
  /** Prévisions météo (vide si rucher sans GPS). */
  previsions: MeteoJourFenetre[];
}

// ─── Helpers purs ────────────────────────────────────────────────────────────

const JOUR_MS = 86_400_000;

export function joursDepuis(dateISO: string | null | undefined, aujourdhui: Date): number | null {
  if (!dateISO) return null;
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((aujourdhui.getTime() - d.getTime()) / JOUR_MS);
}

function formatDateFr(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function resumeMeteo(j: MeteoJourFenetre): string {
  return `${Math.round(j.tempMax)}°C · vent ${Math.round(j.ventMaxKmh)} km/h · ${j.conditions.toLowerCase()}`;
}

/**
 * Meilleur jour parmi les prévisions.
 * - sensible au temps : on prend le meilleur score de visite.
 * - tolérant : on privilégie un jour sec (peu de pluie), score en départage.
 */
function meilleurJour(previsions: MeteoJourFenetre[], sensible: boolean): MeteoJourFenetre | null {
  if (previsions.length === 0) return null;
  const tri = [...previsions].sort((a, b) => {
    if (!sensible) {
      // tolérant : sec d'abord, puis meilleur score
      const pluieA = a.pluieMm > 1 ? 1 : 0;
      const pluieB = b.pluieMm > 1 ? 1 : 0;
      if (pluieA !== pluieB) return pluieA - pluieB;
    }
    return b.scoreVisite - a.scoreVisite;
  });
  return tri[0] ?? null;
}

function lien(rucherId: string): string {
  return `/interventions/nouvelle?rucherId=${rucherId}&niveau=rucher&from=/copilote/fenetres`;
}

const ORDRE_URGENCE: Record<Urgence, number> = { haute: 0, moyenne: 1, basse: 2 };

// ─── Règles déterministes par tâche ──────────────────────────────────────────

/**
 * Intervalle de visite recommandé (jours) selon le mois — calendrier apicole
 * tempéré français. Hors saison (hivernage) : pas de visite suggérée, on
 * n'ouvre pas une ruche par temps froid.
 */
function intervalleVisite(mois: number): number | null {
  if (mois >= 4 && mois <= 6) return 12; // pleine saison + surveillance essaimage
  if (mois === 7 || mois === 8) return 16; // été
  if (mois === 3 || mois === 9) return 21; // reprise de printemps / visite d'automne
  return null; // oct → fév : hivernage
}

function regleControle(
  input: RucherFenetreInput,
  mois: number,
  aujourdhui: Date,
): FenetreSuggestion | null {
  const interval = intervalleVisite(mois);
  if (interval === null) return null;

  const jours = joursDepuis(input.derniers.controle, aujourdhui);
  let urgence: Urgence;
  let raison: string;

  if (jours === null) {
    urgence = mois >= 4 && mois <= 7 ? 'haute' : 'moyenne';
    raison = 'Aucun contrôle enregistré sur ce rucher.';
  } else if (jours >= interval * 2) {
    urgence = 'haute';
    raison = `Dernier contrôle il y a ${jours} j (au-delà du double de l'intervalle conseillé de ${interval} j).`;
  } else if (jours >= interval) {
    urgence = 'moyenne';
    raison = `Dernier contrôle il y a ${jours} j — l'intervalle conseillé en cette saison est de ${interval} j.`;
  } else {
    return null; // à jour
  }
  if (mois >= 4 && mois <= 6) raison += ' Période d’essaimage : à surveiller de près.';

  return assembler(input, 'controle', urgence, raison, true);
}

function regleRecolte(
  input: RucherFenetreInput,
  mois: number,
  aujourdhui: Date,
): FenetreSuggestion | null {
  if (mois < 6 || mois > 8) return null; // miellées d'été
  const jours = joursDepuis(input.derniers.recolte, aujourdhui);
  if (jours !== null && jours < 21) return null; // récolte récente

  const urgence: Urgence = mois === 7 && (jours === null || jours >= 30) ? 'haute' : 'moyenne';
  const raison =
    jours === null
      ? 'Pleine saison de récolte (miellée d’été) et aucune récolte enregistrée cette saison.'
      : `Pleine saison de récolte — dernière récolte il y a ${jours} j. Vérifie l’operculation des hausses.`;
  return assembler(input, 'recolte', urgence, raison, true);
}

function regleVarroa(
  input: RucherFenetreInput,
  mois: number,
  aujourdhui: Date,
): FenetreSuggestion | null {
  const jours = joursDepuis(input.derniers.varroa, aujourdhui);

  // Traitement principal post-récolte (juil → sept) : fenêtre CLÉ.
  if (mois >= 7 && mois <= 9) {
    if (jours !== null && jours < 60) return null;
    const raison =
      jours === null
        ? 'Fenêtre clé du traitement varroa après récolte : la colonie élève ses abeilles d’hiver, aucun traitement enregistré.'
        : `Fenêtre clé du traitement varroa après récolte — dernier acte varroa il y a ${jours} j.`;
    return assembler(input, 'varroa', 'haute', raison, false);
  }
  // Traitement hivernal hors couvain (nov → déc) : acide oxalique.
  if (mois === 11 || mois === 12) {
    if (jours !== null && jours < 45) return null;
    const raison =
      'Traitement hivernal hors couvain recommandé (acide oxalique) pour repartir au printemps sur une faible infestation.';
    return assembler(input, 'varroa', 'moyenne', raison, false);
  }
  return null;
}

function regleNourrissement(
  input: RucherFenetreInput,
  mois: number,
  aujourdhui: Date,
): FenetreSuggestion | null {
  const jours = joursDepuis(input.derniers.nourrissement, aujourdhui);

  // Nourrissement d'automne (sept → oct) : constituer les réserves d'hiver.
  if (mois === 9 || mois === 10) {
    if (jours !== null && jours < 21) return null;
    const urgence: Urgence = mois === 10 && jours === null ? 'haute' : 'moyenne';
    const raison =
      jours === null
        ? 'Nourrissement d’automne à engager pour constituer les réserves d’hiver (aucun nourrissement enregistré).'
        : `Nourrissement d’automne — dernier apport il y a ${jours} j. Vise des réserves suffisantes avant l’hiver.`;
    return assembler(input, 'nourrissement', urgence, raison, false);
  }
  // Stimulation de printemps (fév → mars).
  if (mois === 2 || mois === 3) {
    if (jours !== null && jours < 30) return null;
    return assembler(
      input,
      'nourrissement',
      'basse',
      'Stimulation de printemps possible (sirop léger / candi) pour relancer la ponte.',
      false,
    );
  }
  return null;
}

/** Construit la suggestion finale : météo + libellés + payload d'alerte. */
function assembler(
  input: RucherFenetreInput,
  tache: TacheFenetre,
  urgence: Urgence,
  raison: string,
  sensibleMeteo: boolean,
): FenetreSuggestion {
  const jour = meilleurJour(input.previsions, sensibleMeteo);
  const meilleureDate = jour?.date ?? null;
  const meteoResume = jour ? resumeMeteo(jour) : null;
  const meilleureDateLabel = meilleureDate ? formatDateFr(meilleureDate) : null;

  let phraseMeteo = '';
  if (jour) {
    phraseMeteo = sensibleMeteo
      ? ` Meilleure fenêtre : ${meilleureDateLabel} (${meteoResume}).`
      : ` Jour praticable : ${meilleureDateLabel} (${meteoResume}).`;
    if (sensibleMeteo && jour.scoreVisite < 40) {
      phraseMeteo = ` Aucune fenêtre météo idéale d’ici 5 jours — au mieux ${meilleureDateLabel} (${meteoResume}).`;
    }
  }

  const label = TACHE_LABEL[tache];
  const message = `${raison}${phraseMeteo}`;

  return {
    rucherId: input.rucherId,
    rucherNom: input.rucherNom,
    tache,
    tacheLabel: label,
    icon: TACHE_ICON[tache],
    urgence,
    raison,
    meilleureDate,
    meilleureDateLabel,
    scoreMeteo: jour?.scoreVisite ?? null,
    meteoResume,
    alerte: {
      type: `fenetre_${tache}`,
      titre: `${label} conseillé·e — ${input.rucherNom}`,
      message,
      priorite: urgence,
      actionUrl: lien(input.rucherId),
    },
  };
}

// ─── Cœur pur : suggestions d'un rucher ──────────────────────────────────────

export function calculerFenetresRucher(
  input: RucherFenetreInput,
  aujourdhui: Date,
): FenetreSuggestion[] {
  // ⚠️ LE MOIS DÉCIDE DE TOUTES LES FENÊTRES SAISONNIÈRES, et il se lisait
  // dans le fuseau du serveur. C'est le défaut exact que `horloge.ts` a été
  // écrit pour fermer : « une fenêtre saisonnière qui s'ouvre le 1er mars
  // s'ouvrait en réalité le 28 février à 23 h ».
  const mois = moisParis(aujourdhui); // 1-12
  const suggestions = [
    regleControle(input, mois, aujourdhui),
    regleRecolte(input, mois, aujourdhui),
    regleVarroa(input, mois, aujourdhui),
    regleNourrissement(input, mois, aujourdhui),
  ].filter((s): s is FenetreSuggestion => s !== null);
  return suggestions;
}

/** Tri global : urgence d'abord, puis meilleur score météo, puis rucher. */
export function trierFenetres(fenetres: FenetreSuggestion[]): FenetreSuggestion[] {
  return [...fenetres].sort((a, b) => {
    if (ORDRE_URGENCE[a.urgence] !== ORDRE_URGENCE[b.urgence]) {
      return ORDRE_URGENCE[a.urgence] - ORDRE_URGENCE[b.urgence];
    }
    const sa = a.scoreMeteo ?? -1;
    const sb = b.scoreMeteo ?? -1;
    if (sa !== sb) return sb - sa;
    return a.rucherNom.localeCompare(b.rucherNom, 'fr');
  });
}

// ─── Accès données (lecture seule, scopé userId) ─────────────────────────────

interface RucherGps {
  id: string;
  nom: string;
  latitude: string | null;
  longitude: string | null;
}

/** Dernière intervention par catégorie et par rucher, en une seule requête. */
async function getDerniersParCategorie(
  userId: string,
): Promise<Map<string, Partial<Record<TacheFenetre, string>>>> {
  const rows = (await db.execute(sql`
    SELECT
      COALESCE(i.rucher_id, r.rucher_id) AS rucher_id,
      MAX(i.date_visite) FILTER (WHERE i.type = 'controle'      OR i.categories_activees ? 'controle')      AS controle,
      MAX(i.date_visite) FILTER (WHERE i.type = 'recolte'       OR i.categories_activees ? 'recolte')       AS recolte,
      MAX(i.date_visite) FILTER (WHERE i.type = 'varroa'        OR i.categories_activees ? 'varroa')        AS varroa,
      MAX(i.date_visite) FILTER (WHERE i.type = 'nourrissement' OR i.categories_activees ? 'nourrissement') AS nourrissement
    FROM interventions i
    LEFT JOIN ruches r ON r.id = i.ruche_id
    WHERE i.user_id = ${userId}
    GROUP BY COALESCE(i.rucher_id, r.rucher_id)
  `)) as unknown as Array<{
    rucher_id: string | null;
    controle: string | null;
    recolte: string | null;
    varroa: string | null;
    nourrissement: string | null;
  }>;

  const map = new Map<string, Partial<Record<TacheFenetre, string>>>();
  const iso = (v: string | null) => (v ? String(v).slice(0, 10) : undefined);
  for (const row of rows) {
    if (!row.rucher_id) continue;
    map.set(row.rucher_id, {
      controle: iso(row.controle),
      recolte: iso(row.recolte),
      varroa: iso(row.varroa),
      nourrissement: iso(row.nourrissement),
    });
  }
  return map;
}

/** Prévisions Open-Meteo 5 j → MeteoJourFenetre[] (best-effort, [] si échec). */
async function fetchPrevisions(lat: string, lon: string): Promise<MeteoJourFenetre[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Europe%2FParis&forecast_days=5`;
    const meteo = (await $fetch(url, { timeout: 8000 })) as {
      daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        precipitation_sum: number[];
        wind_speed_10m_max: number[];
      };
    };
    return meteo.daily.time.map((date, i) => {
      const code = meteo.daily.weather_code[i] ?? 0;
      const tempMax = meteo.daily.temperature_2m_max[i] ?? 0;
      const pluieMm = meteo.daily.precipitation_sum[i] ?? 0;
      const ventMaxKmh = meteo.daily.wind_speed_10m_max[i] ?? 0;
      return {
        date,
        tempMax,
        pluieMm,
        ventMaxKmh,
        conditions: wmo(code).label,
        scoreVisite: scoreVisite({
          tempMax,
          pluieMm,
          probPluie: 0,
          ventMax: ventMaxKmh,
          rafaleMax: ventMaxKmh,
          humidite: 60,
          code,
        }),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Orchestrateur : toutes les fenêtres suggérées pour l'exploitation.
 * Limite la météo aux 12 premiers ruchers avec GPS pour borner la latence.
 */
export async function getFenetres(
  userId: string,
  aujourdhui: Date = new Date(),
): Promise<FenetreSuggestion[]> {
  const [rucherRows, derniers] = await Promise.all([
    db
      .select({
        id: ruchers.id,
        nom: ruchers.nom,
        latitude: ruchers.latitude,
        longitude: ruchers.longitude,
      })
      .from(ruchers)
      .where(eq(ruchers.userId, userId)) as Promise<RucherGps[]>,
    getDerniersParCategorie(userId),
  ]);

  const MAX_METEO = 12;
  let meteoBudget = MAX_METEO;
  const inputs = await Promise.all(
    rucherRows.map(async (r): Promise<RucherFenetreInput> => {
      const peutMeteo = r.latitude && r.longitude && meteoBudget > 0;
      if (peutMeteo) meteoBudget -= 1;
      const previsions = peutMeteo ? await fetchPrevisions(r.latitude!, r.longitude!) : [];
      return {
        rucherId: r.id,
        rucherNom: r.nom,
        derniers: derniers.get(r.id) ?? {},
        previsions,
      };
    }),
  );

  const toutes = inputs.flatMap((input) => calculerFenetresRucher(input, aujourdhui));
  return trierFenetres(toutes);
}
