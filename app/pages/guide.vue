<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1
        class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      >
        Guide d'utilisation
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Tout savoir sur APIGO en quelques minutes
      </p>
    </div>

    <!-- Pill nav -->
    <div class="flex flex-wrap items-center gap-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-1">
      <button
        v-for="section in SECTIONS"
        :key="section.id"
        type="button"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium transition-all duration-150"
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

    <!-- Content -->
    <div class="rounded-2xl border border-[var(--border-default)] bg-white p-8">
      <Transition name="fade" mode="out-in">
        <component :is="activeComponent" :key="activeSection" />
      </Transition>
    </div>

    <!-- Launch interactive guide -->
    <div class="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-5">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--honey-soft)]">
        <UIcon name="i-lucide-play-circle" class="h-5 w-5 text-[var(--honey-deep)]" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold text-[var(--text-primary)]">Guide interactif</p>
        <p class="text-xs text-[var(--text-secondary)]">Lancez un guide pas-à-pas pour ce module</p>
      </div>
      <UButton
        label="Relancer le guide"
        icon="i-lucide-play"
        variant="soft"
        color="primary"
        size="sm"
        @click="launchTutorialForSection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { ALL_TUTORIALS } from '~/config/tutorials';

definePageMeta({ layout: 'default' });

const router = useRouter();
const tutorial = useTutorial();

const SECTIONS = [
  { id: 'premiers-pas', emoji: '🚀', label: 'Premiers pas', tutorial: 'decouverte' },
  { id: 'ruchers-ruches', emoji: '🏕️', label: 'Ruchers & Ruches', tutorial: 'ruchers' },
  { id: 'interventions', emoji: '📋', label: 'Interventions', tutorial: 'interventions' },
  { id: 'production', emoji: '🍯', label: 'Production', tutorial: null },
  { id: 'finances', emoji: '💰', label: 'Finances', tutorial: 'finances' },
  { id: 'transhumance', emoji: '🚛', label: 'Transhumance', tutorial: 'transhumance' },
  { id: 'elevage', emoji: '🧬', label: 'Élevage', tutorial: 'elevage' },
  { id: 'conformite', emoji: '📋', label: 'Conformité', tutorial: null },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const activeSection = ref<SectionId>('premiers-pas');

const COMPONENTS: Record<SectionId, ReturnType<typeof defineAsyncComponent>> = {
  'premiers-pas': defineAsyncComponent(() => import('~/components/guide/GuidePremiersPas.vue')),
  'ruchers-ruches': defineAsyncComponent(() => import('~/components/guide/GuideRuchersRuches.vue')),
  'interventions': defineAsyncComponent(() => import('~/components/guide/GuideInterventions.vue')),
  'production': defineAsyncComponent(() => import('~/components/guide/GuideProduction.vue')),
  'finances': defineAsyncComponent(() => import('~/components/guide/GuideFinances.vue')),
  'transhumance': defineAsyncComponent(() => import('~/components/guide/GuideTranshumance.vue')),
  'elevage': defineAsyncComponent(() => import('~/components/guide/GuideElevage.vue')),
  'conformite': defineAsyncComponent(() => import('~/components/guide/GuideConformite.vue')),
};

const activeComponent = computed(() => COMPONENTS[activeSection.value]);

async function launchTutorialForSection() {
  const section = SECTIONS.find((s) => s.id === activeSection.value);
  if (!section?.tutorial) return;
  const tour = ALL_TUTORIALS.find((t) => t.id === section.tutorial);
  if (!tour) return;
  if (tour.route) {
    await router.push(tour.route);
  }
  setTimeout(() => tutorial.startTutorial(tour), 400);
}
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
</style>
