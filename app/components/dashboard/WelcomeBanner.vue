<script setup lang="ts">
import { ALL_TUTORIALS } from '~/config/tutorials';

const authStore = useAuthStore();
const { dashboard } = useDashboard();
const router = useRouter();
const tutorial = useTutorial();
const notifications = useNotifications();

const daysSince = computed(() => {
  if (!authStore.profil?.createdAt) return 999;
  return Math.floor((Date.now() - new Date(authStore.profil.createdAt).getTime()) / 86_400_000);
});

const show = computed(() => {
  if (!authStore.profil?.onboardingComplete) return true;
  return daysSince.value <= 30;
});

const dismissed = ref(false);

const profilApicole = computed(() => {
  const prefs = authStore.profil?.preferences as Record<string, unknown> | undefined;
  return (prefs?.profilApicole as string | undefined) ?? 'loisir';
});

const isPro = computed(() => ['professionnel', 'pluri_actif'].includes(profilApicole.value));

const hasRucher = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
const hasRuches = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
const hasIntervention = computed(() => (dashboard.value?.activiteRecente?.length ?? 0) > 0);

const steps = computed(() => {
  const base = [
    { label: 'Profil configuré', done: true, to: '/parametres', icon: 'i-lucide-user-check' },
    { label: 'Créer un rucher', done: hasRucher.value, to: '/ruchers', icon: 'i-lucide-map-pin' },
    { label: 'Ajouter vos ruches', done: hasRuches.value, to: '/ruches', icon: 'i-lucide-hexagon' },
    { label: 'Première intervention', done: hasIntervention.value, to: '/interventions/nouvelle', icon: 'i-lucide-clipboard-check' },
  ];
  if (isPro.value) {
    base.push({ label: 'Créer un client', done: false, to: '/clients', icon: 'i-lucide-users' });
  }
  return base;
});

const completedCount = computed(() => steps.value.filter((s) => s.done).length);
const totalSteps = computed(() => steps.value.length);

async function launchTutorial(tour: (typeof ALL_TUTORIALS)[number]) {
  if (tour.route) {
    await router.push(tour.route);
  }
  setTimeout(() => tutorial.startTutorial(tour), 400);
}

async function dismissAllGuides() {
  await tutorial.skipAllTutorials();
  notifications.success('Guides interactifs masqués');
}
</script>

<template>
  <div v-if="show && !dismissed" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <!-- Header -->
    <div class="mb-4 flex items-start justify-between">
      <div>
        <h3 class="text-base font-semibold text-stone-800">Bienvenue sur APIGO ! 🐝</h3>
        <p class="mt-0.5 text-sm text-stone-500">
          {{ completedCount }}/{{ totalSteps }} étapes complétées — démarrez en moins de 5 min
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg p-1 text-stone-400 transition-colors hover:bg-amber-100 hover:text-stone-600"
        @click="dismissed = true"
      >
        <UIcon name="i-lucide-x" class="h-4 w-4" />
      </button>
    </div>

    <!-- Progress bar -->
    <div class="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
      <div
        class="h-full rounded-full bg-[var(--honey)] transition-all duration-500"
        :style="{ width: `${(completedCount / totalSteps) * 100}%` }"
      />
    </div>

    <!-- Steps checklist -->
    <div class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="s in steps"
        :key="s.label"
        :to="s.to"
        class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-150"
        :class="
          s.done
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-white text-stone-600 shadow-sm hover:bg-amber-100 hover:text-stone-800'
        "
      >
        <UIcon
          :name="s.done ? 'i-lucide-check-circle' : s.icon"
          class="h-4 w-4 shrink-0"
          :class="s.done ? 'text-emerald-500' : 'text-amber-500'"
        />
        <span :class="s.done ? 'line-through opacity-60' : 'font-medium'">{{ s.label }}</span>
      </NuxtLink>
    </div>

    <!-- Interactive guides section -->
    <div class="mt-5 border-t border-amber-100 pt-4">
      <p class="mb-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Guides interactifs</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tour in ALL_TUTORIALS"
          :key="tour.id"
          type="button"
          class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150"
          :class="
            tutorial.completedTutorials.value.includes(tour.id)
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              : 'bg-[var(--honey-soft)] text-[var(--honey-deep)] hover:bg-amber-100'
          "
          @click="launchTutorial(tour)"
        >
          <UIcon
            :name="tutorial.completedTutorials.value.includes(tour.id) ? 'i-lucide-check' : 'i-lucide-play'"
            class="h-3 w-3"
          />
          {{ tour.name }}
        </button>
      </div>
      <button
        type="button"
        class="mt-2 text-xs text-stone-400 underline underline-offset-2 hover:text-stone-500"
        @click="dismissAllGuides"
      >
        Masquer tous les guides
      </button>
    </div>

    <!-- Footer hint -->
    <p class="mt-3 text-xs text-stone-400">Ce panneau disparaît automatiquement après 30 jours</p>
  </div>
</template>
