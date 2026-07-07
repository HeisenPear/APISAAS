import { and, gte, lte, ne, isNotNull } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';
import { generateSlots, formatDayLabel, HORIZON_DAYS } from '~~/app/utils/demoSlots';

/**
 * Créneaux de démo disponibles (parcours public « Réserver une démo »).
 *
 * Génère les créneaux selon les règles (soir en semaine / journée le week-end),
 * puis marque comme occupés ceux déjà réservés (réservation active). Les autres
 * visiteurs voient donc en temps réel les créneaux pris.
 */
export default defineEventHandler(async () => {
  const now = new Date();
  const slots = generateSlots(now);

  // Réservations actives dans la fenêtre → créneaux occupés.
  const horizonEnd = new Date(now.getTime() + (HORIZON_DAYS + 1) * 24 * 3600_000);
  const booked = await db
    .select({ rdvAt: demandesDemo.rdvAt })
    .from(demandesDemo)
    .where(
      and(
        isNotNull(demandesDemo.rdvAt),
        ne(demandesDemo.statut, 'annule'),
        gte(demandesDemo.rdvAt, now),
        lte(demandesDemo.rdvAt, horizonEnd),
      ),
    );
  const taken = new Set(booked.map((b) => b.rdvAt!.getTime()));

  // Regroupe par jour, en conservant l'ordre de génération.
  const byDay = new Map<string, { iso: string; time: string; available: boolean }[]>();
  for (const s of slots) {
    const arr = byDay.get(s.dateKey) ?? [];
    arr.push({ iso: s.iso, time: s.time, available: !taken.has(Date.parse(s.iso)) });
    byDay.set(s.dateKey, arr);
  }

  const days = [...byDay.entries()].map(([dateKey, daySlots]) => ({
    dateKey,
    label: formatDayLabel(dateKey),
    slots: daySlots,
  }));

  return { data: { days } };
});
