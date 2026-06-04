/**
 * Shim PostHog — le module @posthog/nuxt est désactivé temporairement (il faisait
 * échouer le build sans clé). Ce composable fournit un objet no-op pour que tous
 * les appels `posthog?.capture(...)` / `identify` / `reset` du code restent
 * fonctionnels sans rien envoyer. Réactivation = réinstaller le module et
 * supprimer ce fichier.
 */
interface PostHogStub {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (id: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

const noop: PostHogStub = {
  capture: () => {},
  identify: () => {},
  reset: () => {},
};

export function usePostHog(): PostHogStub | null {
  return noop;
}
