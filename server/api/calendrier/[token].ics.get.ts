import { eq, and, gte, ne, isNotNull } from 'drizzle-orm';
import { moisDecaleParis } from '~~/server/utils/horloge';
import {
  tokensCalendrier,
  interventions,
  recoltes,
  traitementsVarroa,
  demandesDemo,
  profils,
  membres,
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
  // Espace partagé : si le créateur du token est membre d'un espace, le calendrier
  // exporte les événements du PROPRIÉTAIRE (sinon un membre invité aurait un .ics
  // vide). Le statut admin, lui, reste personnel (cf. plus bas).
  const [membership] = await db
    .select({ ownerId: membres.ownerId })
    .from(membres)
    .where(and(eq(membres.userId, userId), eq(membres.statut, 'acceptee')))
    .limit(1);
  const ownerId = membership?.ownerId ?? userId;

  // `setMonth(getMonth() - 6)` ne borne pas le jour : le 31 août moins six mois
  // donnait « le 31 février », reporté au 3 MARS. La fenêtre du flux iCal
  // perdait alors cinq jours d'historique, et le 31 mars elle en gagnait un.
  // `moisDecaleParis` borne au dernier jour du mois d'arrivée — et répond à
  // Paris, pas dans le fuseau du serveur.
  const sixMonthsAgo = moisDecaleParis(new Date(), -6);

  // Le compte est-il admin ? (les démos prospects ne s'ajoutent qu'aux calendriers admin)
  const [profilRow] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, userId))
    .limit(1);
  const adminEmails = (process.env.NUXT_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = !!profilRow?.email && adminEmails.includes(profilRow.email.toLowerCase());

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
      .where(and(eq(interventions.userId, ownerId), gte(interventions.dateVisite, sixMonthsAgo)))
      .limit(200);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `intervention-${row.id}@apigo`,
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
      .where(and(eq(recoltes.userId, ownerId), gte(recoltes.dateRecolte, sixMonthsAgo)))
      .limit(200);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `recolte-${row.id}@apigo`,
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
        and(eq(traitementsVarroa.userId, ownerId), gte(traitementsVarroa.dateDebut, sixMonthsAgo)),
      )
      .limit(100);

    for (const row of rows) {
      icsEvents.push(
        buildVEvent({
          uid: `traitement-${row.id}@apigo`,
          dtstart: row.dateDebut as Date,
          dtend: row.dateFinPrevue ? (row.dateFinPrevue as Date) : undefined,
          summary: `Traitement — ${row.typeTraitement}`,
          description: row.notes ?? '',
          categories: ['Traitement'],
        }),
      );
    }
  }

  // Démos prospects (rdv confirmé, non annulé) — uniquement pour les comptes admin
  if (scope === 'all' && isAdmin) {
    const rows = await db
      .select({
        id: demandesDemo.id,
        prenom: demandesDemo.prenom,
        nom: demandesDemo.nom,
        email: demandesDemo.email,
        telephone: demandesDemo.telephone,
        objectif: demandesDemo.objectif,
        notes: demandesDemo.notes,
        rdvAt: demandesDemo.rdvAt,
      })
      .from(demandesDemo)
      .where(
        and(
          isNotNull(demandesDemo.rdvAt),
          ne(demandesDemo.statut, 'annule'),
          gte(demandesDemo.rdvAt, sixMonthsAgo),
        ),
      )
      .limit(200);

    for (const row of rows) {
      const debut = row.rdvAt as Date;
      const fin = new Date(debut.getTime() + 30 * 60 * 1000);
      const description = [
        `Prospect : ${row.prenom} ${row.nom}`,
        `Tél : ${row.telephone}`,
        `Email : ${row.email}`,
        row.objectif ? `Objectif : ${row.objectif}` : '',
        row.notes ? `Notes : ${row.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      icsEvents.push(
        buildVEvent({
          uid: `demo-${row.id}@apigo`,
          dtstart: debut,
          dtend: fin,
          summary: `Démo — ${row.prenom} ${row.nom}`,
          description,
          categories: ['Démo'],
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
    'PRODID:-//APIGO//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Apigo',
    'NAME:Apigo',
    'X-WR-CALDESC:Interventions, récoltes et traitements — Apigo',
    'X-WR-TIMEZONE:Europe/Paris',
    // Couleur jaune du calendrier (Apple lit X-APPLE-CALENDAR-COLOR, RFC 7986 lit COLOR)
    'COLOR:gold',
    'X-APPLE-CALENDAR-COLOR:#F5A623',
    ...icsEvents,
    'END:VCALENDAR',
  ].join('\r\n');

  setResponseHeader(event, 'Content-Type', 'text/calendar; charset=utf-8');
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="apigo.ics"');
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
  // Nom préfixé « Apigo » + couleur jaune par événement (RFC 7986)
  lines.push(`SUMMARY:${escapeIcs(`Apigo · ${p.summary}`)}`);
  lines.push('COLOR:gold');
  if (p.description) lines.push(`DESCRIPTION:${escapeIcs(p.description)}`);
  if (p.categories?.length) lines.push(`CATEGORIES:${p.categories.join(',')}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
