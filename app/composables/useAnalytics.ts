export interface PersonProperties {
  plan?: string;
  trial_active?: boolean;
  onboarding_complete?: boolean;
  nb_ruches?: number;
  nb_ruchers?: number;
  date_inscription?: string;
  is_admin?: boolean;
  departement?: string | null;
  platform?: 'pwa' | 'web';
  is_pwa_installed?: boolean;
}

export interface GroupProperties {
  plan?: string;
  nb_membres?: number;
  mrr?: number;
  nb_ruches?: number;
}

export function useAnalytics() {
  const posthog = usePostHog();
  const { isGranted } = useAnalyticsConsent();

  function capture(event: string, properties?: Record<string, unknown>) {
    if (!posthog || !isGranted.value) return;
    posthog.capture(event, properties);
  }

  function identify(distinctId: string, properties?: PersonProperties) {
    if (!posthog) return;
    posthog.identify(distinctId, properties as Record<string, unknown>);
  }

  function group(groupKey: string, properties?: GroupProperties) {
    if (!posthog || !isGranted.value) return;
    posthog.group('exploitation', groupKey, properties as Record<string, unknown>);
  }

  function reset() {
    if (!posthog) return;
    posthog.reset();
  }

  return { capture, identify, group, reset };
}
