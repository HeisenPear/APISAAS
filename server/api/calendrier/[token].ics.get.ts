import { eq, and, gte } from 'drizzle-orm';
import {
  tokensCalendrier,
  interventions,
  recoltes,
  traitementsVarroa,
} from '~~/server/database/schema';

/**
 * GET /api/calendrier/:token.ics
 * Export ICS public pour les abonnements calendrier (Beekube parity)
 * Aucune auth requise — accès par token unique
 */
export default defineEventHandler(async (event) => {
  const tokenParam = getRouterParam(event, 'token');
  if (!tokenParam) {
    setResponseStatus(event, 400);
    return 'Token manquant';
  }

  // Valider le token
  const [tokenRow] = await db
    .select()
    .from(tokensCalendrier)
    .where(and(eq(tokensCalendrier.token, tokenParam), eq(tokensCalendrier.actif, true)))
    .limit(1);

  if (!tokenRow) {
    setResponseStatus(event, 404);
    return 'Token invalide ou expiré';
  }

  const userId = tokenRow.userId;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Fetch events based on scope
  const scope = tokenRow.scope;
  const icsEvents: string[] = [];

  if (scope === 'all' || scope === 'interventions') {
    const rows = await db
      .select({
        id: interventions.id,
        dateVisite: interventions.dateVisite,
        type: interventions.type,
        notes: interventions.notes,
        rucheId: interventions.rucheId,
      })
      .from(interventions)
      .where(and(eq(interventions.userId, userId), gte(interventions.dateVisite, sixMonthsAgo)))
      .limit(200);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `intervention-${row.id}@apiculture360`,
          dtstart: row.dateVisite as Date,
          summary: `Intervention${row.type ? ` — ${row.type}` : ''}`,
          description: row.notes ?? '',
          categories: ['Intervention'],
        }),
      );
    }
  }

  if (scope === 'all' || scope === 'recoltes') {
    const rows = await db
      .select({
        id: recoltes.id,
        dateRecolte: recoltes.dateRecolte,
        typeProduit: recoltes.typeProduit,
        quantiteKg: recoltes.quantiteKg,
        notes: recoltes.notes,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, sixMonthsAgo)))
      .limit(200);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `recolte-${row.id}@apiculture360`,
          dtstart: row.dateRecolte as Date,
          summary: `Récolte${row.typeProduit ? ` — ${row.typeProduit}` : ''}${row.quantiteKg ? ` (${row.quantiteKg} kg)` : ''}`,
          description: row.notes ?? '',
          categories: ['Récolte'],
        }),
      );
    }
  }

  if (scope === 'all' || scope === 'traitements') {
    const rows = await db
      .select({
        id: traitementsVarroa.id,
        dateDebut: traitementsVarroa.dateDebut,
        dateFinPrevue: traitementsVarroa.dateFinPrevue,
        typeTraitement: traitementsVarroa.typeTraitement,
        notes: traitementsVarroa.notes,
      })
      .from(traitementsVarroa)
      .where(
        and(eq(traitementsVarroa.userId, userId), gte(traitementsVarroa.dateDebut, sixMonthsAgo)),
      )
      .limit(100);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `traitement-${row.id}@apiculture360`,
          dtstart: row.dateDebut as Date,
          dtend: row.dateFinPrevue ? (row.dateFinPrevue as Date) : undefined,
          summary: `Traitement — ${row.typeTraitement}`,
          description: row.notes ?? '',
          categories: ['Traitement'],
        }),
      );
    }
  }

  // Update derniere_utilisation
  await db
    .update(tokensCalendrier)
    .set({ derniereUtilisation: new Date() })
    .where(eq(tokensCalendrier.id, tokenRow.id));

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apiculture 360//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Apiculture 360',
    'X-WR-CALDESC:Interventions et récoltes',
    'X-WR-TIMEZONE:Europe/Paris',
    ...icsEvents,
    'END:VCALENDAR',
  ].join('\r\n');

  setResponseHeader(event, 'Content-Type', 'text/calendar; charset=utf-8');
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="apiculture360.ics"');
  setResponseHeader(event, 'Cache-Control', 'no-cache');

  return icsContent;
});

interface VEventParams {
  uid: string;
  dtstart: Date;
  dtend?: Date;
  summary: string;
  description?: string;
  categories?: string[];
}

function icsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function buildVEvent(p: VEventParams): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${p.uid}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(p.dtstart)}`,
  ];
  if (p.dtend) lines.push(`DTEND:${icsDate(p.dtend)}`);
  lines.push(`SUMMARY:${escapeIcs(p.summary)}`);
  if (p.description) lines.push(`DESCRIPTION:${escapeIcs(p.description)}`);
  if (p.categories?.length) lines.push(`CATEGORIES:${p.categories.join(',')}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
