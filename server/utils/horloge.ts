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
