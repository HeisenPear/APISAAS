/**
 * Logique météo apicole pure (testable, sans I/O).
 * Extraite de server/api/meteo/[rucherId].get.ts pour pouvoir être couverte
 * par des tests unitaires et réutilisée (ex: cron d'alertes météo).
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

/** Score de visite apicole 0-100 basé sur les conditions du jour */
export function scoreVisite(
  tempMax: number,
  pluieMm: number,
  ventMax: number,
  code: number,
): number {
  let score = 0;

  // Température (40 pts)
  if (tempMax >= 20) score += 40;
  else if (tempMax >= 15) score += 30;
  else if (tempMax >= 12) score += 15;

  // Précipitations (30 pts)
  if (pluieMm === 0) score += 30;
  else if (pluieMm <= 2) score += 15;

  // Vent (20 pts)
  if (ventMax < 15) score += 20;
  else if (ventMax < 25) score += 10;

  // Ciel (10 pts)
  if (code <= 2) score += 10;
  else if (code === 3) score += 5;

  return Math.min(100, score);
}

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
