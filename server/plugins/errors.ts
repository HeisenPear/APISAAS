import { ZodError } from 'zod';

/**
 * Nitro error hook — deux responsabilités :
 *  1. Traduire les ZodErrors en messages lisibles en français.
 *  2. Logger de façon structurée les erreurs serveur 5xx (observabilité prod).
 *     Sans ça, Vercel n'affiche qu'un "[request error] [unhandled]" tronqué,
 *     impossible à diagnostiquer. On émet method + path + statusCode + message
 *     + stack, ce qui rend les logs runtime Vercel exploitables.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    if (!event) return;

    const cause = error.cause ?? error;

    if (cause instanceof ZodError) {
      const firstIssue = cause.issues[0];
      let message = 'Données invalides';

      if (firstIssue) {
        const field = firstIssue.path.length > 0 ? firstIssue.path.join('.') : null;
        const msg = firstIssue.message;

        if (field) {
          message = `Champ "${field}" invalide : ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`;
        } else {
          message = msg;
        }
      }

      // Remplacer le message de l'erreur par le message lisible
      const err = error as unknown as { statusCode?: number; statusMessage?: string };
      err.statusCode = 400;
      err.statusMessage = 'Bad Request';
      error.message = message;
      return;
    }

    // Log structuré des erreurs serveur (5xx ou non gérées). Les 4xx attendues
    // (401, 403, 404, 422, 429…) ne sont pas du bruit à logger.
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    if (statusCode >= 500) {
      console.error(
        `[server-error] ${event.method} ${event.path} → ${statusCode}: ${error.message}`,
        error.stack ?? '',
      );
    }
  });
});
