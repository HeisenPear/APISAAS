const CONSENT_KEY = 'apigo_analytics_consent';

export type ConsentState = 'granted' | 'denied' | null;

export function useAnalyticsConsent() {
  const state = useState<ConsentState>('analytics_consent', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === 'granted' || stored === 'denied') return stored as ConsentState;
    }
    return null;
  });

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
