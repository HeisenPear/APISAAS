<template>
  <div class="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
    <div class="mb-2.5 flex items-center gap-2">
      <UIcon name="i-lucide-play-circle" class="h-3.5 w-3.5 text-[var(--honey-deep)]" />
      <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]">
        Guides interactifs pas à pas
      </p>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="tour in ALL_TUTORIALS"
        :key="tour.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all duration-150"
        :class="
          tutorial.completedTutorials.value.includes(tour.id)
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]/50 hover:bg-[var(--honey-soft)] hover:text-[var(--honey-deep)]'
        "
        @click="launchTutorial(tour)"
      >
        <UIcon
          :name="
            tutorial.completedTutorials.value.includes(tour.id)
              ? 'i-lucide-check-circle'
              : 'i-lucide-play'
          "
          class="h-3 w-3"
        />
        {{ tour.name }}
      </button>
    </div>
    <button
      type="button"
      class="mt-2.5 text-[11px] text-[var(--text-quaternary)] underline underline-offset-2 hover:text-[var(--text-tertiary)]"
      @click="dismissAllGuides"
    >
      Masquer tous les guides interactifs
    </button>
  </div>
</template>

<script setup lang="ts">
import { ALL_TUTORIALS } from '~/config/tutorials';

const router = useRouter();
const tutorial = useTutorial();
const notifications = useNotifications();

async function launchTutorial(tour: (typeof ALL_TUTORIALS)[number]) {
  if (tour.route) {
    await router.push(tour.route);
  }
  setTimeout(() => tutorial.forceStart(tour), 400);
}

async function dismissAllGuides() {
  await tutorial.skipAllTutorials();
  notifications.success('Guides interactifs masqués');
}
</script>
