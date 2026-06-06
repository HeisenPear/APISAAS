const CONSENT_KEY = 'apigo_analytics_consent';

export type ConsentState = 'granted' | 'denied' | null;

export function useAnalyticsConsent() {
  // useState factory returns null on SSR — re-sync from localStorage on client
  // to avoid hydration overwriting the stored consent and reshowing the banner.
  const state = useState<ConsentState>('analytics_consent', () => null);

  if (import.meta.client && state.value === null) {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'granted' || stored === 'denied') state.value = stored as ConsentState;
  }

  function grant() {
    state.value = 'granted';
    if (import.meta.client) localStorage.setItem(CONSENT_KEY, 'granted');
  }

  function deny() {
    state.value = 'denied';
    if (import.meta.client) localStorage.setItem(CONSENT_KEY, 'denied');
  }

  const hasAnswered = computed(() => state.value !== null);
  const isGranted = computed(() => state.value === 'granted');

  return { state, grant, deny, hasAnswered, isGranted };
}
