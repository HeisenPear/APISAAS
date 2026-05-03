import type { Tutorial, TutorialStep } from '~/config/tutorials';

// Module-level singleton state (persists across page navigations)
const isActive = ref(false);
const currentTutorial = ref<Tutorial | null>(null);
const currentStepIndex = ref(0);

export function useTutorial() {
  const authStore = useAuthStore();

  const completedTutorials = computed<string[]>(() => {
    const prefs = authStore.profil?.preferences as Record<string, unknown> | undefined;
    const completed = prefs?.tutorialsCompleted;
    if (Array.isArray(completed)) return completed as string[];
    return [];
  });

  const isDismissed = computed<boolean>(() => {
    const prefs = authStore.profil?.preferences as Record<string, unknown> | undefined;
    return prefs?.tutorialsDismissed === true;
  });

  const currentStep = computed<TutorialStep | null>(() => {
    if (!currentTutorial.value) return null;
    return currentTutorial.value.steps[currentStepIndex.value] ?? null;
  });

  const isLastStep = computed(() => {
    if (!currentTutorial.value) return false;
    return currentStepIndex.value >= currentTutorial.value.steps.length - 1;
  });

  const progress = computed(() => {
    if (!currentTutorial.value) return 0;
    return Math.round(((currentStepIndex.value + 1) / currentTutorial.value.steps.length) * 100);
  });

  function startTutorial(tutorial: Tutorial) {
    if (isDismissed.value) return;
    if (completedTutorials.value.includes(tutorial.id)) return;
    currentTutorial.value = tutorial;
    currentStepIndex.value = 0;
    isActive.value = true;
  }

  function nextStep() {
    if (!currentTutorial.value) return;
    if (isLastStep.value) {
      completeTutorial();
    } else {
      currentStepIndex.value++;
    }
  }

  function previousStep() {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--;
    }
  }

  async function skipCurrentTutorial() {
    if (!currentTutorial.value) return;
    await _markCompleted(currentTutorial.value.id);
    isActive.value = false;
    currentTutorial.value = null;
    currentStepIndex.value = 0;
  }

  async function skipAllTutorials() {
    isActive.value = false;
    currentTutorial.value = null;
    currentStepIndex.value = 0;
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        tutorialsDismissed: true,
      },
    });
  }

  async function completeTutorial() {
    if (!currentTutorial.value) return;
    const id = currentTutorial.value.id;
    isActive.value = false;
    currentTutorial.value = null;
    currentStepIndex.value = 0;
    await _markCompleted(id);
  }

  async function _markCompleted(id: string) {
    const current = completedTutorials.value;
    if (current.includes(id)) return;
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        tutorialsCompleted: [...current, id],
      },
    });
  }

  // Escape key listener — client only
  if (import.meta.client) {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive.value) {
        skipCurrentTutorial();
      }
    };
    onMounted(() => document.addEventListener('keydown', handleKey));
    onUnmounted(() => document.removeEventListener('keydown', handleKey));
  }

  return {
    // State (readonly)
    isActive: readonly(isActive),
    currentTutorial: readonly(currentTutorial),
    currentStep,
    currentStepIndex: readonly(currentStepIndex),
    isLastStep,
    progress,
    completedTutorials,
    isDismissed,
    // Actions
    startTutorial,
    nextStep,
    previousStep,
    skipCurrentTutorial,
    skipAllTutorials,
    completeTutorial,
  };
}
