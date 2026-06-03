import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { evenementsActivite, profils } from '~~/server/database/schema';
import { getClientIp } from '~~/server/utils/client-ip';

/**
 * Ingestion d'événements d'activité produit (analytics 1ère partie).
 *
 * Appelé par le plugin client `activity-tracker` à chaque changement de page
 * et sur les actions métier clés. Best-effort : ne fait jamais échouer le
 * client, et reste volontairement minimaliste (chemin + type, pas de contenu).
 */

const bodySchema = z.object({
  type: z.enum(['page', 'action']),
  nom: z.string().min(1).max(200),
  titre: z.string().max(200).optional(),
  dureeMs: z.number().int().min(0).max(86_400_000).optional(),
  sessionId: z.string().max(64).optional(),
  metadata: z.record(z.unknown()).optional(),
  /** Heartbeat : rafraîchit la présence sans enregistrer d'événement */
  ping: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    setResponseStatus(event, 204);
    return null;
  }
  const body = parsed.data;

  try {
    if (!body.ping) {
      await db.insert(evenementsActivite).values({
        userId: user.id,
        type: body.type,
        nom: body.nom,
        titre: body.titre ?? null,
        dureeMs: body.dureeMs ?? null,
        sessionId: body.sessionId ?? null,
        ip: getClientIp(event),
        userAgent: getHeader(event, 'user-agent') ?? null,
        metadata: body.metadata ?? null,
      });
    }

    // Présence : marque la dernière activité (et la page courante si navigation)
    await db
      .update(profils)
      .set({
        derniereActiviteAt: sql`now()`,
        ...(body.type === 'page' ? { dernierePage: body.nom } : {}),
      })
      .where(eq(profils.id, user.id));
  } catch (err) {
    // Best-effort : l'analytics ne doit jamais casser l'expérience utilisateur.
    console.error('[track] insert failed', { type: body.type, error: err });
  }

  setResponseStatus(event, 204);
  return null;
});
