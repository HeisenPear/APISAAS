/**
 * État partagé du token CAPTCHA (Cloudflare Turnstile).
 *
 * Le composant `UiTurnstile` renseigne le token ; `useAuth` le consomme et le
 * passe à `supabase.auth` (login / register / reset / magic-link) pour compenser
 * l'absence de verrou anti-brute-force côté serveur (auth 100 % client→Supabase).
 *
 * ENV-GATED : si `NUXT_PUBLIC_TURNSTILE_SITE_KEY` est absent, aucun widget ne se
 * monte, `token` reste `null`, et les appels auth partent SANS `captchaToken`
 * (comportement strictement inchangé). À activer côté dashboard Supabase avec le
 * secret correspondant.
 */
export function useCaptcha() {
  const token = useState<string | null>('captcha-token', () => null);
  const enabled = !!(useRuntimeConfig().public.turnstileSiteKey as string);

  /** Récupère le token courant et le remet à null (usage unique). */
  function consume(): string | undefined {
    const t = token.value ?? undefined;
    token.value = null;
    return t;
  }

  return { token, enabled, consume };
}
