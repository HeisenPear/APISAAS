/**
 * Moteur de créneaux pour la réservation de démos.
 *
 * Règles de disponibilité (heure de Paris) :
 *   - En semaine (lun–ven) : uniquement en soirée
 *   - Le week-end (sam–dim) : toute la journée
 *
 * Les créneaux sont « prédéfinis » par ces règles (pas de config admin). Un
 * créneau déjà réservé est exclu côté serveur → les autres le voient occupé.
 *
 * Partagé client + serveur (fonctions pures prenant `now` en paramètre).
 * Tout est calculé en Europe/Paris, DST-safe via Intl (pas de lib externe).
 */

export const DEMO_TZ = 'Europe/Paris';
export const SLOT_MINUTES = 45; // durée d'une démo
export const HORIZON_DAYS = 21; // fenêtre de réservation
export const LEAD_HOURS = 3; // délai minimum avant un créneau

/** Heures de début proposées (Europe/Paris). Modifiable ici au besoin. */
export const WEEKDAY_HOURS = [18, 19, 20]; // semaine : soirée
export const WEEKEND_HOURS = [9, 10, 11, 14, 15, 16, 17]; // week-end : journée

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Minutes dont Paris est en avance sur UTC à l'instant `date` (gère l'heure d'été). */
function parisOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: DEMO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string): number => Number(parts.find((x) => x.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return (asUtc - date.getTime()) / 60000;
}

/** Convertit une heure « mur » de Paris (y-m-d h:00) en instant UTC. */
function parisWallToUtc(y: number, m: number, d: number, hour: number): Date {
  const guess = Date.UTC(y, m - 1, d, hour, 0, 0);
  const offset = parisOffsetMinutes(new Date(guess));
  return new Date(guess - offset * 60000);
}

/** Date calendaire de Paris (année/mois/jour) pour un instant donné. */
function parisDateParts(date: Date): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEMO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.format(date).split('-');
  return { y: Number(parts[0]), m: Number(parts[1]), d: Number(parts[2]) };
}

export interface DemoSlot {
  iso: string; // instant UTC du créneau (ISO)
  dateKey: string; // 'YYYY-MM-DD' (date de Paris)
  time: string; // 'HH:00'
  hour: number;
}

/** Tous les créneaux futurs dans l'horizon, selon les règles (hors occupation). */
export function generateSlots(now: Date): DemoSlot[] {
  const today = parisDateParts(now);
  const minTime = now.getTime() + LEAD_HOURS * 3600_000;
  const slots: DemoSlot[] = [];

  for (let n = 0; n <= HORIZON_DAYS; n++) {
    // Date calendaire à n jours (math sur date pure en UTC → jour de semaine fiable)
    const base = new Date(Date.UTC(today.y, today.m - 1, today.d));
    base.setUTCDate(base.getUTCDate() + n);
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const dow = base.getUTCDay(); // 0=dim … 6=sam
    const isWeekend = dow === 0 || dow === 6;
    const hours = isWeekend ? WEEKEND_HOURS : WEEKDAY_HOURS;

    for (const h of hours) {
      const slotUtc = parisWallToUtc(y, m, d, h);
      if (slotUtc.getTime() <= minTime) continue;
      slots.push({
        iso: slotUtc.toISOString(),
        dateKey: `${y}-${pad(m)}-${pad(d)}`,
        time: `${pad(h)}:00`,
        hour: h,
      });
    }
  }
  return slots;
}

/** Vrai si `iso` correspond à un créneau valide et encore réservable. */
export function isAllowedSlot(iso: string, now: Date): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return generateSlots(now).some((s) => Date.parse(s.iso) === t);
}

/** Libellé long FR : « lundi 22 juin à 19:00 » (heure de Paris). */
export function formatSlotLong(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat('fr-FR', {
    timeZone: DEMO_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('fr-FR', {
    timeZone: DEMO_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${datePart} à ${timePart}`;
}

/** Libellé d'en-tête de jour : « Lundi 22 juin » (heure de Paris). */
export function formatDayLabel(dateKey: string): string {
  const parts = dateKey.split('-');
  // midi UTC pour éviter tout décalage de date à la conversion
  const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12));
  const label = new Intl.DateTimeFormat('fr-FR', {
    timeZone: DEMO_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
