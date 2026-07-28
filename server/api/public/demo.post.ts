import { z } from 'zod';
import { and, eq, ne, sql } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';
import { getClientIp } from '~~/server/utils/client-ip';
import { sendDemoConfirmationEmail, sendDemoAdminAlertEmail } from '~~/server/utils/email';
import { sendPushToAdmins, getAdminEmails } from '~~/server/utils/webPush';
import { isAllowedSlot, formatSlotLong } from '~~/app/utils/demoSlots';

/**
 * Réservation publique d'un créneau de démo.
 *
 * Le prospect choisit un créneau prédéfini (cf. demoSlots). On valide que le
 * créneau est réel et encore réservable, puis on l'enregistre. Anti-double-
 * réservation : index unique partiel sur rdv_at (réservations actives) → si deux
 * personnes prennent le même créneau, la 2ᵉ reçoit un 409.
 *
 * Route sous /api/public → rate-limit antispam (5 écritures / 10 min / IP) +
 * honeypot + plafond IP/24h en défense en profondeur.
 */
const bodySchema = z.object({
  prenom: z.string().min(1, 'Prénom requis').max(100).trim(),
  nom: z.string().min(1, 'Nom requis').max(100).trim(),
  email: z.string().email('Email invalide').max(200).trim().toLowerCase(),
  telephone: z.string().min(6, 'Téléphone requis').max(30).trim(),
  objectif: z.string().min(1, 'Décrivez votre objectif').max(2000).trim(),
  slot: z.string().datetime('Créneau invalide'),
  source: z.string().max(40).optional(),
  /** Honeypot anti-bot : champ invisible, doit rester vide. */
  website: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse);

  // Honeypot rempli → bot. 201 sans rien enregistrer.
  if (body.website && body.website.trim().length > 0) {
    setResponseStatus(event, 201);
    return { data: { ok: true } };
  }

  const now = new Date();

  // Le créneau doit être un créneau réel et encore réservable.
  if (!isAllowedSlot(body.slot, now)) {
    throw createError({
      statusCode: 400,
      message: 'Ce créneau n’est plus disponible. Choisissez-en un autre.',
    });
  }
  const rdvAt = new Date(body.slot);

  const ip = getClientIp(event);

  // Plafond IP/24h — défense en profondeur au-delà du rate-limit middleware.
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(demandesDemo)
    .where(
      and(eq(demandesDemo.ip, ip), sql`${demandesDemo.createdAt} > now() - interval '24 hours'`),
    );
  if ((recent?.count ?? 0) >= 20) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Trop de demandes envoyées. Réessayez plus tard ou écrivez-nous directement.',
    });
  }

  // Pré-contrôle d'occupation (message clair) — l'index unique tranche en cas de course.
  const [deja] = await db
    .select({ id: demandesDemo.id })
    .from(demandesDemo)
    .where(and(eq(demandesDemo.rdvAt, rdvAt), ne(demandesDemo.statut, 'annule')))
    .limit(1);
  if (deja) {
    throw createError({
      statusCode: 409,
      message: 'Ce créneau vient d’être réservé. Choisissez-en un autre.',
    });
  }

  let demandeId: string | undefined;
  try {
    const [demande] = await db
      .insert(demandesDemo)
      .values({
        prenom: body.prenom,
        nom: body.nom,
        email: body.email,
        telephone: body.telephone,
        objectif: body.objectif,
        rdvAt,
        source: body.source ?? 'demo_page',
        ip,
        userAgent: getHeader(event, 'user-agent') ?? null,
      })
      .returning({ id: demandesDemo.id });
    demandeId = demande?.id;
  } catch (err: unknown) {
    // Violation d'unicité (créneau pris entre le pré-contrôle et l'insert).
    if (codeErreurBase(err) === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Ce créneau vient d’être réservé. Choisissez-en un autre.',
      });
    }
    throw err;
  }

  const creneau = formatSlotLong(body.slot);

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
        title: '📅 Démo réservée',
        body: `${body.prenom} ${body.nom} — ${creneau}`,
        url: '/admin/demos',
        tag: 'demo-request',
        priorite: 'haute',
      }),
    ]);
  } catch (err) {
    console.error('[public/demo] notifications failed', err);
  }

  setResponseStatus(event, 201);
  return { data: { id: demandeId, ok: true } };
});
