import { nombre } from '~/config/balances';
import type { PeriodeBalance, SourceBalance, StatutBalance } from '~/config/balances';

/**
 * Balances connectées — accès aux données côté client.
 *
 * ⚠️ Une valeur numérique peut arriver en STRING (colonne `decimal` lue par
 * Drizzle) OU en NUMBER (agrégat SQL casté en float8). Les deux formes cohabitent
 * dans l'API selon la route. On les accepte toutes les deux et on passe
 * systématiquement par `nombre()` (~/config/balances) avant tout calcul.
 */
type Num = string | number | null;

export interface Balance {
  id: string;
  nom: string;
  marque: string | null;
  modele: string | null;
  source: SourceBalance;
  identifiantExterne: string | null;
  /** Secret du webhook d'ingestion — à ne montrer que sur la fiche. */
  ingestToken: string;
  rucheId: string | null;
  hausseId: string | null;
  rucherId: string | null;
  poidsTare: Num;
  statut: StatutBalance;
  seuilVariationKg: Num;
  seuilPoidsRecolteKg: Num;
  seuilBatteriePct: number | null;
  seuilSilenceHeures: number | null;
  derniereMesureAt: string | null;
  dernierPoidsKg: Num;
  batteriePct: number | null;
  notes: string | null;
  /** Réglages libres (jsonb) — dont `unitePoids`, cf. `uniteDeBalance()`. */
  config?: Record<string, unknown> | null;
  /** URL d'ingestion prête à copier, calculée côté serveur. */
  urlIngestion?: string;
  /** Dernier point connu — forme brute, à passer par `derniereMesureDe()`. */
  derniereMesure?: Record<string, unknown> | null;
  nbMesures?: number;
  premiereMesureAt?: string | null;
  /** Libellés de liaison, quand l'API les joint. */
  rucheNumero?: string | null;
  hausseNumero?: string | null;
  rucherNom?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Un point de courbe, normalisé — quelle que soit la route qui l'a produit. */
export interface Mesure {
  mesureeAt: string;
  poidsKg: Num;
  poidsNetKg: Num;
  variationKg: Num;
  variation24hKg: Num;
  poidsMinKg: Num;
  poidsMaxKg: Num;
  temperatureC: Num;
  temperatureIntC: Num;
  humidite: Num;
  batteriePct: number | null;
  signalDbm: Num;
}

export interface CourbeBalance {
  mesures: Mesure[];
  /** L'historique a été coupé par la limite du plan (la donnée, elle, est intacte). */
  tronquee: boolean;
  joursMaxPlan: number | null;
  resume: { poidsDebutKg: number | null; poidsFinKg: number | null; gainKg: number | null } | null;
}

export interface CreateBalancePayload {
  nom: string;
  source: SourceBalance;
  marque?: string | null;
  modele?: string | null;
  identifiantExterne?: string | null;
  rucheId?: string | null;
  hausseId?: string | null;
  rucherId?: string | null;
  poidsTare?: number | null;
  notes?: string | null;
}

export type UpdateBalancePayload = Partial<
  CreateBalancePayload & {
    statut: StatutBalance;
    seuilVariationKg: number | null;
    seuilPoidsRecolteKg: number | null;
    seuilBatteriePct: number | null;
    seuilSilenceHeures: number | null;
    /** `null` = retour à la détection automatique. */
    unitePoids: UnitePoids | null;
  }
>;

/** Unité dans laquelle la balance exprime le poids. */
export type UnitePoids = 'kg' | 'g';

/**
 * Unité mémorisée pour cette balance, et si elle a été DÉTECTÉE (à la première
 * connexion, quand la ruche était sur le plateau) ou choisie à la main.
 */
export function uniteDeBalance(balance: Balance): { unite: UnitePoids | null; apprise: boolean } {
  const c = (balance.config ?? {}) as Record<string, unknown>;
  const u = c.unitePoids;
  return { unite: u === 'kg' || u === 'g' ? u : null, apprise: c.unitePoidsApprise === true };
}

export interface ResultatImportBalance {
  importees: number;
  ignorees?: number;
}

export interface ResultatSyncBalance {
  balances?: number;
  mesures?: number;
}

interface Enveloppe<T> {
  data: T;
}

// ─────────────────────────────────────────────────────────────
// Normalisation
//
// Les routes ne servent pas toutes la même forme : la liste passe par un
// DISTINCT ON en SQL brut (clés snake_case, float8), la fiche sert une ligne
// Drizzle (camelCase, decimal en string) et la courbe sert des buckets agrégés
// (clé de temps `t`). Un SEUL endroit convertit, tout le reste voit `Mesure`.
// ─────────────────────────────────────────────────────────────

function champ(src: Record<string, unknown>, ...cles: string[]): Num {
  for (const c of cles) {
    const v = src[c];
    if (typeof v === 'number' || typeof v === 'string') return v;
  }
  return null;
}

function entier(src: Record<string, unknown>, ...cles: string[]): number | null {
  for (const c of cles) {
    const v = src[c];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function normaliserMesure(src: Record<string, unknown>): Mesure {
  const quand = champ(src, 'mesureeAt', 'mesuree_at', 't');
  return {
    mesureeAt: typeof quand === 'string' ? quand : new Date(Number(quand ?? 0)).toISOString(),
    poidsKg: champ(src, 'poidsKg', 'poids_kg'),
    poidsNetKg: champ(src, 'poidsNetKg', 'poids_net_kg'),
    variationKg: champ(src, 'variationKg', 'variation_kg'),
    variation24hKg: champ(src, 'variation24hKg', 'variation_24h_kg'),
    poidsMinKg: champ(src, 'poidsMinKg'),
    poidsMaxKg: champ(src, 'poidsMaxKg'),
    temperatureC: champ(src, 'temperatureC', 'temperature_c'),
    temperatureIntC: champ(src, 'temperatureIntC', 'temperature_int_c'),
    humidite: champ(src, 'humidite'),
    batteriePct: entier(src, 'batteriePct', 'batterie_pct'),
    signalDbm: champ(src, 'signalDbm', 'signal_dbm'),
  };
}

/** Dernier point servi avec la balance elle-même (liste et fiche), s'il existe. */
export function derniereMesureDe(balance: Balance): Mesure | null {
  return balance.derniereMesure ? normaliserMesure(balance.derniereMesure) : null;
}

/**
 * Poids NET à afficher, en kg — source unique pour la carte et la fiche.
 *
 * Trois origines par ordre de fiabilité : le net déjà calculé de la mesure, son
 * poids brut moins la tare, puis le cache de la balance.
 *
 * ⚠️ `dernierPoidsKg` (comme `poidsKg`) est un poids BRUT. L'afficher tel quel
 * sous un libellé « poids net » se trompait de toute la tare — une ruche vide
 * pèse une vingtaine de kilos, l'écart n'a rien d'anecdotique. Ce repli sert dès
 * que l'API ne joint pas `derniereMesure` et qu'aucun point de courbe n'est
 * disponible (balance muette au-delà de la période, fenêtre de plan tronquée).
 */
export function poidsNetAffiche(balance: Balance, mesure?: Mesure | null): number | null {
  const net = mesure ? nombre(mesure.poidsNetKg) : null;
  if (net !== null) return net;

  const tare = nombre(balance.poidsTare) ?? 0;
  const brut = mesure ? nombre(mesure.poidsKg) : nombre(balance.dernierPoidsKg);
  return brut === null ? null : Math.round((brut - tare) * 100) / 100;
}

/**
 * Série pour les courbes. Tolérante à la forme de réponse : tableau nu de
 * mesures, ou enveloppe `{ points, resume, tronquee… }` telle que servie par
 * l'agrégation SQL.
 */
/**
 * ⚠️ TOUS LES APPELS DE CE FICHIER PASSENT PAR `appelApi`, PAS PAR `$fetch`.
 *
 * Deux d'entre eux portaient déjà un contournement local — `($fetch as typeof
 * $fetch<unknown, string>)` — écrit sans dire pourquoi. C'était la même cause :
 * `$fetch` type sa réponse en résolvant le chemin contre l'union des 213
 * routes, ce qui oblige TypeScript à déplier le type de retour RÉEL de chaque
 * handler. Le projet en était à 9,3 millions d'instanciations pour une limite
 * de 5 ; l'ajout d'UNE route, fût-elle d'une ligne, rendait `npm run typecheck`
 * rouge — avec 90 `implicit any` dans des fichiers sans aucun rapport.
 *
 * `app/utils/appelApi.ts` porte la mesure complète et la règle : on bascule
 * site par site, et le commentaire du site dit lequel.
 */
export async function fetchCourbeBalance(
  id: string,
  periode: PeriodeBalance = '24h',
): Promise<CourbeBalance> {
  /**
   * ⚠️ `appelApi` PLUTÔT QUE `$fetch`/`useFetch` — cf. `app/utils/appelApi.ts`.
   * Typer le chemin contre l'union des 213 routes fait déplier à TypeScript le
   * type de retour réel de chaque handler ; ce projet en était à 9,3 millions
   * d'instanciations pour une limite de 5, et la moindre route ajoutée rendait
   * le typecheck rouge. Le type est donné, donc toujours vérifié.
   */
  const res = await appelApi<Enveloppe<unknown>>(
    `/api/balances/${id}/mesures?periode=${encodeURIComponent(periode)}`,
  );
  const brut = res.data;

  if (Array.isArray(brut)) {
    return {
      mesures: brut.map((p) => normaliserMesure(p as Record<string, unknown>)),
      tronquee: false,
      joursMaxPlan: null,
      resume: null,
    };
  }

  const env = (brut ?? {}) as Record<string, unknown>;
  const points = Array.isArray(env.points) ? env.points : [];
  return {
    mesures: points.map((p) => normaliserMesure(p as Record<string, unknown>)),
    tronquee: env.tronquee === true,
    joursMaxPlan: typeof env.joursMaxPlan === 'number' ? env.joursMaxPlan : null,
    resume: (env.resume as CourbeBalance['resume']) ?? null,
  };
}

/**
 * Raccourci « je ne veux que les points » — utilisé par la carte compacte, qui
 * doit pouvoir se servir SANS déclencher le fetch de la liste des balances.
 */
export async function fetchMesuresBalance(
  id: string,
  periode: PeriodeBalance = '24h',
): Promise<Mesure[]> {
  return (await fetchCourbeBalance(id, periode)).mesures;
}

/**
 * Mutations et actions SANS chargement de la liste : les composants de la fiche
 * (guide de source, réglages) en ont besoin sans déclencher un `/api/balances`
 * parasite. `useBalances()` les ré-expose telles quelles.
 */
export function useBalanceActions() {
  async function createBalance(payload: CreateBalancePayload): Promise<Balance> {
    const res = await appelApi<Enveloppe<Balance>>('/api/balances', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  }

  async function getBalance(id: string): Promise<Balance> {
    const res = await appelApi<Enveloppe<Balance>>(`/api/balances/${id}`);
    return res.data;
  }

  async function updateBalance(id: string, payload: UpdateBalancePayload): Promise<Balance> {
    const res = await appelApi<Enveloppe<Balance>>(`/api/balances/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return res.data;
  }

  async function deleteBalance(id: string): Promise<void> {
    await appelApi<unknown>(`/api/balances/${id}`, { method: 'DELETE' });
  }

  /** Import du fichier exporté depuis le cloud d'un fabricant (marques fermées). */
  async function importerFichier(id: string, fichier: File): Promise<ResultatImportBalance> {
    const form = new FormData();
    form.append('fichier', fichier);
    const res = await appelApi<Enveloppe<ResultatImportBalance>>(`/api/balances/${id}/import`, {
      method: 'POST',
      body: form,
    });
    return res.data;
  }

  /** Va chercher les nouvelles mesures chez BEEP pour toutes les balances liées. */
  async function synchroniserBeep(): Promise<ResultatSyncBalance> {
    const res = await appelApi<Enveloppe<ResultatSyncBalance>>('/api/balances/sync', {
      method: 'POST',
    });
    return res.data ?? {};
  }

  /** Enregistre (ou remplace) le jeton d'accès au compte BEEP. */
  async function enregistrerConnexion(token: string, fournisseur = 'beep'): Promise<void> {
    await appelApi<unknown>('/api/balances/connexions', {
      method: 'POST',
      body: { fournisseur, token },
    });
  }

  return {
    createBalance,
    getBalance,
    updateBalance,
    deleteBalance,
    fetchMesures: fetchMesuresBalance,
    fetchCourbe: fetchCourbeBalance,
    importerFichier,
    synchroniserBeep,
    enregistrerConnexion,
  };
}

export function useBalances() {
  const {
    data: balancesData,
    pending,
    error,
    refresh,
  } = useCachedFetch<Enveloppe<Balance[]>>('/api/balances', {
    key: 'balances-list',
    lazy: true,
    dedupe: 'defer',
  });

  const balances = computed(() => balancesData.value?.data ?? ([] as Balance[]));

  return { balances, pending, error, refresh, ...useBalanceActions() };
}
