/**
 * Middleware global d'authentification.
 *
 * La protection effective se fait via `requireAuth(event)` dans chaque
 * route API qui necessite une authentification. Ce middleware ne bloque
 * aucune requete ; il sert uniquement de point d'observation en dev.
 */
export default defineEventHandler((event) => {
  if (import.meta.dev) {
    const method = getMethod(event);
    const path = getRequestURL(event).pathname;
    console.warn(`[auth-middleware] ${method} ${path}`);
  }
});
