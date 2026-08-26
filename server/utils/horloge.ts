// ═══════════════════════════════════════════════════════════════════════════
// HORLOGE — source de vérité unique du temps et du fuseau Europe/Paris.
//
// Pourquoi ce module : le moteur de règles raisonne en heure de PARIS (un
// apiculteur français ouvre ses ruches à 14 h de chez lui, pas à 12 h UTC), mais
// les lambdas Vercel tournent en UTC. Tout `getMonth()` / `getDate()` /
// `getHours()` posé directement sur un `Date` lit donc l'heure du SERVEUR — un
// décalage d'une à deux heures qui se voit aux bornes : une fenêtre saisonnière
// qui s'ouvre le 1er mars s'ouvrait en réalité le 28 février à 23 h.
//
// Six helpers Paris coexistaient dans le dépôt, avec trois replis différents sur
// date invalide (12, 0, true). Ils sont tous ici, et le repli n'est plus caché :
// les accesseurs LÈVENT sur une date invalide (comportement natif d'`Intl`), et
// les chemins best-effort choisissent explicitement leur valeur de repli via
// `partiesParisOuNull`.
//
// CONVENTION : dans tout le moteur, l'instant de référence d'un run s'appelle
// `maintenant`, il est créé UNE fois au point d'entrée et passé en paramètre.
// C'est ce qui rend les règles déterministes et testables sans horloge factice.
// ═══════════════════════════════════════════════════════════════════════════

/** Composantes calendaires d'un instant, lues dans le fuseau Europe/Paris. */
export interface PartiesParis {
  /** Année civile à Paris (2026). */
  annee: number;
  /** Mois 1-12. */
  mois: number;
  /** Jour du mois 1-31. */
  jour: number;
  /** Heure 0-23. */
  heure: number;
  /** Minute 0-59. */
  minute: number;
}

// Un SEUL formateur pour toutes les composantes : un `formatToParts` suffit à
// tout obtenir. Hissé en constante de module — deux des anciens helpers
// recréaient leur `Intl.DateTimeFormat` à chaque appel, dans des boucles.
const FMT_PARIS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const FMT_DECALAGE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  timeZoneName: 'longOffset',
});

function deuxChiffres(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Composantes calendaires d'un instant à Paris.
 * Lève `RangeError` sur une date invalide (repli natif d'`Intl` — un appelant
 * qui ne peut pas se le permettre utilise `partiesParisOuNull`).
 */
export function partiesParis(instant: Date): PartiesParis {
  const parts = FMT_PARIS.formatToParts(instant);
  const lire = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    annee: lire('year'),
    mois: lire('month'),
    jour: lire('day'),
    heure: lire('hour'),
    minute: lire('minute'),
  };
}

/** Idem, mais `null` au lieu de lever — pour les chemins best-effort. */
export function partiesParisOuNull(instant: Date): PartiesParis | null {
  try {
    const p = partiesParis(instant);
    return Number.isFinite(p.annee) && Number.isFinite(p.heure) ? p : null;
  } catch {
    return null;
  }
}

/** Année civile d'un instant à Paris. */
export function anneeParis(instant: Date): number {
  return partiesParis(instant).annee;
}

/** Mois 1-12 d'un instant à Paris. */
export function moisParis(instant: Date): number {
  return partiesParis(instant).mois;
}

/** Jour du mois 1-31 d'un instant à Paris. */
export function jourDuMoisParis(instant: Date): number {
  return partiesParis(instant).jour;
}

/** Heure 0-23 d'un instant à Paris. */
export function heureParis(instant: Date): number {
  return partiesParis(instant).heure;
}

/** Jour civil « AAAA-MM-JJ » d'un instant à Paris. */
export function dateParis(instant: Date): string {
  const { annee, mois, jour } = partiesParis(instant);
  return `${annee}-${deuxChiffres(mois)}-${deuxChiffres(jour)}`;
}

/** Heure « HH:MM » d'un instant à Paris. */
export function heureMinuteParis(instant: Date): string {
  const { heure, minute } = partiesParis(instant);
  return `${deuxChiffres(heure)}:${deuxChiffres(minute)}`;
}

/**
 * Deux instants tombent-ils le même jour civil à PARIS ?
 * `a.toDateString() === b.toDateString()` répondait sur le jour du serveur :
 * un rendez-vous du lendemain 00 h 30 à Paris (23 h 30 UTC ce soir) était
 * annoncé « aujourd'hui ».
 */
export function memeJourParis(a: Date, b: Date): boolean {
  return dateParis(a) === dateParis(b);
}

/**
 * Décalage Europe/Paris ↔ UTC en minutes à un instant donné (+60 en hiver,
 * +120 en été). Sert à interpréter les horodatages naïfs des capteurs.
 */
export function decalageParisMinutes(instant: Date): number {
  const nom =
    FMT_DECALAGE.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ??
    'GMT+00:00';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(nom);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * Le premier instant du mois de `instant`, à Paris — rendu en UTC.
 *
 * ⚠️ POURQUOI CE N'EST PAS `d.setDate(1); d.setHours(0,0,0,0)`. Cette formule
 * répond dans le fuseau du SERVEUR, et le serveur est en UTC sur Vercel. Les
 * deux dernières heures de chaque mois, à Paris, tombent alors dans le mois
 * précédent : une facture émise le 1er juillet à 01 h 30 à Paris est horodatée
 * 30 juin 23 h 30 UTC, ne franchit pas la borne « 1er juillet 00 h 00 UTC », et
 * s'impute au quota de JUIN — déjà consommé. L'apiculteur voit « plafond
 * atteint » le jour même où son compteur devait repartir à zéro.
 *
 * Le décalage est lu À LA BORNE, pas à l'instant d'origine : le 1er janvier
 * n'a pas le même décalage qu'un 17 juillet. Le 1er d'un mois n'est jamais un
 * jour de changement d'heure (toujours le dernier dimanche de mars ou
 * d'octobre), la lecture est donc sans ambiguïté.
 */
export function debutDuMoisParis(instant: Date): Date {
  const { annee, mois } = partiesParis(instant);
  return minuitParis(annee, mois, 1);
}

/**
 * L'instant UTC correspondant à minuit, à PARIS, le jour donné.
 * `mois` est 1-12 ; `jour` n'est pas borné ici (voir `joursDansLeMois`).
 */
export function minuitParis(annee: number, mois: number, jour: number): Date {
  const naif = Date.UTC(annee, mois - 1, jour, 0, 0, 0, 0);
  return new Date(naif - decalageParisMinutes(new Date(naif)) * 60_000);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEUX FAÇONS DE REPRÉSENTER UN JOUR, ET ELLES NE SONT PAS INTERCHANGEABLES.
//
// ⚠️ CETTE DISTINCTION A DÉJÀ COÛTÉ UNE RÉGRESSION, INTRODUITE PAR UN
// CORRECTIF. Le correctif des achats récurrents faisait tomber l'échéance à
// MINUIT À PARIS — 23 h 00 UTC la veille en hiver. Or ce dépôt stocke ses
// valeurs date-seule à MINUIT UTC (une date envoyée « 2026-03-01 » et coercée
// par Zod donne 2026-03-01T00:00:00Z), et plusieurs lecteurs relisent le mois
// avec `getMonth()`. Une échéance du 1er du mois — le cas le plus courant pour
// un prélèvement — se relisait donc dans le MOIS PRÉCÉDENT : la projection de
// trésorerie l'avançait d'un mois, et l'achat créé le 1er janvier tombait dans
// l'exercice ÉCOULÉ.
//
// La règle, désormais explicite :
//
//   · UNE BORNE de requête (« depuis le 1er du mois », « les 12 derniers
//     mois ») se pose à MINUIT À PARIS — `minuitParis`. C'est un instant, et
//     l'apiculteur change de mois à minuit chez lui, pas à minuit UTC.
//
//   · UNE VALEUR DATE-SEULE stockée (une échéance, une date d'intervention,
//     une date de transaction) se pose à MINUIT UTC — `jourUtc`. Minuit UTC du
//     jour J se relit « jour J » en UTC comme à Paris (01 h ou 02 h le même
//     jour) ; minuit à Paris, lui, se relit « jour J-1 » en UTC. Une seule des
//     deux représentations est juste des deux côtés.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Le jour civil `annee-mois-jour` en tant que valeur date-seule : minuit UTC.
 * `mois` est 1-12. À utiliser pour STOCKER un jour, jamais pour borner une
 * requête — voir le bloc ci-dessus.
 */
export function jourUtc(annee: number, mois: number, jour: number): Date {
  return new Date(Date.UTC(annee, mois - 1, jour, 0, 0, 0, 0));
}

/** Nombre de jours du mois (1-12) d'une année donnée — 28, 29, 30 ou 31. */
export function joursDansLeMois(annee: number, mois: number): number {
  // Le jour 0 du mois SUIVANT est le dernier jour de celui-ci.
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate();
}

// ═══════════════════════════════════════════════════════════════════════════
// DÉCALER D'UN NOMBRE DE MOIS — et pourquoi `setMonth` ne sait pas le faire.
//
// ⚠️ `d.setMonth(d.getMonth() + n)` NE BORNE PAS LE JOUR. Le 31 mars moins
// onze mois donne « le 31 avril », que JavaScript reporte au 1er MAI. La
// fenêtre demandée saute alors un mois entier, en silence.
//
// Ce défaut a déjà été payé deux fois dans ce dépôt :
//
//   · les achats récurrents du 29, 30 ou 31 sautaient un mois sur douze
//     (corrigé dans `recurrence.ts`, qui s'appuie maintenant sur ces
//     primitives) ;
//   · la série « 12 derniers mois » de Maya démarrait un mois trop tard ET
//     affichait un mois À VENIR à sa droite — sept jours par an (les 29, 30
//     et 31 janvier, les 31 mars, mai, août et octobre), c'est-à-dire assez
//     rarement pour n'être jamais reproduit, assez souvent pour être vu.
//
// Les deux fonctions ci-dessous couvrent les deux besoins réels, et TOUTES
// DEUX répondent à Paris — un décalage de mois calculé sur l'heure du serveur
// se trompe de bord deux heures par mois.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Le premier instant du mois situé `delta` mois après `instant` (négatif pour
 * remonter), à Paris. C'est la borne à utiliser pour une fenêtre glissante :
 * elle ne dépend pas du jour du mois, donc elle ne peut pas déborder.
 */
export function debutDuMoisDecaleParis(instant: Date, delta: number): Date {
  const { annee, mois } = partiesParis(instant);
  // On passe par l'index 0-11 pour laisser la normalisation gérer le
  // franchissement d'année, y compris pour un delta de plusieurs années.
  const rang = annee * 12 + (mois - 1) + delta;
  return minuitParis(Math.floor(rang / 12), (rang % 12) + 1, 1);
}

/**
 * Le MÊME jour du mois, `delta` mois plus loin, à Paris — borné au dernier
 * jour quand le mois d'arrivée est plus court (31 août − 6 mois → 28 février,
 * et non le 3 mars comme le produisait `setMonth`).
 */
export function moisDecaleParis(instant: Date, delta: number): Date {
  const { annee, mois, jour } = partiesParis(instant);
  const rang = annee * 12 + (mois - 1) + delta;
  const anneeCible = Math.floor(rang / 12);
  const moisCible = (rang % 12) + 1;
  return minuitParis(anneeCible, moisCible, Math.min(jour, joursDansLeMois(anneeCible, moisCible)));
}
