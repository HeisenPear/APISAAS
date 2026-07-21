// ═══════════════════════════════════════════════════════════════════════════
// NORMALISEUR DE MESURES DE BALANCE — point de passage OBLIGÉ de toutes les
// sources (webhook générique, uplink TTN/LoRaWAN, API BEEP, import CSV, saisie).
//
// Principe : le marché des balances apicoles n'a aucun standard. Chaque marque
// nomme ses champs à sa façon (`weight`, `poids`, `w`, `weight_kg`, `kg`…), en
// grammes ou en kilos, avec des horodatages en epoch, en ISO ou en JJ/MM/AAAA.
// Plutôt qu'un adaptateur par marque (ingérable), une TABLE DE CORRESPONDANCE
// unique + des plages de plausibilité : tout ce qui entre passe par ici, et le
// payload d'origine est TOUJOURS conservé dans `raw` (rien n'est jamais perdu).
//
// Fonctions PURES : zéro I/O, zéro dépendance Nitro — entièrement testables.
// ═══════════════════════════════════════════════════════════════════════════

/** Champs mesurables reconnus (miroir des colonnes de `mesures_balance`). */
export type ChampMesure =
  | 'poidsKg'
  | 'temperatureC'
  | 'temperatureIntC'
  | 'humidite'
  | 'humiditeIntPct'
  | 'sonDb'
  | 'frequenceHz'
  | 'tensionV'
  | 'batteriePct'
  | 'signalDbm'
  | 'pluieMm'
  | 'ventKmh'
  | 'pressionHpa';

/** Mesure prête à être insérée dans `mesures_balance`. */
export interface MesureNormalisee {
  mesureeAt: Date;
  poidsKg: number | null;
  temperatureC: number | null;
  temperatureIntC: number | null;
  humidite: number | null;
  humiditeIntPct: number | null;
  sonDb: number | null;
  frequenceHz: number | null;
  tensionV: number | null;
  batteriePct: number | null;
  signalDbm: number | null;
  pluieMm: number | null;
  ventKmh: number | null;
  pressionHpa: number | null;
  /** Identifiant côté fabricant lu dans le payload — INFORMATIF uniquement. */
  identifiantExterne: string | null;
  /** Payload d'origine intégral. */
  raw: Record<string, unknown>;
}

export interface OptionsNormalisation {
  /** Horloge injectable (tests). */
  maintenant?: Date;
  /**
   * Un horodatage SANS fuseau (« 03/06/2026 08:15 », « 2026-06-03 08:15:00 »)
   * est interprété en Europe/Paris par défaut — c'est ce que produisent les
   * exports des clouds français. Les sources qui datent en UTC (BEEP) passent
   * `naifEnUtc: true`.
   */
  naifEnUtc?: boolean;
}

// ─── Table de correspondance ────────────────────────────────────────────────

/**
 * Alias par champ, déjà NORMALISÉS (minuscules, sans accent ni séparateur).
 * L'ordre des clés de cet objet est l'ordre de RÉSOLUTION : un champ résolu
 * « consomme » la clé du payload, ce qui lève les ambiguïtés (`t_i` est pris
 * par la température interne avant que `t` ne soit examiné, `vbat` part en
 * tension avant d'être confondu avec un pourcentage de batterie).
 */
export const ALIAS_CHAMPS: Record<ChampMesure, readonly string[]> = {
  poidsKg: [
    'poids',
    'poidskg',
    'poidsg',
    'poidsbrut',
    'poidstotal',
    'weight',
    'weightkg',
    'weightg',
    'weightgrams',
    'hiveweight',
    'gewicht',
    'mass',
    'masse',
    'grammes',
    'kg',
    'w',
  ],
  // Interne AVANT externe : `t_i` / `h_i` (convention BEEP) ne doivent pas
  // tomber dans le seau « ambiante ».
  temperatureIntC: [
    'ti',
    'tc',
    'tin',
    'tinside',
    'tempin',
    'tempint',
    'tempinside',
    'tempinterne',
    'tempintc',
    'temperaturein',
    'temperatureint',
    'temperatureinterne',
    'temperatureinterieure',
  ],
  temperatureC: [
    'temperature',
    'temperaturec',
    'temp',
    'tempc',
    'tempext',
    'tempout',
    'tempoutside',
    'tempamb',
    'temperatureext',
    'temperatureout',
    'temperatureexterieure',
    'temperatureambiante',
    'tout',
    'toutside',
    't',
  ],
  humiditeIntPct: [
    'hi',
    'hin',
    'rhin',
    'humin',
    'humint',
    'humidityin',
    'humidityinside',
    'humidityinterne',
    'humiditeint',
    'humiditeinterne',
    'humiditeinterieure',
  ],
  humidite: [
    'humidite',
    'humiditepct',
    'humiditerelative',
    'humiditeext',
    'humiditeexterieure',
    'humidity',
    'humidityout',
    'humidityoutside',
    'hum',
    'hout',
    'rh',
    'h',
  ],
  sonDb: [
    'son',
    'sondb',
    'sound',
    'sounddb',
    'soundlevel',
    'stot',
    'audio',
    'noise',
    'bruit',
    'niveausonore',
    'decibels',
    'dba',
    'db',
  ],
  frequenceHz: [
    'frequence',
    'frequencehz',
    'frequencedominante',
    'frequency',
    'dominantfrequency',
    'freq',
    'freqhz',
    'fdom',
    'hz',
  ],
  // `vbat` / `bv` sont des TENSIONS, jamais des pourcentages : une Li-ion à
  // 3,9 V n'est pas « 3,9 % de batterie ». On refuse de convertir (la courbe
  // dépend de la chimie de la cellule) — la tension est stockée telle quelle.
  tensionV: [
    'tension',
    'tensionv',
    'tensionbatterie',
    'voltage',
    'batteryvoltage',
    'volt',
    'volts',
    'vbat',
    'vbatt',
    'vcc',
    'bv',
    'v',
  ],
  batteriePct: [
    'batterie',
    'batteriepct',
    'niveaubatterie',
    'battery',
    'batterypct',
    'batterypercent',
    'batterylevel',
    'batlevel',
    'batpct',
    'batt',
    'bat',
    'soc',
  ],
  signalDbm: ['signal', 'signaldbm', 'signalstrength', 'niveausignal', 'rssi', 'rsrp', 'snr'],
  pluieMm: ['pluie', 'pluiemm', 'rain', 'rainmm', 'rainfall', 'precipitation', 'precipitations'],
  ventKmh: ['vent', 'ventkmh', 'vitessevent', 'wind', 'windkmh', 'windspeed'],
  pressionHpa: [
    'pression',
    'pressionhpa',
    'pressure',
    'pressurehpa',
    'airpressure',
    'barometricpressure',
    'baro',
    'hpa',
    'p',
  ],
};

/** Ordre de résolution (cf. commentaire d'`ALIAS_CHAMPS`). */
const ORDRE_CHAMPS = Object.keys(ALIAS_CHAMPS) as ChampMesure[];

/** Alias d'horodatage. */
export const ALIAS_HORODATAGE: readonly string[] = [
  'mesureeat',
  'horodatage',
  'datemesure',
  'datetime',
  'dateheure',
  'timestamp',
  'ts',
  'measuredat',
  'measurementtime',
  'recordedat',
  'sampletime',
  'logtime',
  'receivedat',
  'received',
  'createdat',
  'time',
  'date',
];

/** Alias d'identifiant appareil (informatif — jamais utilisé pour router une mesure). */
const ALIAS_IDENTIFIANT: readonly string[] = [
  'deveui',
  'deviceeui',
  'deviceid',
  'devid',
  'devicename',
  'sensorkey',
  'serialnumber',
  'numeroserie',
  'hardwareid',
  'serial',
  'imei',
  'key',
];

/**
 * Plages de plausibilité. Hors plage → champ ignoré (null), le brut restant
 * disponible dans `raw`. Double rôle :
 *  - filtrer les valeurs sentinelles des capteurs (-127 °C, 65535…) ;
 *  - protéger les colonnes `decimal` d'un dépassement de précision (une
 *    fréquence porteuse LoRa de 868 300 000 Hz ferait planter `decimal(8,2)`).
 */
export const PLAGES_PLAUSIBLES: Record<ChampMesure, readonly [number, number]> = {
  poidsKg: [-200, 5000],
  temperatureC: [-90, 90],
  temperatureIntC: [-90, 90],
  humidite: [0, 100],
  humiditeIntPct: [0, 100],
  sonDb: [0, 200],
  frequenceHz: [0, 20_000],
  tensionV: [0, 999],
  batteriePct: [0, 100],
  signalDbm: [-200, 200],
  pluieMm: [0, 9999],
  ventKmh: [0, 500],
  pressionHpa: [300, 1200],
};

/**
 * Au-delà de ce seuil, un « poids » est lu en GRAMMES et divisé par 1000.
 * Justification : la ruche la plus lourde du marché (Dadant 12 cadres pleine,
 * 3 hausses operculées) plafonne vers 120 kg ; même une balance-palette servant
 * de témoin pour un rucher entier reste sous 1000 kg. À l'inverse, une ruche
 * exprimée en grammes démarre à ~20 000. Aucun chevauchement possible.
 */
export const SEUIL_GRAMMES = 1000;

/** Un horodatage plus de 24 h dans le futur est une erreur d'horloge → rejet. */
export const TOLERANCE_FUTUR_MS = 24 * 3600 * 1000;

/** Avant cette année, c'est un epoch mal interprété ou une date sentinelle. */
const ANNEE_MIN = 2000;

// ─── Utilitaires purs ───────────────────────────────────────────────────────

/** `« Température ext. (°C) »` → `temperatureext`. */
export function normaliserCle(brut: string): string {
  return brut
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques décomposés
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Clés dont le nom annonce explicitement des grammes (cf. SEUIL_GRAMMES). */
const CLES_EN_GRAMMES: readonly string[] = ['poidsg', 'weightg', 'weightgrams', 'grammes'];

/**
 * Suffixes d'unité, du plus long au plus court. Un en-tête de CSV s'écrit
 * « Température ext. (°C) » → `temperatureextc` : la lettre d'unité colle au
 * nom du champ. On réessaie donc la correspondance sans elle.
 */
const SUFFIXES_UNITE: readonly string[] = [
  'celsius',
  'percent',
  'mbar',
  'khz',
  'dbm',
  'hpa',
  'kmh',
  'pct',
  'kg',
  'mv',
  'mm',
  'db',
  'hz',
  'ms',
  'c',
  'g',
  'v',
  'f',
];

function correspondanceExacte(cle: string): ChampMesure | null {
  for (const champ of ORDRE_CHAMPS) {
    if (ALIAS_CHAMPS[champ].includes(cle)) return champ;
  }
  return null;
}

/** Champ correspondant à une clé de payload (déjà normalisée), ou null. */
export function champPourCle(cle: string): ChampMesure | null {
  const direct = correspondanceExacte(cle);
  if (direct) return direct;
  for (const u of SUFFIXES_UNITE) {
    if (cle.length <= u.length || !cle.endsWith(u)) continue;
    const base = correspondanceExacte(cle.slice(0, -u.length));
    if (!base) continue;
    // « Batterie (V) » est une TENSION, pas un pourcentage.
    if ((u === 'v' || u === 'mv') && base === 'batteriePct') return 'tensionV';
    return base;
  }
  return null;
}

/** Cette clé désigne-t-elle un horodatage ? */
export function estCleHorodatage(cle: string): boolean {
  return ALIAS_HORODATAGE.includes(cle);
}

/** Nombre depuis un number ou une chaîne (décimale FR ou US, unité collée tolérée). */
export function parseNombre(valeur: unknown): number | null {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null;
  if (typeof valeur === 'boolean' || valeur === null || valeur === undefined) return null;
  if (typeof valeur !== 'string') return null;
  const t = valeur.trim().replace(/\s/g, '');
  if (!t) return null;
  // « 12,5 kg », « -3.2°C », « 55% » → on isole le nombre en tête.
  const m = /^[+-]?\d+(?:[.,]\d+)?/.exec(t);
  if (!m) return null;
  const n = Number(m[0].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// ─── Fuseau Europe/Paris (horodatages naïfs) ────────────────────────────────

const FMT_DECALAGE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  timeZoneName: 'longOffset',
});

/** Décalage Europe/Paris ↔ UTC, en minutes, à un instant donné (gère l'heure d'été). */
function decalageParisMinutes(instant: Date): number {
  const nom =
    FMT_DECALAGE.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ??
    'GMT+00:00';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(nom);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/** Composantes locales (Paris ou UTC) → instant absolu. */
function depuisNaif(
  a: number,
  mo: number,
  j: number,
  h: number,
  mi: number,
  s: number,
  enUtc: boolean,
): Date {
  const approx = Date.UTC(a, mo - 1, j, h, mi, s);
  if (enUtc) return new Date(approx);
  // Deux passes : la 1re donne le décalage approximatif, la 2e le corrige aux
  // heures de bascule d'heure d'été.
  const t1 = approx - decalageParisMinutes(new Date(approx)) * 60_000;
  return new Date(approx - decalageParisMinutes(new Date(t1)) * 60_000);
}

/**
 * Parse un horodatage : epoch (s ou ms), ISO (avec ou sans fuseau),
 * `JJ/MM/AAAA[ HH:MM[:SS]]`, `AAAA-MM-JJ[ HH:MM[:SS]]`.
 * Retourne null si illisible, antérieur à l'an 2000, ou à plus de 24 h dans le futur.
 */
export function parseHorodatage(valeur: unknown, maintenant: Date, naifEnUtc = false): Date | null {
  let d: Date | null = null;

  if (valeur instanceof Date) {
    d = Number.isNaN(valeur.getTime()) ? null : new Date(valeur.getTime());
  } else if (
    typeof valeur === 'number' ||
    (typeof valeur === 'string' && /^\d{9,14}$/.test(valeur.trim()))
  ) {
    const n = typeof valeur === 'number' ? valeur : Number(valeur);
    if (!Number.isFinite(n)) return null;
    // < 1e11 → secondes (1e11 s = an 5138, 1e11 ms = 1973 : pas d'ambiguïté).
    d = new Date(n < 1e11 ? n * 1000 : n);
  } else if (typeof valeur === 'string') {
    const t = valeur.trim();
    if (!t) return null;
    // JJ/MM/AAAA (format FR des exports Optibee, Label Abeille…)
    let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      t,
    );
    if (m) {
      const annee = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      const mois = Number(m[2]);
      const jour = Number(m[1]);
      if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
      d = depuisNaif(
        annee,
        mois,
        jour,
        Number(m[4] ?? 0),
        Number(m[5] ?? 0),
        Number(m[6] ?? 0),
        naifEnUtc,
      );
    } else if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(t))) {
      // AAAAMMJJ compact
      d = depuisNaif(Number(m[1]), Number(m[2]), Number(m[3]), 0, 0, 0, naifEnUtc);
    } else if (
      (m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(t))
    ) {
      // ISO SANS fuseau → « naïf » : interprété en Europe/Paris (ou UTC si demandé).
      // Avec fuseau explicite (Z, +02:00), on laisse Date faire — cf. `else`.
      d = depuisNaif(
        Number(m[1]),
        Number(m[2]),
        Number(m[3]),
        Number(m[4] ?? 0),
        Number(m[5] ?? 0),
        Number(m[6] ?? 0),
        naifEnUtc,
      );
    } else {
      const parsed = new Date(t);
      d = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  if (!d || Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() < ANNEE_MIN) return null;
  if (d.getTime() > maintenant.getTime() + TOLERANCE_FUTUR_MS) return null;
  return d;
}

// ─── Aplatissement ──────────────────────────────────────────────────────────

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Aplatit un payload en `clé normalisée → valeur scalaire`, en largeur d'abord :
 * une clé de surface l'emporte toujours sur une clé profonde de même nom.
 * Les tableaux ne sont suivis que sur leur PREMIER élément objet (convention
 * des métadonnées radio type `rx_metadata[0]`).
 */
export function aplatir(source: Record<string, unknown>, profondeurMax = 4): Map<string, unknown> {
  const out = new Map<string, unknown>();
  let niveau: Array<[string, unknown]> = Object.entries(source);
  let profondeur = 0;

  while (niveau.length > 0 && profondeur < profondeurMax) {
    const suivant: Array<[string, unknown]> = [];
    for (const [cle, val] of niveau) {
      if (Array.isArray(val)) {
        const premier: unknown = (val as unknown[])[0];
        if (estObjet(premier)) suivant.push(...Object.entries(premier));
        continue;
      }
      if (estObjet(val)) {
        suivant.push(...Object.entries(val));
        continue;
      }
      const k = normaliserCle(cle);
      if (k && !out.has(k)) out.set(k, val);
    }
    niveau = suivant;
    profondeur += 1;
  }
  return out;
}

// ─── Format TTN / LoRaWAN ───────────────────────────────────────────────────

/**
 * Uplink The Things Network. Traité à part et NON aplati génériquement : le
 * bloc `uplink_message.settings` contient `frequency: "868300000"` (la porteuse
 * radio), qui serait sinon confondu avec la fréquence sonore de la colonie.
 * On ne retient donc que `decoded_payload` + les métadonnées utiles.
 */
function extraireTtn(brut: Record<string, unknown>): Record<string, unknown> | null {
  const uplink = brut.uplink_message;
  if (!estObjet(uplink)) return null;
  const decoded = uplink.decoded_payload;
  if (!estObjet(decoded)) return null;

  const source: Record<string, unknown> = { ...decoded };

  const ids = brut.end_device_ids;
  if (estObjet(ids) && typeof ids.device_id === 'string') source.device_id = ids.device_id;

  const rx: unknown = uplink.rx_metadata;
  const meta: unknown = Array.isArray(rx) ? (rx as unknown[])[0] : undefined;
  if (estObjet(meta)) {
    if (source.rssi === undefined && meta.rssi !== undefined) source.rssi = meta.rssi;
    if (source.snr === undefined && meta.snr !== undefined) source.snr = meta.snr;
  }

  const recu = brut.received_at ?? uplink.received_at;
  if (recu !== undefined && source.received_at === undefined) source.received_at = recu;

  return source;
}

// ─── Normalisation ──────────────────────────────────────────────────────────

function borner(champ: ChampMesure, valeur: number | null): number | null {
  if (valeur === null) return null;
  const [min, max] = PLAGES_PLAUSIBLES[champ];
  if (valeur < min || valeur > max) return null;
  // 2 décimales = la précision des colonnes `decimal(_, 2)`.
  return Math.round(valeur * 100) / 100;
}

/**
 * Transforme un payload brut (n'importe quelle source) en mesure exploitable.
 *
 * Retourne `null` — la mesure est REJETÉE — quand :
 *  - le payload n'est pas un objet ;
 *  - un horodatage est présent mais illisible, aberrant ou à plus de 24 h dans
 *    le futur (horloge capteur folle : on préfère perdre le point que polluer
 *    la courbe et déclencher de fausses alertes) ;
 *  - aucun champ mesurable n'a pu être lu.
 * Un horodatage ABSENT n'est pas une erreur : on date la mesure à maintenant.
 */
export function normaliserPayload(
  brut: unknown,
  opts: OptionsNormalisation = {},
): MesureNormalisee | null {
  if (!estObjet(brut)) return null;
  const maintenant = opts.maintenant ?? new Date();

  const source = extraireTtn(brut) ?? brut;
  const plat = aplatir(source);

  // Horodatage : première clé reconnue dans l'ordre de préférence.
  let cleDate: string | null = null;
  for (const alias of ALIAS_HORODATAGE) {
    if (plat.has(alias)) {
      cleDate = alias;
      break;
    }
  }
  let mesureeAt = maintenant;
  if (cleDate !== null) {
    const parsee = parseHorodatage(plat.get(cleDate), maintenant, opts.naifEnUtc === true);
    if (!parsee) return null;
    mesureeAt = parsee;
  }

  // Champs mesurables. On parcourt les CLÉS du payload (et non les champs) :
  // `champPourCle` donne une réponse unique par clé, donc aucune clé ne peut
  // alimenter deux champs. Premier arrivé, premier servi — l'aplatissement
  // ayant déjà mis les clés de surface en tête.
  const valeurs: Partial<Record<ChampMesure, number>> = {};
  for (const [cle, val] of plat) {
    if (estCleHorodatage(cle)) continue;
    const champ = champPourCle(cle);
    if (!champ || valeurs[champ] !== undefined) continue;
    let n = parseNombre(val);
    if (n === null) continue;
    // Poids : conversion grammes → kilos (cf. SEUIL_GRAMMES).
    if (champ === 'poidsKg' && (Math.abs(n) > SEUIL_GRAMMES || CLES_EN_GRAMMES.includes(cle))) {
      n /= 1000;
    }
    const borne = borner(champ, n);
    if (borne !== null) valeurs[champ] = borne;
  }

  if (ORDRE_CHAMPS.every((c) => valeurs[c] === undefined)) return null;
  const lire = (c: ChampMesure): number | null => valeurs[c] ?? null;

  let identifiantExterne: string | null = null;
  for (const alias of ALIAS_IDENTIFIANT) {
    const v = plat.get(alias);
    if (typeof v === 'string' && v.trim()) {
      identifiantExterne = v.trim().slice(0, 120);
      break;
    }
    if (typeof v === 'number') {
      identifiantExterne = String(v);
      break;
    }
  }

  const batterie = lire('batteriePct');
  return {
    mesureeAt,
    poidsKg: lire('poidsKg'),
    temperatureC: lire('temperatureC'),
    temperatureIntC: lire('temperatureIntC'),
    humidite: lire('humidite'),
    humiditeIntPct: lire('humiditeIntPct'),
    sonDb: lire('sonDb'),
    frequenceHz: lire('frequenceHz'),
    tensionV: lire('tensionV'),
    batteriePct: batterie === null ? null : Math.round(batterie),
    signalDbm: lire('signalDbm'),
    pluieMm: lire('pluieMm'),
    ventKmh: lire('ventKmh'),
    pressionHpa: lire('pressionHpa'),
    identifiantExterne,
    raw: brut,
  };
}

/**
 * Normalise un lot (tableau, ou objet unique). Les entrées rejetées sont
 * comptées, jamais silencieusement transformées en points bidons.
 */
export function normaliserLot(
  brut: unknown,
  opts: OptionsNormalisation = {},
): { mesures: MesureNormalisee[]; rejetees: number } {
  const entrees = Array.isArray(brut) ? brut : [brut];
  const mesures: MesureNormalisee[] = [];
  let rejetees = 0;
  for (const e of entrees) {
    const m = normaliserPayload(e, opts);
    if (m) mesures.push(m);
    else rejetees += 1;
  }
  return { mesures, rejetees };
}
