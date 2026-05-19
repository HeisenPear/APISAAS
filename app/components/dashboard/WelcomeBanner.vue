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

const dismissedSession = ref(false);
const isConfirmingDismiss = ref(false);

const show = computed(() => {
  if (tutorial.bannerDismissed.value) return false;
  if (dismissedSession.value) return false;
  if (!authStore.profil?.onboardingComplete) return true;
  return daysSince.value <= 30;
});

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
const progressPct = computed(() => Math.round((completedCount.value / totalSteps.value) * 100));

function handleClose() {
  isConfirmingDismiss.value = true;
}

function dismissSession() {
  dismissedSession.value = true;
  isConfirmingDismiss.value = false;
}

async function dismissForever() {
  await tutorial.dismissBanner();
  isConfirmingDismiss.value = false;
}

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

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    leave-active-class="transition-all duration-200 ease-in"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div v-if="show" class="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-sm">
      <!-- Gradient top bar -->
      <div class="h-[3px] w-full bg-gradient-to-r from-[var(--honey)] via-[var(--honey-dark)] to-[var(--clay)]" />

      <div class="p-5">
        <!-- Header -->
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--honey-soft)]">
              <UIcon name="i-lucide-bee" class="h-5 w-5 text-[var(--honey-deep)]" />
            </div>
            <div>
              <h3 class="text-[15px] font-semibold text-[var(--text-primary)]">
                Bienvenue sur APIGO
              </h3>
              <p class="text-[12.5px] text-[var(--text-tertiary)]">
                {{ completedCount }}/{{ totalSteps }} étapes — encore
                {{ totalSteps - completedCount }} action{{ totalSteps - completedCount > 1 ? 's' : '' }} pour démarrer
              </p>
            </div>
          </div>

          <!-- Confirm dismiss or X -->
          <div v-if="isConfirmingDismiss" class="flex shrink-0 items-center gap-2">
            <span class="text-[11.5px] text-[var(--text-tertiary)]">Masquer :</span>
            <button
              type="button"
              class="rounded-lg border border-[var(--border-default)] px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
              @click="dismissSession"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11.5px] font-medium text-red-600 transition hover:bg-red-100"
              @click="dismissForever"
            >
              Ne plus afficher
            </button>
            <button
              type="button"
              class="ml-1 rounded-lg p-1.5 text-[var(--text-quaternary)] transition hover:text-[var(--text-secondary)]"
              @click="isConfirmingDismiss = false"
            >
              <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            v-else
            type="button"
            class="rounded-lg p-1.5 text-[var(--text-quaternary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
            @click="handleClose"
          >
            <UIcon name="i-lucide-x" class="h-4 w-4" />
          </button>
        </div>

        <!-- Progress bar -->
        <div class="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            class="h-full rounded-full bg-gradient-to-r from-[var(--honey)] to-[var(--honey-dark)] transition-all duration-700"
            :style="{ width: `${progressPct}%` }"
          />
        </div>

        <!-- Steps grid -->
        <div class="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <NuxtLink
            v-for="s in steps"
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
              :class="s.done ? 'bg-emerald-500' : 'bg-white border border-[var(--border-default)] group-hover:border-[var(--honey)]/50'"
            >
              <UIcon
                v-if="s.done"
                name="i-lucide-check"
                class="h-3 w-3 text-white"
              />
              <UIcon
                v-else
                :name="s.icon"
                class="h-3 w-3 text-[var(--text-quaternary)] group-hover:text-[var(--honey)]"
              />
            </div>
            <span :class="s.done ? 'line-through opacity-60' : ''">{{ s.label }}</span>
          </NuxtLink>
        </div>

        <!-- Interactive guides section -->
        <div class="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3">
          <div class="mb-2.5 flex items-center gap-2">
            <UIcon name="i-lucide-play-circle" class="h-3.5 w-3.5 text-[var(--honey-deep)]" />
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]">Guides interactifs pas à pas</p>
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
                :name="tutorial.completedTutorials.value.includes(tour.id) ? 'i-lucide-check-circle' : 'i-lucide-play'"
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
      </div>
    </div>
  </Transition>
</template>
