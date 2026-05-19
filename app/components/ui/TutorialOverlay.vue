<template>
  <Teleport to="body">
    <Transition name="tutorial-fade">
      <div v-if="tutorial.isActive.value" class="tutorial-overlay">
        <!-- Backdrop (transparent click = skip) -->
        <div
          class="fixed inset-0"
          style="z-index: 9998"
          @click="tutorial.skipCurrentTutorial()"
        />

        <!-- Spotlight cutout via box-shadow -->
        <div
          v-if="targetRect"
          class="pointer-events-none fixed transition-all duration-350 ease-out"
          :style="spotlightStyle"
        />

        <!-- Beacon ring pulsant -->
        <div
          v-if="targetRect"
          class="pointer-events-none fixed"
          :style="beaconOuterStyle"
        />
        <div
          v-if="targetRect"
          class="pointer-events-none fixed"
          :style="beaconInnerStyle"
        />

        <!-- Main beacon border -->
        <div
          v-if="targetRect"
          class="pointer-events-none fixed rounded-[14px]"
          :style="beaconBorderStyle"
        />

        <!-- Animated hand cursor -->
        <div
          v-if="targetRect && currentStep"
          class="pointer-events-none fixed"
          :style="handStyle"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="drop-shadow-md"
            style="animation: tutorialBounceHand 1.2s ease-in-out infinite"
          >
            <path
              d="M9 11V6a1.5 1.5 0 0 1 3 0v5m0 0V5a1.5 1.5 0 0 1 3 0v6m0 0a1.5 1.5 0 0 1 3 0v2m0 0a1.5 1.5 0 0 1 3 0v3a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6v-4a1.5 1.5 0 0 1 3 0"
              stroke="var(--honey)"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- Tooltip card -->
        <div
          v-if="currentStep"
          class="fixed overflow-hidden rounded-2xl bg-white"
          style="
            z-index: 10001;
            width: 320px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
            ring: 1px solid rgba(0,0,0,0.05);
          "
          :style="tooltipStyle"
          @click.stop
        >
          <!-- Gradient top bar -->
          <div class="h-1 w-full bg-gradient-to-r from-[var(--honey)] to-[var(--honey-dark)]" />

          <div class="p-5">
            <!-- Step dots + skip controls -->
            <div class="mb-3 flex items-center justify-between">
              <!-- Step dots -->
              <div class="flex items-center gap-1.5">
                <button
                  v-for="(_, i) in currentTutorialSteps"
                  :key="i"
                  type="button"
                  class="rounded-full transition-all duration-300"
                  :style="i === currentStepIndex
                    ? 'width:18px; height:6px; background:var(--honey);'
                    : 'width:6px; height:6px; background:#d6d3d1; cursor:pointer;'"
                  @click="jumpToStep(i)"
                />
              </div>
              <!-- Controls -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-[11px] text-[var(--text-quaternary)] underline-offset-2 hover:text-[var(--text-tertiary)]"
                  @click="tutorial.skipCurrentTutorial()"
                >
                  Ignorer
                </button>
                <span class="text-[var(--text-quaternary)]">·</span>
                <button
                  type="button"
                  class="text-[11px] text-[var(--text-quaternary)] underline-offset-2 hover:text-[var(--text-tertiary)]"
                  @click="tutorial.skipAllTutorials()"
                >
                  Ne plus afficher
                </button>
              </div>
            </div>

            <!-- Step counter label -->
            <p class="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--honey-deep)]">
              Étape {{ currentStepIndex + 1 }} / {{ totalSteps }}
            </p>

            <!-- Content -->
            <h3 class="text-[15px] font-semibold leading-snug text-[var(--text-primary)]">
              {{ currentStep.title }}
            </h3>
            <p class="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
              {{ currentStep.content }}
            </p>

            <!-- Navigation -->
            <div class="mt-5 flex items-center justify-between gap-3">
              <button
                v-if="currentStepIndex > 0"
                type="button"
                class="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                @click="tutorial.previousStep()"
              >
                <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
                Précédent
              </button>
              <div v-else />

              <button
                type="button"
                class="flex items-center gap-1.5 rounded-full bg-[var(--honey)] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[var(--honey-dark)] active:scale-95"
                @click="tutorial.nextStep()"
              >
                {{ tutorial.isLastStep.value ? 'Terminer' : 'Suivant' }}
                <UIcon
                  :name="tutorial.isLastStep.value ? 'i-lucide-check' : 'i-lucide-arrow-right'"
                  class="h-3.5 w-3.5"
                />
              </button>
            </div>
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
const currentTutorialSteps = computed(() => tutorial.currentTutorial.value?.steps ?? []);

function jumpToStep(i: number) {
  const diff = i - currentStepIndex.value;
  if (diff > 0) {
    for (let j = 0; j < diff; j++) tutorial.nextStep();
  } else if (diff < 0) {
    for (let j = 0; j < -diff; j++) tutorial.previousStep();
  }
}

async function updateTargetRect() {
  if (!currentStep.value) {
    targetRect.value = null;
    return;
  }
  await nextTick();
  const el = document.querySelector(currentStep.value.target);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise((r) => setTimeout(r, 350));
    targetRect.value = el.getBoundingClientRect();
  } else {
    targetRect.value = null;
  }
}

watch(currentStep, updateTargetRect, { immediate: true });

const PADDING = 10;

const spotlightStyle = computed(() => {
  if (!targetRect.value) return {};
  const r = targetRect.value;
  return {
    top: `${r.top - PADDING}px`,
    left: `${r.left - PADDING}px`,
    width: `${r.width + PADDING * 2}px`,
    height: `${r.height + PADDING * 2}px`,
    zIndex: 9999,
    borderRadius: '14px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
  };
});

const beaconBorderStyle = computed(() => {
  if (!targetRect.value) return {};
  const r = targetRect.value;
  return {
    top: `${r.top - PADDING}px`,
    left: `${r.left - PADDING}px`,
    width: `${r.width + PADDING * 2}px`,
    height: `${r.height + PADDING * 2}px`,
    zIndex: 10000,
    border: '2px solid var(--honey)',
    borderRadius: '14px',
  };
});

const beaconInnerStyle = computed(() => {
  if (!targetRect.value) return {};
  const r = targetRect.value;
  const extra = PADDING + 6;
  return {
    top: `${r.top - extra}px`,
    left: `${r.left - extra}px`,
    width: `${r.width + extra * 2}px`,
    height: `${r.height + extra * 2}px`,
    zIndex: 10000,
    border: '1.5px solid rgba(245, 166, 35, 0.5)',
    borderRadius: '18px',
    animation: 'tutorialPulseRing 1.6s ease-out infinite',
  };
});

const beaconOuterStyle = computed(() => {
  if (!targetRect.value) return {};
  const r = targetRect.value;
  const extra = PADDING + 14;
  return {
    top: `${r.top - extra}px`,
    left: `${r.left - extra}px`,
    width: `${r.width + extra * 2}px`,
    height: `${r.height + extra * 2}px`,
    zIndex: 10000,
    border: '1px solid rgba(245, 166, 35, 0.25)',
    borderRadius: '22px',
    animation: 'tutorialPulseRing 1.6s ease-out 0.3s infinite',
  };
});

const handStyle = computed(() => {
  if (!targetRect.value || !currentStep.value) return {};
  const r = targetRect.value;
  const pos = currentStep.value.position;
  const offset = PADDING + 4;
  if (pos === 'right' || pos === 'bottom') {
    return {
      top: `${r.bottom - offset}px`,
      left: `${r.right - offset}px`,
      zIndex: 10002,
    };
  }
  return {
    top: `${r.bottom - offset}px`,
    left: `${r.right - offset}px`,
    zIndex: 10002,
  };
});

const OFFSET = 16;
const TW = 320;

const tooltipStyle = computed(() => {
  if (!currentStep.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }
  if (!targetRect.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }
  const r = targetRect.value;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const clampX = (x: number) => Math.max(8, Math.min(x, winW - TW - 8));

  switch (currentStep.value.position) {
    case 'bottom':
      return { top: `${r.bottom + OFFSET}px`, left: `${clampX(r.left)}px` };
    case 'top':
      return { bottom: `${winH - r.top + OFFSET}px`, left: `${clampX(r.left)}px` };
    case 'right':
      return { top: `${Math.max(8, r.top)}px`, left: `${r.right + OFFSET}px` };
    case 'left':
      return { top: `${Math.max(8, r.top)}px`, right: `${winW - r.left + OFFSET}px` };
    default:
      return { top: `${r.bottom + OFFSET}px`, left: `${clampX(r.left)}px` };
  }
});
</script>

<style>
@keyframes tutorialPulseRing {
  0%   { opacity: 0.8; transform: scale(1); }
  70%  { opacity: 0;   transform: scale(1.06); }
  100% { opacity: 0;   transform: scale(1.06); }
}

@keyframes tutorialBounceHand {
  0%, 100% { transform: translateY(0) rotate(-15deg); }
  50%       { transform: translateY(-7px) rotate(-15deg); }
}

.tutorial-fade-enter-active {
  transition: opacity 220ms ease-out;
}
.tutorial-fade-leave-active {
  transition: opacity 160ms ease-in;
}
.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}
</style>
