import { PostHog } from 'posthog-node';

/**
 * Client PostHog serveur — tolérant à l'absence de clé.
 * Sans NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN, on renvoie un stub no-op : on n'appelle
 * JAMAIS `new PostHog('')` (qui lève « You must pass your PostHog project's api
 * key » et faisait planter le serveur/build).
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

let client: PostHog | null = null;

export function useServerPostHog(): PostHogLike {
  const config = useRuntimeConfig();
  const posthogConfig = (config.public.posthog ?? {}) as { publicKey?: string; host?: string };
  const key = posthogConfig.publicKey;
  if (!key) return noop;

  if (!client) {
    client = new PostHog(key, { host: posthogConfig.host });
  }
  return client as unknown as PostHogLike;
}
