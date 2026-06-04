/**
 * PostHog DÉSACTIVÉ (temporairement) — neutralisé pour stabiliser le site.
 *
 * On ne charge plus `posthog-node` ni aucune clé : `useServerPostHog()` renvoie
 * un objet no-op. Tous les `useServerPostHog().capture(...)` des routes restent
 * valides mais n'envoient rien et ne peuvent JAMAIS lever d'exception.
 *
 * Réactivation propre = réinstaller posthog-node + le module, fournir la clé,
 * et restaurer l'implémentation réelle ici.
 */
interface PostHogLike {
  capture: (...args: unknown[]) => void;
  identify: (...args: unknown[]) => void;
  shutdown: () => Promise<void> | void;
  flush: () => Promise<void> | void;
}

const noop: PostHogLike = {
  capture: () => {},
  identify: () => {},
  shutdown: () => {},
  flush: () => {},
};

export function useServerPostHog(): PostHogLike {
  return noop;
}
