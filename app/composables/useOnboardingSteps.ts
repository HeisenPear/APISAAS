export interface OnboardingStep {
  label: string;
  done: boolean;
  to: string;
  icon: string;
}

/**
 * Checklist de démarrage dérivée des vraies données du compte (pas de flags
 * séparés à maintenir) — partagée entre le bandeau dashboard (WelcomeBanner)
 * et le panneau de progression du hub de guides (/guide).
 */
export function useOnboardingSteps() {
  const authStore = useAuthStore();
  const { dashboard } = useDashboard();

  const profilApicole = computed(() => {
    const prefs = authStore.profil?.preferences as Record<string, unknown> | undefined;
    return (prefs?.profilApicole as string | undefined) ?? 'loisir';
  });

  const isPro = computed(() => ['professionnel', 'pluri_actif'].includes(profilApicole.value));

  const hasRucher = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
  const hasRuches = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
  const hasIntervention = computed(() => (dashboard.value?.activiteRecente?.length ?? 0) > 0);

  const steps = computed<OnboardingStep[]>(() => {
    const base: OnboardingStep[] = [
      { label: 'Profil configuré', done: true, to: '/parametres', icon: 'i-lucide-user-check' },
      {
        label: 'Créer un rucher',
        done: hasRucher.value,
        to: '/ruchers/nouveau',
        icon: 'i-lucide-map-pin',
      },
      {
        label: 'Ajouter vos ruches',
        done: hasRuches.value,
        to: '/ruches/nouveau',
        icon: 'i-lucide-hexagon',
      },
      {
        label: 'Première intervention',
        done: hasIntervention.value,
        to: '/interventions/nouvelle',
        icon: 'i-lucide-clipboard-check',
      },
    ];
    if (isPro.value) {
      base.push({ label: 'Créer un client', done: false, to: '/clients', icon: 'i-lucide-users' });
    }
    return base;
  });

  const completedCount = computed(() => steps.value.filter((s) => s.done).length);
  const totalSteps = computed(() => steps.value.length);
  const progressPct = computed(() => Math.round((completedCount.value / totalSteps.value) * 100));

  return { steps, completedCount, totalSteps, progressPct };
}
