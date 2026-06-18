import { z } from 'zod';
import { and, eq, gte, sql } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';
import { getClientIp } from '~~/server/utils/client-ip';
import { sendDemoConfirmationEmail, sendDemoAdminAlertEmail } from '~~/server/utils/email';
import { sendPushToAdmins, getAdminEmails } from '~~/server/utils/webPush';

/**
 * Soumission publique du parcours « Réserver une démo ».
 *
 * Route publique (aucun compte requis) → placée sous /api/public pour bénéficier
 * du rate-limit antispam (5 écritures / 10 min / IP, cf. middleware 03). On
 * ajoute un honeypot + un plafond IP/24h en défense en profondeur (le rate-limit
 * IP se contourne en tournant les IPs).
 *
 * Crée la demande puis notifie : confirmation au prospect + alerte (email + push)
 * à l'équipe. Les notifications sont best-effort — jamais bloquantes.
 */
const bodySchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(100).trim(),
  nom: z.string().min(1, 'Nom requis').max(100).trim(),
  email: z.string().email('Email invalide').max(200).trim().toLowerCase(),
  telephone: z.string().min(6, 'Téléphone requis').max(30).trim(),
  objectif: z.string().min(1, 'Décrivez votre objectif').max(2000).trim(),
  creneauPeriode: z.enum(['cette_semaine', 'semaine_prochaine', 'flexible']).optional(),
  creneauJour: z.enum(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']).optional(),
  creneauMoment: z.enum(['matin', 'apres_midi']).optional(),
  source: z.string().max(40).optional(),
  /** Honeypot anti-bot : champ invisible, doit rester vide. */
  website: z.string().optional(),
});

const MOMENTS: Record<string, string> = { matin: 'le matin', apres_midi: "l'après-midi" };
const PERIODES: Record<string, string> = {
  cette_semaine: 'cette semaine',
  semaine_prochaine: 'la semaine prochaine',
  flexible: 'flexible',
};

/** Combine période / jour / moment en une phrase lisible pour les emails. */
function formatCreneau(p?: string | null, j?: string | null, m?: string | null): string | null {
  const parts: string[] = [];
  if (j) parts.push(j.charAt(0).toUpperCase() + j.slice(1));
  if (m) parts.push(MOMENTS[m] ?? m);
  if (p) parts.push(`(${PERIODES[p] ?? p})`);
  return parts.length ? parts.join(' ') : null;
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  // Honeypot rempli → bot. On répond 201 sans rien enregistrer (ne pas signaler
  // au bot qu'il a été détecté).
  if (body.website && body.website.trim().length > 0) {
    setResponseStatus(event, 201);
    return { data: { ok: true } };
  }

  const ip = getClientIp(event);

  // Plafond IP/24h — défense en profondeur au-delà du rate-limit middleware.
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(demandesDemo)
    .where(
      and(
        eq(demandesDemo.ip, ip),
        gte(demandesDemo.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    );
  if ((recent?.count ?? 0) >= 20) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Trop de demandes envoyées. Réessayez plus tard ou écrivez-nous directement.',
    });
  }

  const [demande] = await db
    .insert(demandesDemo)
    .values({
      prenom: body.prenom,
      nom: body.nom,
      email: body.email,
      telephone: body.telephone,
      objectif: body.objectif,
      creneauPeriode: body.creneauPeriode ?? null,
      creneauJour: body.creneauJour ?? null,
      creneauMoment: body.creneauMoment ?? null,
      source: body.source ?? 'demo_page',
      ip,
      userAgent: getHeader(event, 'user-agent') ?? null,
    })
    .returning({ id: demandesDemo.id });

  const creneau = formatCreneau(body.creneauPeriode, body.creneauJour, body.creneauMoment);

  // Notifications — best-effort, jamais bloquantes pour le prospect.
  try {
    await Promise.allSettled([
      sendDemoConfirmationEmail({ to: body.email, prenom: body.prenom, creneau }),
      sendDemoAdminAlertEmail({
        to: getAdminEmails(),
        replyTo: body.email,
        prenom: body.prenom,
        nom: body.nom,
        email: body.email,
        telephone: body.telephone,
        objectif: body.objectif,
        creneau,
      }),
      sendPushToAdmins({
        title: '🔔 Nouvelle demande de démo',
        body: `${body.prenom} ${body.nom}${creneau ? ` — ${creneau}` : ''}`,
        url: '/admin/demos',
        tag: 'demo-request',
        priorite: 'haute',
      }),
    ]);
  } catch (err) {
    console.error('[public/demo] notifications failed', err);
  }

  setResponseStatus(event, 201);
  return { data: { id: demande?.id, ok: true } };
});
