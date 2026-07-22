// ═══════════════════════════════════════════════════════════════════════════
// ADAPTATEUR BEEP (api.beep.nl).
//
// BEEP est la SEULE API apicole publique et gratuite du marché (fondation
// néerlandaise, open source). C'est notre unique voie de synchronisation
// automatique « pull » ; tout le reste du marché est soit du push (webhook /
// TTN), soit du cloud fermé (import CSV).
//
// Règles de robustesse, non négociables :
//  - TIMEOUT sur chaque appel : BEEP indisponible ne doit JAMAIS transformer
//    une requête utilisateur en 504.
//  - Typage DÉFENSIF : la forme exacte des réponses n'est pas contractuelle, on
//    ne présume RIEN. Tout finit dans le normaliseur, qui sait déjà tolérer
//    l'inconnu et conserve le brut.
//  - Erreurs remontées en `ErreurBeep` (message affichable), jamais en 500 nu.
// ═══════════════════════════════════════════════════════════════════════════

import { normaliserLot, type MesureNormalisee } from './normaliser';

const BASE_BEEP = 'https://api.beep.nl/api';
/** Assez pour un aller-retour transatlantique, assez court pour ne pas bloquer une lambda. */
const TIMEOUT_MS = 8000;

/** Erreur « métier » BEEP : message affichable tel quel à l'utilisateur. */
export class ErreurBeep extends Error {
  readonly statut: number;
  constructor(message: string, statut = 502) {
    super(message);
    this.name = 'ErreurBeep';
    this.statut = statut;
  }
}

export interface DeviceBeep {
  id: string;
  nom: string;
  /** Clé d'appairage BEEP (`key`) — c'est elle qui identifie l'appareil dans les mesures. */
  cle: string | null;
}

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function texte(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number') return String(v);
  return null;
}

/** Appel HTTP brut, borné dans le temps et sans jamais laisser fuiter une erreur technique. */
async function appelBeep(
  chemin: string,
  opts: { token?: string; methode?: 'GET' | 'POST'; corps?: Record<string, unknown> } = {},
): Promise<unknown> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_BEEP}${chemin}`, {
      method: opts.methode ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(opts.corps ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.corps ? JSON.stringify(opts.corps) : undefined,
      signal: controleur.signal,
    });
    if (res.status === 401 || res.status === 403) {
      throw new ErreurBeep('Identifiants BEEP refusés — reconnecte ton compte BEEP.', 401);
    }
    if (!res.ok) {
      throw new ErreurBeep(`BEEP a répondu ${res.status}. Réessaie dans quelques minutes.`);
    }
    return (await res.json()) as unknown;
  } catch (err) {
    if (err instanceof ErreurBeep) throw err;
    const nom = (err as { name?: string } | null)?.name;
    if (nom === 'AbortError' || nom === 'TimeoutError') {
      throw new ErreurBeep(`BEEP n'a pas répondu en ${TIMEOUT_MS / 1000} s.`, 504);
    }
    throw new ErreurBeep('BEEP est injoignable pour le moment.');
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Échange email + mot de passe contre un `api_token` durable.
 * ⚠️ Le mot de passe n'est JAMAIS stocké : seul le token revient et est persisté.
 */
export async function authentifierBeep(email: string, motDePasse: string): Promise<string> {
  const res = await appelBeep('/authenticate', {
    methode: 'POST',
    corps: { email, password: motDePasse },
  });
  const jeton = estObjet(res)
    ? (texte(res.api_token) ?? texte(res.token) ?? texte(res.access_token))
    : null;
  if (!jeton)
    throw new ErreurBeep('BEEP n’a pas renvoyé de jeton — vérifie tes identifiants.', 401);
  return jeton;
}

/** Liste les appareils du compte BEEP. Tolère les deux enveloppes observées (`{data:[…]}` ou `[…]`). */
export async function listerDevicesBeep(token: string): Promise<DeviceBeep[]> {
  const res = await appelBeep('/devices', { token });
  const brut: unknown = estObjet(res) ? (res.data ?? res.devices) : res;
  if (!Array.isArray(brut)) return [];
  const out: DeviceBeep[] = [];
  for (const item of brut as unknown[]) {
    if (!estObjet(item)) continue;
    const id = texte(item.id) ?? texte(item.key) ?? texte(item.hardware_id);
    if (!id) continue;
    out.push({
      id,
      nom: texte(item.name) ?? texte(item.hive_name) ?? `Appareil ${id}`,
      cle: texte(item.key),
    });
  }
  return out;
}

/**
 * Mesures d'un appareil. `interval` suit la nomenclature BEEP (`hour`, `day`,
 * `week`, `month`, `year`) ; l'appelant choisit selon ce qu'il rattrape.
 */
export async function mesuresBeep(
  token: string,
  deviceId: string,
  interval: 'hour' | 'day' | 'week' | 'month' | 'year' = 'week',
): Promise<unknown[]> {
  const params = new URLSearchParams({ id: deviceId, interval });
  const res = await appelBeep(`/sensors/measurements?${params.toString()}`, { token });
  const brut: unknown = estObjet(res) ? (res.measurements ?? res.data ?? res.sensors) : res;
  return Array.isArray(brut) ? (brut as unknown[]) : [];
}

/** Dernières valeurs connues de tous les capteurs d'un appareil (un seul point). */
export async function dernieresValeursBeep(token: string, deviceId: string): Promise<unknown> {
  const params = new URLSearchParams({ id: deviceId });
  const res = await appelBeep(`/sensors/lastvalues?${params.toString()}`, { token });
  return estObjet(res) ? (res.data ?? res) : res;
}

/** Dernier poids connu (endpoint dédié, plus léger que `lastvalues`). */
export async function dernierPoidsBeep(token: string, deviceId: string): Promise<unknown> {
  const params = new URLSearchParams({ id: deviceId });
  const res = await appelBeep(`/sensors/lastweight?${params.toString()}`, { token });
  return estObjet(res) ? (res.data ?? res) : res;
}

/**
 * Récupère et normalise l'historique d'un appareil BEEP.
 * Retombe sur `lastvalues` si l'historique est vide (appareil neuf, ou intervalle
 * sans données) pour qu'une synchro rapporte au moins le point courant.
 *
 * `naifEnUtc: true` : BEEP horodate en UTC sans suffixe de fuseau — sans ça, on
 * décalerait toute la série de 1 à 2 h.
 */
export async function synchroniserDeviceBeep(
  token: string,
  deviceId: string,
  interval: 'hour' | 'day' | 'week' | 'month' | 'year' = 'week',
): Promise<MesureNormalisee[]> {
  const brut = await mesuresBeep(token, deviceId, interval);
  if (brut.length > 0) return normaliserLot(brut, { naifEnUtc: true }).mesures;

  const derniere = await dernieresValeursBeep(token, deviceId);
  return normaliserLot(derniere, { naifEnUtc: true }).mesures;
}
