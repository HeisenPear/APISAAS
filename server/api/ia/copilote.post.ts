import { z } from 'zod';
import { and, eq, gte, sql } from 'drizzle-orm';
import type Anthropic from '@anthropic-ai/sdk';
import { evenementsActivite, profils } from '~~/server/database/schema';
import { getAnthropic } from '~~/server/utils/ia';
import { runCopilote } from '~~/server/utils/copilote';
import { getLimit, getPlanConfig, type Plan } from '~~/app/config/plans';
import { isAdminEmail } from '~~/app/config/admin';

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(16),
});

/**
 * Copilote IA — chat streamé (SSE) avec outils en lecture seule sur les
 * données de l'utilisateur. Quota mensuel par plan, compté dans
 * evenements_activite (nom 'ia:question') — aucune table dédiée nécessaire.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { messages } = bodySchema.parse(await readBody(event));

  const client = getAnthropic();
  if (!client) {
    throw createError({
      statusCode: 503,
      message: 'Copilote IA non configuré (clé API absente côté serveur).',
    });
  }

  // ── Quota mensuel ──────────────────────────────────────────────────────────
  const [profil] = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, user.id));
  const plan = (profil?.plan ?? 'decouverte') as Plan;
  const max = getLimit(plan, 'iaQuestionsParMois');
  const admin = isAdminEmail(user.email);

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  const [usage] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(evenementsActivite)
    .where(
      and(
        eq(evenementsActivite.userId, user.id),
        eq(evenementsActivite.nom, 'ia:question'),
        gte(evenementsActivite.createdAt, debutMois),
      ),
    );
  const utilise = usage?.count ?? 0;

  if (!admin && max !== Infinity && utilise >= max) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Quota IA atteint',
      data: {
        code: 'QUOTA_IA_ATTEINT',
        utilise,
        max,
        currentPlan: plan,
        message: `Vous avez utilisé vos ${max} questions du mois (plan ${getPlanConfig(plan).label}). Passez au plan supérieur pour continuer.`,
      },
    });
  }

  // Comptabilise la question AVANT le stream (un abort ne contourne pas le quota)
  db.insert(evenementsActivite)
    .values({ userId: user.id, type: 'action', nom: 'ia:question' })
    .catch(() => {});

  // ── Stream SSE ─────────────────────────────────────────────────────────────
  const stream = createEventStream(event);
  const push = (data: unknown) => stream.push(JSON.stringify(data));

  // Fire-and-forget : la réponse part tout de suite, la boucle pousse les events
  (async () => {
    try {
      await runCopilote(client, user.id, messages as Anthropic.MessageParam[], {
        onText: (delta) => void push({ type: 'text', delta }),
        onTool: (name, label) => void push({ type: 'tool', name, label }),
      });
      await push({
        type: 'done',
        quota: { utilise: utilise + 1, max: max === Infinity ? null : max },
      });
    } catch (err) {
      console.error('[ia/copilote] échec:', err instanceof Error ? err.message : err);
      await push({
        type: 'error',
        message: 'Le Copilote a rencontré un problème. Réessayez dans un instant.',
      });
    } finally {
      await stream.close();
    }
  })();

  return stream.send();
});
