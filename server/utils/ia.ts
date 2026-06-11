import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

/**
 * Client Anthropic (lazy). Retourne null si la clé n'est pas configurée —
 * les routes IA renvoient alors une erreur explicite plutôt qu'un crash.
 * Clé : NUXT_ANTHROPIC_API_KEY (server only).
 */
export function getAnthropic(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.NUXT_ANTHROPIC_API_KEY || (useRuntimeConfig().anthropicApiKey as string);
  if (!key) return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}
