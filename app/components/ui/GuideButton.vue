<template>
  <div v-if="!tutorial.isActive.value">
    <!-- Floating button -->
    <button
      type="button"
      class="fixed z-45 flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-4 py-2.5 shadow-lg transition-all duration-200 hover:border-[var(--honey)]/60 hover:shadow-xl active:scale-95"
      :class="[
        isMobile
          ? 'bottom-[144px] right-4 px-3 py-2.5'
          : 'bottom-[72px] right-6',
      ]"
      @click="toggleOpen"
    >
      <div class="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--honey-soft)]">
        <UIcon name="i-lucide-circle-help" class="h-3.5 w-3.5 text-[var(--honey-deep)]" />
      </div>
      <span v-if="!isMobile" class="text-[13px] font-semibold text-[var(--text-primary)]">Aide</span>
    </button>

    <!-- Popover -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      leave-active-class="transition-all duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed z-50 w-60 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-2xl"
        :class="[
          isMobile
            ? 'bottom-[204px] right-4'
            : 'bottom-[120px] right-6',
        ]"
      >
        <!-- Header -->
        <div class="border-b border-[var(--border-default)] px-4 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]">
            Guides disponibles
          </p>
          <p class="mt-0.5 text-[11.5px] text-[var(--text-tertiary)]">
            {{ currentPageTours.length > 0 ? 'Pour cette page' : 'Tous les guides' }}
          </p>
        </div>

        <!-- Tour list -->
        <div class="p-2">
          <button
            v-for="tour in displayedTours"
            :key="tour.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-[var(--surface-muted)]"
            @click="launch(tour)"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              :class="tutorial.completedTutorials.value.includes(tour.id) ? 'bg-emerald-50' : 'bg-[var(--honey-soft)]'"
            >
              <UIcon
                :name="tutorial.completedTutorials.value.includes(tour.id) ? 'i-lucide-check' : 'i-lucide-play'"
                class="h-3.5 w-3.5"
                :class="tutorial.completedTutorials.value.includes(tour.id) ? 'text-emerald-600' : 'text-[var(--honey-deep)]'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-medium text-[var(--text-primary)]">{{ tour.name }}</p>
              <p class="text-[11px] text-[var(--text-tertiary)]">
                {{ tour.steps.length }} étape{{ tour.steps.length > 1 ? 's' : '' }}
                {{ tutorial.completedTutorials.value.includes(tour.id) ? '· Complété' : '' }}
              </p>
            </div>
            <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5 shrink-0 text-[var(--text-quaternary)]" />
          </button>

          <!-- Show all toggle -->
          <button
            v-if="currentPageTours.length > 0 && !showAll"
            type="button"
            class="mt-1 w-full rounded-xl px-3 py-2 text-center text-[12px] text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
            @click="showAll = true"
          >
            Voir tous les guides →
          </button>
        </div>

        <!-- Footer -->
        <div class="border-t border-[var(--border-default)] px-4 py-2.5">
          <NuxtLink
            to="/guide"
            class="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
            @click="isOpen = false"
          >
            <UIcon name="i-lucide-book-open" class="h-3.5 w-3.5" />
            Guide complet
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Backdrop to close -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ALL_TUTORIALS } from '~/config/tutorials';
import type { Tutorial } from '~/config/tutorials';

const tutorial = useTutorial();
const router = useRouter();
const route = useRoute();
const { isMobile } = useSidebar();

const isOpen = ref(false);
const showAll = ref(false);

const ROUTE_TOURS: Record<string, string[]> = {
  '/dashboard': ['decouverte', 'premiers_pas'],
  '/ruchers': ['ruchers'],
  '/ruches': ['ruchers'],
  '/interventions': ['interventions'],
  '/finances': ['finances'],
  '/finances/ventes': ['finances'],
  '/finances/achats': ['finances'],
  '/transhumance': ['transhumance'],
  '/elevage': ['elevage'],
};

const currentPageTours = computed(() => {
  const ids = ROUTE_TOURS[route.path] ?? [];
  return ALL_TUTORIALS.filter((t) => ids.includes(t.id));
});

const displayedTours = computed(() => {
  if (showAll.value || currentPageTours.value.length === 0) return ALL_TUTORIALS;
  return currentPageTours.value;
});

function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) showAll.value = false;
}

async function launch(tour: Tutorial) {
  isOpen.value = false;
  if (tour.route && route.path !== tour.route) {
    await router.push(tour.route);
  }
  setTimeout(() => tutorial.forceStart(tour), 400);
}
</script>
