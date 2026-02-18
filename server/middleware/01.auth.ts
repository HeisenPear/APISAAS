/**
 * Middleware global d'authentification.
 *
 * La protection effective se fait via `requireAuth(event)` dans chaque
 * route API qui necessite une authentification. Ce middleware ne bloque
 * aucune requete.
 */
export default defineEventHandler(() => {
  // No-op: auth is enforced per-route via requireAuth()
});
