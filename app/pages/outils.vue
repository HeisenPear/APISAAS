<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1
        class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        "
      >
        Outils pratiques
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Des calculettes et guides pour le terrain, indépendants de vos ruchers
      </p>
    </div>

    <!-- Pill nav -->
    <div class="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div
        class="flex w-max items-center gap-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-1 sm:w-fit sm:flex-wrap"
      >
        <button
          v-for="section in SECTIONS"
          :key="section.id"
          type="button"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-4 py-1.5 text-xs font-medium transition-all duration-150"
          :class="
            activeSection === section.id
              ? 'bg-white font-semibold text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          "
          @click="activeSection = section.id"
        >
          {{ section.emoji }} {{ section.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="rounded-2xl border border-[var(--border-default)] bg-white p-5 sm:p-8">
      <Transition name="fade" mode="out-in">
        <component :is="activeComponent" :key="activeSection" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

definePageMeta({ layout: 'default' });

type SectionId = 'sirop-candi' | 'distance' | 'refractometre';

interface OutilSection {
  id: SectionId;
  emoji: string;
  label: string;
}

const SECTIONS: OutilSection[] = [
  { id: 'sirop-candi', emoji: '🍯', label: 'Sirop & candi' },
  { id: 'distance', emoji: '📍', label: 'Distance & butinage' },
  { id: 'refractometre', emoji: '🔬', label: 'Réfractomètre' },
];

const activeSection = ref<SectionId>('sirop-candi');

const COMPONENTS: Record<SectionId, ReturnType<typeof defineAsyncComponent>> = {
  'sirop-candi': defineAsyncComponent(() => import('~/components/outils/OutilsSiropCandi.vue')),
  distance: defineAsyncComponent(() => import('~/components/outils/OutilsDistance.vue')),
  refractometre: defineAsyncComponent(() => import('~/components/outils/OutilsRefractometre.vue')),
};

const activeComponent = computed(() => COMPONENTS[activeSection.value]);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
