/**
 * Logique météo apicole pure (testable, sans I/O).
 *
 * Modèle de score « conditions de visite » repensé : multi-facteurs normalisés
 * 0-100 (température, pluie, vent+rafales, ciel, humidité) combinés par poids,
 * avec détail par facteur (pour le radar), score horaire, meilleur créneau du
 * jour et conseils dynamiques. Réutilisé par l'API météo et le cron d'alertes.
 */

/** Table des codes WMO (Open-Meteo) → libellé + icône */
export const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: 'Ciel dégagé', icon: '☀️' },
  1: { label: 'Peu nuageux', icon: '🌤️' },
  2: { label: 'Partiellement nuageux', icon: '⛅' },
  3: { label: 'Couvert', icon: '☁️' },
  45: { label: 'Brouillard', icon: '🌫️' },
  48: { label: 'Brouillard givrant', icon: '🌫️' },
  51: { label: 'Bruine légère', icon: '🌦️' },
  53: { label: 'Bruine', icon: '🌦️' },
  55: { label: 'Bruine forte', icon: '🌧️' },
  61: { label: 'Pluie légère', icon: '🌧️' },
  63: { label: 'Pluie', icon: '🌧️' },
  65: { label: 'Pluie forte', icon: '🌧️' },
  71: { label: 'Neige légère', icon: '🌨️' },
  73: { label: 'Neige', icon: '❄️' },
  75: { label: 'Neige forte', icon: '❄️' },
  77: { label: 'Grésil', icon: '🌨️' },
  80: { label: 'Averses légères', icon: '🌦️' },
  81: { label: 'Averses', icon: '🌧️' },
  82: { label: 'Averses violentes', icon: '⛈️' },
  85: { label: 'Averses de neige', icon: '🌨️' },
  95: { label: 'Orage', icon: '⛈️' },
  96: { label: 'Orage avec grêle', icon: '⛈️' },
  99: { label: 'Orage violent', icon: '⛈️' },
};

export function wmo(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: 'Inconnu', icon: '🌡️' };
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(Math.max(v, min), max);
}

// ─── Notes par facteur (0-100, « plus haut = mieux pour butiner/visiter ») ───

/** Température de l'air (°C). Optimum 20-30°C ; trop froid = pas de vol, trop chaud = stress. */
export function noteTemperature(t: number): number {
  if (t < 8) return 0;
  if (t < 14) return clamp(((t - 8) / 6) * 50);
  if (t < 20) return clamp(50 + ((t - 14) / 6) * 50);
  if (t <= 30) return 100;
  if (t < 38) return clamp(100 - ((t - 30) / 8) * 70);
  return 25;
}

/** Vent moyen + rafales (km/h). Vent effectif = max(moyen, 0.6×rafales). */
export function noteVent(ventMax: number, rafaleMax = 0): number {
  const v = Math.max(ventMax, rafaleMax * 0.6);
  if (v < 12) return 100;
  if (v < 20) return clamp(100 - ((v - 12) / 8) * 40);
  if (v < 30) return clamp(60 - ((v - 20) / 10) * 40);
  if (v < 45) return clamp(20 - ((v - 30) / 15) * 20);
  return 0;
}

/** Pluie (mm cumulés) + probabilité (%). Sec = idéal ; on pénalise aussi une proba élevée. */
export function notePluie(pluieMm: number, probPluie = 0): number {
  if (pluieMm <= 0) return clamp(100 - Math.max(0, probPluie - 20) * 0.7);
  if (pluieMm <= 1) return 55;
  if (pluieMm <= 3) return 30;
  if (pluieMm <= 6) return 12;
  return 0;
}

/** État du ciel via code WMO (dégagé = mieux). */
export function noteCiel(code: number): number {
  if (code <= 1) return 100;
  if (code === 2) return 85;
  if (code === 3) return 60;
  if (code <= 48) return 50;
  if (code <= 55) return 35;
  if (code <= 65) return 18;
  if (code <= 77) return 10;
  if (code <= 86) return 12;
  return 0;
}

/** Humidité relative (%). Optimum 45-70 %. */
export function noteHumidite(h: number): number {
  if (h <= 0) return 80; // donnée absente → neutre-haut
  if (h >= 45 && h <= 70) return 100;
  if (h < 45) return clamp(60 + (h / 45) * 40);
  return clamp(100 - ((h - 70) / 30) * 55);
}

export interface EntreeMeteo {
  tempMax: number;
  pluieMm: number;
  probPluie: number;
  ventMax: number;
  rafaleMax: number;
  humidite: number;
  code: number;
}

export interface Facteur {
  cle: 'temperature' | 'pluie' | 'vent' | 'ciel' | 'humidite';
  label: string;
  valeur: number; // 0-100
  note: string; // qualificatif lisible
}

const POIDS_FACTEURS: Record<Facteur['cle'], number> = {
  temperature: 0.3,
  pluie: 0.3,
  vent: 0.2,
  ciel: 0.15,
  humidite: 0.05,
};

function qualif(v: number): string {
  if (v >= 80) return 'idéal';
  if (v >= 60) return 'favorable';
  if (v >= 40) return 'moyen';
  return 'défavorable';
}

/** Détail des 5 facteurs (axes du radar) pour une situation météo. */
export function facteursJour(e: EntreeMeteo): Facteur[] {
  const t = Math.round(noteTemperature(e.tempMax));
  const p = Math.round(notePluie(e.pluieMm, e.probPluie));
  const v = Math.round(noteVent(e.ventMax, e.rafaleMax));
  const c = Math.round(noteCiel(e.code));
  const h = Math.round(noteHumidite(e.humidite));
  return [
    { cle: 'temperature', label: 'Température', valeur: t, note: qualif(t) },
    { cle: 'pluie', label: 'Pluie', valeur: p, note: qualif(p) },
    { cle: 'vent', label: 'Vent', valeur: v, note: qualif(v) },
    { cle: 'ciel', label: 'Ciel', valeur: c, note: qualif(c) },
    { cle: 'humidite', label: 'Humidité', valeur: h, note: qualif(h) },
  ];
}

export interface PalierScore {
  cle: 'excellent' | 'bon' | 'moyen' | 'defavorable';
  label: string;
}

export function palierScore(score: number): PalierScore {
  if (score >= 80) return { cle: 'excellent', label: 'Excellent' };
  if (score >= 60) return { cle: 'bon', label: 'Bon' };
  if (score >= 40) return { cle: 'moyen', label: 'Moyen' };
  return { cle: 'defavorable', label: 'Défavorable' };
}

export interface EvaluationJour {
  score: number;
  facteurs: Facteur[];
  palier: PalierScore;
}

/** Évaluation complète d'une situation : score global + facteurs + palier. */
export function evaluerJour(e: EntreeMeteo): EvaluationJour {
  const facteurs = facteursJour(e);
  const score = Math.round(facteurs.reduce((s, f) => s + f.valeur * POIDS_FACTEURS[f.cle], 0));
  return { score, facteurs, palier: palierScore(score) };
}

/** Score de visite apicole 0-100 (moyenne pondérée des facteurs). */
export function scoreVisite(e: EntreeMeteo): number {
  return evaluerJour(e).score;
}

export interface HeureMeteo {
  heure: string; // ISO
  temp: number;
  pluie: number;
  probPluie: number;
  vent: number;
  rafale: number;
  humidite: number;
  code: number;
}

/** Score 0-100 d'une heure donnée (même modèle que le jour). */
export function scoreHoraire(h: HeureMeteo): number {
  return scoreVisite({
    tempMax: h.temp,
    pluieMm: h.pluie,
    probPluie: h.probPluie,
    ventMax: h.vent,
    rafaleMax: h.rafale,
    humidite: h.humidite,
    code: h.code,
  });
}

export interface Creneau {
  debut: string; // '11h'
  fin: string; // '15h'
  scoreMoyen: number;
}

/**
 * Meilleur créneau de visite de la journée à partir des heures scorées :
 * plus longue plage diurne (8h-20h) où le score reste >= 55, départagée par
 * le score moyen. Null si aucune fenêtre correcte.
 */
export function meilleurCreneau(heures: { heure: string; score: number }[]): Creneau | null {
  const dujour = heures.filter((h) => {
    const hr = parseInt(h.heure.slice(11, 13), 10);
    return hr >= 8 && hr <= 20;
  });

  // Découpe en plages contiguës (>= 2h) où le score reste >= 55.
  const runs: { heure: string; score: number }[][] = [];
  let run: { heure: string; score: number }[] = [];
  for (const h of dujour) {
    if (h.score >= 55) {
      run.push(h);
    } else {
      if (run.length >= 2) runs.push(run);
      run = [];
    }
  }
  if (run.length >= 2) runs.push(run);
  if (runs.length === 0) return null;

  const somme = (r: { score: number }[]) => r.reduce((s, h) => s + h.score, 0);
  const meilleur = runs.reduce((a, b) => (somme(b) > somme(a) ? b : a));

  const hStart = parseInt(meilleur[0]!.heure.slice(11, 13), 10);
  const hEnd = parseInt(meilleur[meilleur.length - 1]!.heure.slice(11, 13), 10) + 1;
  return {
    debut: `${hStart}h`,
    fin: `${hEnd}h`,
    scoreMoyen: Math.round(somme(meilleur) / meilleur.length),
  };
}

export interface EntreeConseils extends EntreeMeteo {
  tempMin: number;
  alerteGel: boolean;
  alerteOrage: boolean;
  alerteVent: boolean;
  alerteCanicule: boolean;
}

/** Conseils apicoles dynamiques à partir des conditions du jour. */
export function conseilsMeteo(e: EntreeConseils): string[] {
  const conseils: string[] = [];
  if (e.alerteGel)
    conseils.push(
      `Gel annoncé (${Math.round(e.tempMin)}°C) : resserrez les colonies et n'ouvrez pas tôt le matin.`,
    );
  if (e.alerteCanicule)
    conseils.push(
      `Forte chaleur (${Math.round(e.tempMax)}°C) : ombrage + point d'eau, évitez les visites entre 12 h et 17 h.`,
    );
  if (e.alerteVent)
    conseils.push(
      `Rafales jusqu'à ${Math.round(e.rafaleMax)} km/h : arrimez les toits et reportez l'ouverture des ruches.`,
    );
  if (e.alerteOrage) conseils.push('Orage prévu : aucune visite, les abeilles sont nerveuses.');
  if (!e.alerteOrage && e.pluieMm > 2)
    conseils.push('Pluie attendue : reportez les visites, les butineuses restent à la ruche.');
  if (e.humidite >= 85 && !e.alerteOrage)
    conseils.push('Humidité élevée : activité de butinage réduite.');
  if (e.tempMax < 12 && !e.alerteGel)
    conseils.push("Trop frais pour ouvrir (< 12°C) : observez l'entrée plutôt que d'ouvrir.");
  return conseils;
}

// ─── Conservé tel quel (utilisé par le cron d'alertes météo) ──────────────

/** Conditions optimales pour une visite (jour) */
export function optimalVisite(
  tempMax: number,
  pluieMm: number,
  ventMax: number,
  code: number,
): boolean {
  return tempMax >= 15 && pluieMm === 0 && ventMax < 20 && code < 51;
}

export interface MeteoAlerts {
  alerteGel: boolean;
  alerteOrage: boolean;
  alerteVent: boolean;
  alerteCanicule: boolean;
}

/**
 * Alertes apicoles d'une journée.
 * - Gel : nuit <= 3°C (risque pour le couvain)
 * - Orage : code WMO >= 95
 * - Vent : rafales >= 40 km/h (ruches à sécuriser)
 * - Canicule : max >= 35°C (stress thermique, ventilation des butineuses)
 */
export function dayAlerts(
  tempMin: number,
  tempMax: number,
  code: number,
  rafaleMax: number,
): MeteoAlerts {
  return {
    alerteGel: tempMin <= 3,
    alerteOrage: code >= 95,
    alerteVent: rafaleMax >= 40,
    alerteCanicule: tempMax >= 35,
  };
}
