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
        Guide d'utilisation
      </h1>
      <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
        Tout savoir sur APIGO en quelques minutes
      </p>
    </div>

    <!-- Pill nav — barre segmentée : défilement horizontal sur mobile
         (bord à bord), boîte à retour à la ligne sur desktop -->
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
          <span
            v-if="section.planLabel"
            class="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
            :class="
              section.planLabel === 'Expert'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-[var(--honey-soft)] text-[var(--honey-deep)]'
            "
            >{{ section.planLabel }}</span
          >
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="rounded-2xl border border-[var(--border-default)] bg-white p-5 sm:p-8">
      <!-- Gate banner si plan insuffisant -->
      <div
        v-if="activeGateInfo"
        class="mb-6 flex items-start gap-3 rounded-[10px] border border-[var(--honey)]/30 bg-[var(--honey-soft)] px-4 py-3"
      >
        <UIcon name="i-lucide-lock" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]" />
        <div class="flex-1">
          <p class="text-[13px] font-semibold text-[var(--honey-deep)]">
            Fonctionnalité {{ activeGateInfo.planLabel }}
          </p>
          <p class="mt-0.5 text-[12px] text-[var(--honey-deep)]/80">
            Passez au plan {{ activeGateInfo.planLabel }} pour débloquer cette section et accéder à
            toutes ses fonctionnalités.
          </p>
        </div>
        <NuxtLink
          to="/parametres/abonnement"
          class="shrink-0 rounded-[8px] bg-[var(--honey)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--honey-dark)]"
        >
          Upgrader
        </NuxtLink>
      </div>

      <Transition name="fade" mode="out-in">
        <component :is="activeComponent" :key="activeSection" />
      </Transition>
    </div>

    <!-- Launch interactive guide -->
    <div
      class="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-5"
    >
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
import type { PlanFeatures } from '~/config/plans';

definePageMeta({ layout: 'default' });

const router = useRouter();
const tutorial = useTutorial();
const { can } = useGating();

type SectionId =
  | 'premiers-pas'
  | 'ruchers-ruches'
  | 'interventions'
  | 'production'
  | 'finances'
  | 'transhumance'
  | 'elevage'
  | 'conformite'
  | 'equipe';

interface GuideSection {
  id: SectionId;
  emoji: string;
  label: string;
  tutorial: string | null;
  planFeature: keyof PlanFeatures | null;
  planLabel: string | null;
}

const SECTIONS: GuideSection[] = [
  {
    id: 'premiers-pas',
    emoji: '🚀',
    label: 'Premiers pas',
    tutorial: 'decouverte',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'ruchers-ruches',
    emoji: '🏕️',
    label: 'Ruchers & Ruches',
    tutorial: 'ruchers',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'interventions',
    emoji: '📋',
    label: 'Interventions',
    tutorial: 'interventions',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'production',
    emoji: '🍯',
    label: 'Production',
    tutorial: null,
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'finances',
    emoji: '💰',
    label: 'Finances',
    tutorial: 'finances',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'transhumance',
    emoji: '🚛',
    label: 'Transhumance',
    tutorial: 'transhumance',
    planFeature: 'transhumance',
    planLabel: 'Pro',
  },
  {
    id: 'elevage',
    emoji: '🧬',
    label: 'Élevage',
    tutorial: 'elevage',
    planFeature: 'elevageReines',
    planLabel: 'Expert',
  },
  {
    id: 'conformite',
    emoji: '📋',
    label: 'Conformité',
    tutorial: null,
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'equipe',
    emoji: '👥',
    label: 'Équipe',
    tutorial: null,
    planFeature: 'multiUsers',
    planLabel: 'Pro',
  },
];

const activeSection = ref<SectionId>('premiers-pas');

const COMPONENTS: Record<SectionId, ReturnType<typeof defineAsyncComponent>> = {
  'premiers-pas': defineAsyncComponent(() => import('~/components/guide/GuidePremiersPas.vue')),
  'ruchers-ruches': defineAsyncComponent(() => import('~/components/guide/GuideRuchersRuches.vue')),
  interventions: defineAsyncComponent(() => import('~/components/guide/GuideInterventions.vue')),
  production: defineAsyncComponent(() => import('~/components/guide/GuideProduction.vue')),
  finances: defineAsyncComponent(() => import('~/components/guide/GuideFinances.vue')),
  transhumance: defineAsyncComponent(() => import('~/components/guide/GuideTranshumance.vue')),
  elevage: defineAsyncComponent(() => import('~/components/guide/GuideElevage.vue')),
  conformite: defineAsyncComponent(() => import('~/components/guide/GuideConformite.vue')),
  equipe: defineAsyncComponent(() => import('~/components/guide/GuideEquipe.vue')),
};

const activeComponent = computed(() => COMPONENTS[activeSection.value]);

const activeGateInfo = computed(() => {
  const s = SECTIONS.find((s) => s.id === activeSection.value);
  if (!s?.planFeature) return null;
  if (can(s.planFeature)) return null;
  return { planLabel: s.planLabel };
});

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

/* Barre de sections défilable sur mobile, sans scrollbar visible (style iOS). */
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
