<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="tutorial.isActive.value" class="tutorial-overlay">
        <!-- Backdrop (transparent, catches clicks) -->
        <div
          class="fixed inset-0"
          style="z-index: 9999"
          @click="tutorial.skipCurrentTutorial()"
        />

        <!-- Highlight ring around target element -->
        <div
          v-if="targetRect"
          class="pointer-events-none fixed transition-all duration-300 ease-out"
          :style="highlightStyle"
        />

        <!-- Tooltip card -->
        <div
          v-if="currentStep"
          class="fixed w-[320px] rounded-2xl border border-stone-200/60 bg-white p-5 shadow-xl"
          style="z-index: 10001"
          :style="tooltipStyle"
          @click.stop
        >
          <!-- Top bar -->
          <div class="mb-3 flex items-center justify-between">
            <span class="text-[11px] font-semibold text-[var(--text-tertiary)]">
              {{ currentStepIndex + 1 }}/{{ totalSteps }}
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-[11px] text-[var(--text-tertiary)] underline underline-offset-2 hover:text-[var(--text-secondary)]"
                @click="tutorial.skipCurrentTutorial()"
              >
                Passer ce guide
              </button>
              <span class="text-[var(--text-tertiary)]">·</span>
              <button
                type="button"
                class="text-[11px] text-[var(--text-tertiary)] underline underline-offset-2 hover:text-[var(--text-secondary)]"
                @click="tutorial.skipAllTutorials()"
              >
                Ne plus afficher
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mb-4 h-1 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              class="h-full rounded-full bg-[var(--honey)] transition-all duration-300"
              :style="{ width: `${tutorial.progress.value}%` }"
            />
          </div>

          <!-- Content -->
          <h3 class="text-[15px] font-semibold text-[var(--text-primary)]">{{ currentStep.title }}</h3>
          <p class="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{{ currentStep.content }}</p>

          <!-- Navigation -->
          <div class="mt-4 flex items-center justify-between">
            <UButton
              v-if="currentStepIndex > 0"
              label="Précédent"
              icon="i-lucide-arrow-left"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="tutorial.previousStep()"
            />
            <div v-else />
            <UButton
              :label="tutorial.isLastStep.value ? 'Terminer' : 'Suivant'"
              :icon="tutorial.isLastStep.value ? 'i-lucide-check' : 'i-lucide-arrow-right'"
              trailing
              color="primary"
              size="sm"
              @click="tutorial.nextStep()"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const tutorial = useTutorial();

const targetRect = ref<DOMRect | null>(null);

const currentStep = computed(() => tutorial.currentStep.value);
const currentStepIndex = computed(() => tutorial.currentStepIndex.value);
const totalSteps = computed(() => tutorial.currentTutorial.value?.steps.length ?? 0);

async function updateTargetRect() {
  if (!currentStep.value) {
    targetRect.value = null;
    return;
  }
  await nextTick();
  const el = document.querySelector(currentStep.value.target);
  if (el) {
    targetRect.value = el.getBoundingClientRect();
  } else {
    targetRect.value = null;
  }
}

watch(currentStep, updateTargetRect, { immediate: true });

const PADDING = 8;

const highlightStyle = computed(() => {
  if (!targetRect.value) return {};
  const r = targetRect.value;
  return {
    top: `${r.top - PADDING}px`,
    left: `${r.left - PADDING}px`,
    width: `${r.width + PADDING * 2}px`,
    height: `${r.height + PADDING * 2}px`,
    zIndex: 10000,
    borderRadius: '12px',
    boxShadow: '0 0 0 4px var(--honey), 0 0 0 9999px rgba(0,0,0,0.5)',
  };
});

const tooltipStyle = computed(() => {
  if (!targetRect.value || !currentStep.value) return {};
  const r = targetRect.value;
  const OFFSET = 16;
  const TW = 320;
  switch (currentStep.value.position) {
    case 'bottom':
      return {
        top: `${r.bottom + OFFSET}px`,
        left: `${Math.max(8, Math.min(r.left, window.innerWidth - TW - 8))}px`,
      };
    case 'top':
      return {
        bottom: `${window.innerHeight - r.top + OFFSET}px`,
        left: `${Math.max(8, Math.min(r.left, window.innerWidth - TW - 8))}px`,
      };
    case 'right':
      return {
        top: `${r.top}px`,
        left: `${r.right + OFFSET}px`,
      };
    case 'left':
      return {
        top: `${r.top}px`,
        right: `${window.innerWidth - r.left + OFFSET}px`,
      };
    default:
      return {
        top: `${r.bottom + OFFSET}px`,
        left: `${r.left}px`,
      };
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
