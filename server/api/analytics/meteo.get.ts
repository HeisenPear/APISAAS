import { sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  alignerMensuel,
  centroide,
  correlationMeteoProduction,
  type Coord,
  type MeteoMois,
} from '~~/server/utils/analytics';

const querySchema = z.object({
  annee: z.coerce.number().int().min(2020).max(2100).optional(),
});

interface ArchiveDaily {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    precipitation_sum: (number | null)[];
    sunshine_duration: (number | null)[];
  };
}

/**
 * GET /api/analytics/meteo — corrélation météo ↔ production.
 * Production mensuelle (réelle) vs météo historique (Open-Meteo archive) sur le
 * barycentre des ruchers géolocalisés. Gated `correlationMeteoProd`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const { annee: anneeQ } = await getValidatedQuery(event, querySchema.parse);
  const annee = anneeQ ?? new Date().getFullYear();

  const debut = `${annee}-01-01T00:00:00.000Z`;
  const fin = `${annee}-12-31T23:59:59.999Z`;

  const [prodRows, coordRows] = await Promise.all([
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_recolte)::int AS mois, SUM(quantite_kg)::float AS kg
      FROM recoltes WHERE user_id = ${ownerId} AND type_produit = 'miel'
        AND date_recolte >= ${debut} AND date_recolte <= ${fin}
      GROUP BY mois`),
    db.execute(sql`
      SELECT latitude::float AS lat, longitude::float AS lng FROM ruchers
      WHERE user_id = ${ownerId} AND latitude IS NOT NULL AND longitude IS NOT NULL`),
  ]);

  const coords = (coordRows as unknown as Array<{ lat: number; lng: number }>).map(
    (c): Coord => ({ lat: c.lat, lng: c.lng }),
  );
  const centre = centroide(coords);
  if (!centre) {
    return { data: { available: false, annee, raison: 'Aucun rucher géolocalisé.' } };
  }

  // Météo historique : archive ERA5 (gratuite, ~5 j de décalage → on borne à hier).
  const hier = new Date();
  hier.setUTCDate(hier.getUTCDate() - 1);
  const finStr = annee < hier.getUTCFullYear() ? `${annee}-12-31` : hier.toISOString().slice(0, 10);

  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${centre.lat}&longitude=${centre.lng}` +
    `&start_date=${annee}-01-01&end_date=${finStr}` +
    `&daily=temperature_2m_max,precipitation_sum,sunshine_duration&timezone=Europe%2FParis`;

  let raw: ArchiveDaily;
  try {
    raw = await $fetch<ArchiveDaily>(url);
  } catch {
    return { data: { available: false, annee, raison: 'Données météo indisponibles.' } };
  }

  // Agrégation mensuelle (moyenne tMax & ensoleillement/jour, cumul pluie).
  const acc = new Map<
    number,
    { tSum: number; tN: number; sunSum: number; sunN: number; precip: number }
  >();
  const d = raw.daily;
  for (let i = 0; i < d.time.length; i++) {
    const t = d.temperature_2m_max[i];
    if (t == null) continue;
    const mois = Number(d.time[i]!.slice(5, 7));
    const a = acc.get(mois) ?? { tSum: 0, tN: 0, sunSum: 0, sunN: 0, precip: 0 };
    a.tSum += t;
    a.tN += 1;
    const sun = d.sunshine_duration[i];
    if (sun != null) {
      a.sunSum += sun / 3600; // secondes → heures
      a.sunN += 1;
    }
    const p = d.precipitation_sum[i];
    if (p != null) a.precip += p;
    acc.set(mois, a);
  }

  const meteoMois: MeteoMois[] = [...acc.entries()].map(([mois, a]) => ({
    mois,
    tMax: a.tN ? a.tSum / a.tN : 0,
    sunHours: a.sunN ? a.sunSum / a.sunN : 0,
    precip: Math.round(a.precip),
  }));

  const prodAligne = alignerMensuel(
    (prodRows as unknown as Array<{ mois: number; kg: number }>).map((r) => ({
      mois: r.mois,
      valeur: r.kg,
    })),
  );

  const result = correlationMeteoProduction(prodAligne, meteoMois);

  return {
    data: {
      available: true,
      annee,
      centre,
      coefficient: result.coefficient,
      force: result.force,
      points: result.points,
      insight: result.insight,
    },
  };
});
