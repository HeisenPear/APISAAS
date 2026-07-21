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

    <!-- Votre progression — checklist de démarrage + guides interactifs, toujours visible -->
    <div class="rounded-2xl border border-[var(--border-default)] bg-white p-5 sm:p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Votre progression</p>
          <p class="text-[12.5px] text-[var(--text-tertiary)]">
            {{ tourCompletedCount }}/{{ ALL_TUTORIALS.length }} guides interactifs terminés
          </p>
        </div>
        <div class="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            class="h-full rounded-full bg-gradient-to-r from-[var(--honey)] to-[var(--honey-dark)] transition-all duration-700"
            :style="{ width: `${tourProgressPct}%` }"
          />
        </div>
      </div>

      <!-- Checklist de démarrage (données réelles du compte) -->
      <div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <NuxtLink
          v-for="s in onboardingSteps"
          :key="s.label"
          :to="s.to"
          class="group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-all duration-150"
          :class="
            s.done
              ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
              : 'border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:border-[var(--honey)]/40 hover:bg-[var(--honey-soft)] hover:text-[var(--honey-deep)]'
          "
        >
          <div
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            :class="
              s.done
                ? 'bg-emerald-500'
                : 'bg-white border border-[var(--border-default)] group-hover:border-[var(--honey)]/50'
            "
          >
            <UIcon v-if="s.done" name="i-lucide-check" class="h-3 w-3 text-white" />
            <UIcon
              v-else
              :name="s.icon"
              class="h-3 w-3 text-[var(--text-quaternary)] group-hover:text-[var(--honey)]"
            />
          </div>
          <span :class="s.done ? 'line-through opacity-60' : ''">{{ s.label }}</span>
        </NuxtLink>
      </div>

      <GuideTutorialPills />
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

    <!-- Launch interactive guide — consciente de l'état (terminé / à faire) -->
    <div
      class="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-5"
    >
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full"
        :class="isActiveTutorialDone ? 'bg-emerald-50' : 'bg-[var(--honey-soft)]'"
      >
        <UIcon
          :name="isActiveTutorialDone ? 'i-lucide-check-circle' : 'i-lucide-play-circle'"
          class="h-5 w-5"
          :class="isActiveTutorialDone ? 'text-emerald-600' : 'text-[var(--honey-deep)]'"
        />
      </div>
      <div class="flex-1">
        <p class="text-sm font-semibold text-[var(--text-primary)]">Guide interactif</p>
        <p class="text-xs text-[var(--text-secondary)]">
          {{
            activeSectionTutorial
              ? 'Lancez un guide pas-à-pas pour ce module'
              : 'Bientôt disponible pour cette section'
          }}
        </p>
      </div>
      <UButton
        :label="isActiveTutorialDone ? 'Revoir le guide' : 'Lancer le guide'"
        :icon="isActiveTutorialDone ? 'i-lucide-rotate-ccw' : 'i-lucide-play'"
        :variant="isActiveTutorialDone ? 'outline' : 'soft'"
        :color="isActiveTutorialDone ? 'success' : 'primary'"
        :disabled="!activeSectionTutorial"
        size="sm"
        @click="launchTutorialForSection"
      />
    </div>

    <!-- Voir aussi — toujours visible, indépendant de la section active -->
    <p class="text-center text-[12.5px] text-[var(--text-tertiary)]">
      Voir aussi :
      <NuxtLink to="/outils" class="font-medium text-[var(--honey-deep)] hover:underline"
        >Outils pratiques</NuxtLink
      >
      ·
      <NuxtLink to="/fonctionnalites" class="font-medium text-[var(--honey-deep)] hover:underline"
        >Fonctionnalités</NuxtLink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import GuideTutorialPills from '~/components/guide/GuideTutorialPills.vue';
import { ALL_TUTORIALS } from '~/config/tutorials';
import type { PlanFeatures } from '~/config/plans';

definePageMeta({ layout: 'default' });

const router = useRouter();
const route = useRoute();
const tutorial = useTutorial();
const { can } = useGating();
const { steps: onboardingSteps } = useOnboardingSteps();

type SectionId =
  | 'premiers-pas'
  | 'pilotage'
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
    tutorial: 'premiers_pas',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'pilotage',
    emoji: '🧭',
    label: 'Pilotage',
    tutorial: 'pilotage',
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
    tutorial: 'production',
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
    emoji: '🛡️',
    label: 'Conformité',
    tutorial: 'conformite',
    planFeature: null,
    planLabel: null,
  },
  {
    id: 'equipe',
    emoji: '👥',
    label: 'Équipe',
    tutorial: 'equipe',
    planFeature: 'multiUsers',
    planLabel: 'Pro',
  },
];

const initialSection = SECTIONS.some((s) => s.id === route.query.section)
  ? (route.query.section as SectionId)
  : 'premiers-pas';
const activeSection = ref<SectionId>(initialSection);

watch(activeSection, (value) => {
  router.replace({ query: { ...route.query, section: value } });
});

const COMPONENTS: Record<SectionId, ReturnType<typeof defineAsyncComponent>> = {
  'premiers-pas': defineAsyncComponent(() => import('~/components/guide/GuidePremiersPas.vue')),
  pilotage: defineAsyncComponent(() => import('~/components/guide/GuidePilotage.vue')),
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

const tourCompletedCount = computed(() => tutorial.completedTutorials.value.length);
const tourProgressPct = computed(() =>
  Math.round((tourCompletedCount.value / ALL_TUTORIALS.length) * 100),
);

const activeSectionTutorial = computed(() => {
  const section = SECTIONS.find((s) => s.id === activeSection.value);
  if (!section?.tutorial) return null;
  return ALL_TUTORIALS.find((t) => t.id === section.tutorial) ?? null;
});

const isActiveTutorialDone = computed(() =>
  activeSectionTutorial.value
    ? tutorial.completedTutorials.value.includes(activeSectionTutorial.value.id)
    : false,
);

async function launchTutorialForSection() {
  const tour = activeSectionTutorial.value;
  if (!tour) return;
  if (tour.route) {
    await router.push(tour.route);
  }
  setTimeout(() => tutorial.forceStart(tour), 400);
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
