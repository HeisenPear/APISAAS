import type { PostHog } from 'posthog-js';

export function usePostHog(): PostHog | null {
  if (!import.meta.client) return null;
  try {
    const { $posthog } = useNuxtApp();
    return ($posthog as PostHog) ?? null;
  } catch {
    return null;
  }
}
