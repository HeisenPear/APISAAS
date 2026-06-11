import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { evenementsActivite, profils } from '~~/server/database/schema';
import { repondreLocal } from '~~/server/utils/copilote-local';
import type { Plan } from '~~/app/config/plans';

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
 * Copilote IA — chat streamé (SSE).
 *
 * Moteur par DÉFAUT : copilote-local.ts — 100 % embarqué, gratuit, instantané
 * (système expert + base de savoir apicole). Aucune clé, aucun crédit.
 *
 * Mode « avancé » Claude : DORMANT. Activé seulement si
 * NUXT_COPILOTE_MODE=claude, pour les comptes Expert, et chargé en import
 * dynamique pour que le SDK Anthropic ne pèse pas sur le chemin par défaut.
 *
 * Le gate de plan (feature copiloteIa) est appliqué en amont par le middleware
 * subscription via route-gates → Découverte reçoit un 402 propre ici.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { messages } = bodySchema.parse(await readBody(event));
  const question = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  const [profil] = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, user.id));
  const plan = (profil?.plan ?? 'decouverte') as Plan;
  const modeClaude = process.env.NUXT_COPILOTE_MODE === 'claude' && plan === 'expert';

  // Trace d'usage (analytics admin) — best-effort, jamais bloquant.
  // Le moteur local étant gratuit, aucun quota n'est appliqué ici ; la limite
  // iaQuestionsParMois ne servira qu'au futur mode Claude facturé.
  db.insert(evenementsActivite)
    .values({ userId: user.id, type: 'action', nom: 'ia:question' })
    .catch(() => {});

  const stream = createEventStream(event);
  // Fire-and-forget : l'ordre est garanti par la file interne du stream ;
  // on avale les erreurs d'écriture (client déconnecté) pour ne pas créer
  // de rejet de promesse non géré.
  const push = (data: unknown): void => {
    stream.push(JSON.stringify(data)).catch(() => {});
  };

  (async () => {
    try {
      if (modeClaude) {
        await runClaude(user.id, messages, push);
      } else {
        await runLocal(user.id, question, push);
      }
      await push({ type: 'done' });
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

/** Moteur local : réponse instantanée, streamée par petits groupes de mots. */
async function runLocal(
  userId: string,
  question: string,
  push: (d: unknown) => void,
): Promise<void> {
  const rep = await repondreLocal(userId, question);
  if (rep.source) push({ type: 'tool', label: rep.source });

  // Effet « frappe » léger : on découpe en mots et on pousse par groupes.
  const mots = rep.texte.split(/(\s+)/);
  let buffer = '';
  let depuisFlush = 0;
  for (const mot of mots) {
    buffer += mot;
    depuisFlush += 1;
    if (depuisFlush >= 4) {
      push({ type: 'text', delta: buffer });
      buffer = '';
      depuisFlush = 0;
      await sleep(14);
    }
  }
  if (buffer) push({ type: 'text', delta: buffer });
  if (rep.suggestions?.length) push({ type: 'suggestions', items: rep.suggestions });
}

/** Mode avancé Claude (dormant). Import dynamique : hors du bundle par défaut. */
async function runClaude(
  userId: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  push: (d: unknown) => void,
): Promise<void> {
  const { getAnthropic } = await import('~~/server/utils/ia');
  const client = getAnthropic();
  if (!client) {
    // Repli silencieux sur le moteur local si la clé manque
    const question = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    await runLocal(userId, question, push);
    return;
  }
  const { runCopilote } = await import('~~/server/utils/copilote');
  await runCopilote(client, userId, messages as Parameters<typeof runCopilote>[2], {
    onText: (delta) => push({ type: 'text', delta }),
    onTool: (_name, label) => push({ type: 'tool', label }),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
