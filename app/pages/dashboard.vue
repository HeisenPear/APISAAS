<template>
  <div class="space-y-4 sm:space-y-8">
    <!-- Pull-to-refresh indicator -->
    <div
      v-if="pullDistance > 0"
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-[var(--surface-card)] border-b border-[var(--border-default)]"
      :style="{ transform: `translateY(${Math.max(-100 + pullDistance, -100)}%)` }"
    >
      <div class="flex items-center gap-2 text-[var(--text-secondary)]">
        <UIcon name="i-lucide-refresh-ccw" :class="{ 'animate-spin': pulling }" />
        <span>{{ pulling ? 'Actualisation...' : 'Tirer pour actualiser' }}</span>
      </div>
    </div>

    <!-- Banners -->
    <DashboardWelcomeBanner />
    <DeclarationsNapiReminderBanner />
    <DashboardTourneeCard />

    <!-- Hero greeting -->
    <div>
      <h1
        class="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] leading-tight"
        style="
          font-family:
            'SF Pro Display',
            -apple-system,
            system-ui,
            sans-serif;
        "
      >
        {{ greeting }}
      </h1>
      <p class="mt-2 text-[14.5px] text-[var(--text-secondary)] max-w-[580px] leading-[1.55]">
        {{ todayDate
        }}<template v-if="kpiStats[0]?.value">
          · {{ kpiStats[0].value }} ruches surveillées</template
        >
      </p>
    </div>

    <!-- Brief du jour de Maya (proactif) -->
    <DashboardMayaCard />

    <!-- Bilan du soir (moment humain) — Maya célèbre la journée et veille la nuit -->
    <IaMayaRecap
      v-if="estSoir && dashboard"
      :interventions="activiteJour"
      :prenom="authStore.profil?.prenom ?? ''"
    />

    <!-- Loading skeleton -->
    <div v-if="pending" class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-28 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-7">
        <div class="h-80 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        <div class="h-80 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="dashboard">
      <!-- Mobile KPI strip (3 cols, hairlines) -->
      <div class="lg:hidden mm-bleed mm-strip">
        <div class="mm-strip-cell">
          <span class="mm-strip-label">Ruches</span>
          <span class="mm-strip-value">{{ kpiStats[0]?.value ?? 0 }}</span>
          <span class="mm-strip-sub">/ {{ dashboard.kpis.totalRuches }} total</span>
        </div>
        <div class="mm-strip-cell">
          <span class="mm-strip-label">Production</span>
          <span class="mm-strip-value"
            >{{ kpiStats[1]?.value ?? 0
            }}<span style="font-size: 12px; font-weight: 500; color: #6b7280"> kg</span></span
          >
          <span class="mm-strip-sub">Saison en cours</span>
        </div>
        <div class="mm-strip-cell">
          <span class="mm-strip-label">Alertes</span>
          <span
            class="mm-strip-value"
            :style="(kpiStats[3]?.value ?? 0) > 0 ? 'color:var(--status-warn)' : ''"
            >{{ kpiStats[3]?.value ?? 0 }}</span
          >
          <NuxtLink to="/alertes" class="mm-strip-sub" style="color: var(--honey-deep)"
            >Voir →</NuxtLink
          >
        </div>
      </div>

      <!-- Desktop KPI grid (4 cards) -->
      <div class="hidden lg:grid grid-cols-2 gap-4" data-tutorial="dashboard-kpis">
        <!-- Ruches -->
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-3.5 sm:p-5">
          <p
            class="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-semibold"
          >
            Ruches
          </p>
          <p
            class="text-[20px] sm:text-[24px] lg:text-[28px] font-semibold tracking-[-0.025em] mt-1.5 sm:mt-2"
            style="
              font-family:
                'SF Pro Display',
                -apple-system,
                system-ui,
                sans-serif;
            "
          >
            {{ kpiStats[0]?.value ?? 0 }}
          </p>
          <p class="text-[11px] sm:text-[12px] text-[var(--text-tertiary)] mt-1">
            <span>/ {{ dashboard.kpis.totalRuches }} total</span>
          </p>
        </div>
        <!-- Production -->
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-3.5 sm:p-5">
          <p
            class="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-semibold"
          >
            Production
          </p>
          <p
            class="text-[20px] sm:text-[24px] lg:text-[28px] font-semibold tracking-[-0.025em] mt-1.5 sm:mt-2"
            style="
              font-family:
                'SF Pro Display',
                -apple-system,
                system-ui,
                sans-serif;
            "
          >
            {{ kpiStats[1]?.value ?? 0
            }}<span class="text-[13px] lg:text-[16px] font-medium text-[var(--text-tertiary)]">
              kg</span
            >
          </p>
          <p class="text-[11px] sm:text-[12px] text-[var(--text-tertiary)] mt-1">
            <span style="color: var(--sage-deep)">Saison en cours</span>
          </p>
        </div>
        <!-- CA -->
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-3.5 sm:p-5">
          <p
            class="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-semibold"
          >
            Chiffre d'affaires
          </p>
          <p
            class="text-[20px] sm:text-[24px] lg:text-[28px] font-semibold tracking-[-0.025em] mt-1.5 sm:mt-2"
            style="
              font-family:
                'SF Pro Display',
                -apple-system,
                system-ui,
                sans-serif;
            "
          >
            {{ kpiStats[2]?.value ?? 0
            }}<span class="text-[13px] lg:text-[16px] font-medium text-[var(--text-tertiary)]">
              €</span
            >
          </p>
          <p class="text-[11px] sm:text-[12px] text-[var(--text-tertiary)] mt-1">Cette année</p>
        </div>
        <!-- Alertes -->
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-3.5 sm:p-5">
          <p
            class="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-semibold"
          >
            Alertes
          </p>
          <p
            class="text-[20px] sm:text-[24px] lg:text-[28px] font-semibold tracking-[-0.025em] mt-1.5 sm:mt-2"
            :style="{
              color: (kpiStats[3]?.value ?? 0) > 0 ? 'var(--status-warn)' : undefined,
              fontFamily: '\'SF Pro Display\', -apple-system, system-ui, sans-serif',
            }"
          >
            {{ kpiStats[3]?.value ?? 0 }}
          </p>
          <p class="text-[11px] sm:text-[12px] text-[var(--text-tertiary)] mt-1">
            <NuxtLink to="/alertes" class="hover:underline">Voir les alertes →</NuxtLink>
          </p>
        </div>
      </div>

      <!-- Two columns -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-7">
        <!-- Left column -->
        <div class="space-y-9">
          <!-- 01 — Production -->
          <div>
            <div
              class="hidden lg:block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
              style="color: var(--honey-deep)"
            >
              01 — Production
            </div>
            <div class="mm-sect lg:hidden">
              <span class="mm-sect-t">Production</span>
              <NuxtLink to="/production" class="mm-sect-a">Voir détail →</NuxtLink>
            </div>
            <div class="hidden lg:flex items-end justify-between">
              <h2
                class="text-[18px] font-semibold tracking-[-0.015em]"
                style="
                  font-family:
                    'SF Pro Display',
                    -apple-system,
                    system-ui,
                    sans-serif;
                "
              >
                Récolte par mois
              </h2>
              <NuxtLink
                to="/production"
                class="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >Voir détail →</NuxtLink
              >
            </div>
            <div
              class="mt-0 lg:mt-4 bg-white lg:border lg:border-[var(--border-default)] lg:rounded-[14px] lg:p-5"
            >
              <DashboardProductionChart :data="dashboard.productionMensuelle" />
            </div>
          </div>

          <!-- 02 — Ruchers (desktop only) -->
          <div class="hidden lg:block">
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
              style="color: var(--honey-deep)"
            >
              02 — Ruchers
            </div>
            <div class="flex items-end justify-between">
              <h2
                class="text-[18px] font-semibold tracking-[-0.015em]"
                style="
                  font-family:
                    'SF Pro Display',
                    -apple-system,
                    system-ui,
                    sans-serif;
                "
              >
                Vos ruchers
              </h2>
              <NuxtLink
                to="/ruchers"
                class="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >Tout voir →</NuxtLink
              >
            </div>
            <DashboardSanteScore :data="dashboard.scoreSante" class="mt-4" />
          </div>
        </div>

        <!-- Right column -->
        <div class="space-y-9">
          <!-- Agenda -->
          <div>
            <div
              class="hidden lg:block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
              style="color: var(--honey-deep)"
            >
              Aujourd'hui
            </div>
            <div class="mm-sect lg:hidden">
              <span class="mm-sect-t">Agenda du {{ todayDateShort }}</span>
            </div>
            <h2
              class="hidden lg:block text-[18px] font-semibold tracking-[-0.015em]"
              style="
                font-family:
                  'SF Pro Display',
                  -apple-system,
                  system-ui,
                  sans-serif;
              "
            >
              Agenda du {{ todayDateShort }}
            </h2>
            <div
              class="mt-0 lg:mt-4 bg-white lg:border lg:border-[var(--border-default)] lg:rounded-[14px] overflow-hidden"
            >
              <DashboardUpcomingTasks />
            </div>
          </div>

          <!-- Alertes -->
          <div>
            <div
              class="hidden lg:block text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
              style="color: var(--honey-deep)"
            >
              Alertes
            </div>
            <div class="mm-sect lg:hidden">
              <span class="mm-sect-t">Alertes à traiter</span>
              <NuxtLink to="/alertes" class="mm-sect-a">Tout voir →</NuxtLink>
            </div>
            <div class="hidden lg:flex items-end justify-between">
              <h2
                class="text-[18px] font-semibold tracking-[-0.015em]"
                style="
                  font-family:
                    'SF Pro Display',
                    -apple-system,
                    system-ui,
                    sans-serif;
                "
              >
                À traiter
              </h2>
              <NuxtLink
                to="/alertes"
                class="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >Tout voir →</NuxtLink
              >
            </div>
            <div
              class="mt-0 lg:mt-4 bg-white lg:border lg:border-[var(--border-default)] lg:rounded-[14px] overflow-hidden"
            >
              <DashboardAlertsWidget
                :alertes="alertesList"
                :total="dashboard?.kpis.alertesActives"
                @dismiss="handleDismissAlert"
              />
            </div>
          </div>

          <!-- Budget (desktop only) -->
          <div class="hidden lg:block">
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
              style="color: var(--honey-deep)"
            >
              Finances
            </div>
            <h2
              class="text-[18px] font-semibold tracking-[-0.015em] mb-4"
              style="
                font-family:
                  'SF Pro Display',
                  -apple-system,
                  system-ui,
                  sans-serif;
              "
            >
              Équilibre budgétaire
            </h2>
            <DashboardBudgetWidget />
          </div>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      icon="i-lucide-layout-dashboard"
      title="Aucune donnée"
      description="Commencez par ajouter votre premier rucher et vos ruches"
      benefit="Suivez la santé de vos colonies en continu"
      action-label="Ajouter un rucher"
      @action="navigateTo('/ruchers/nouveau')"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const { dashboard, pending, refresh } = useDashboard();
const pullToRefresh = usePullToRefresh(refresh);
const { pulling = ref(false), pullDistance = ref(0) } = pullToRefresh || {};

const greeting = computed(() => {
  const prenom = authStore.profil?.prenom;
  const hour = new Date().getHours();
  let salutation = 'Bonjour';
  if (hour >= 18) salutation = 'Bonsoir';
  return prenom ? `${salutation}, ${prenom}` : salutation;
});

const todayDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const todayDateShort = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
});

const productionSparkline = computed(() => {
  if (!dashboard.value?.productionMensuelle) return undefined;
  const values = dashboard.value.productionMensuelle.map((d) => d.total);
  return values.some((v) => v > 0) ? values : undefined;
});

// Bilan du soir : à partir de 18 h, on compte l'activité du jour.
const estSoir = computed(() => new Date().getHours() >= 18);
const activiteJour = computed(() => {
  const items = (dashboard.value?.activiteRecente ?? []) as Array<{ date: string | Date }>;
  const auj = new Date().toDateString();
  return items.filter((a) => new Date(a.date).toDateString() === auj).length;
});

interface KpiItem {
  icon: string;
  value: number;
  label: string;
  trend?: number;
  prefix?: string;
  suffix?: string;
  sparkline?: number[];
}

const kpiStats = computed<KpiItem[]>(() => {
  if (!dashboard.value) return [];
  const k = dashboard.value.kpis;
  return [
    {
      icon: 'i-lucide-box',
      value: k.ruchesActives,
      label: 'Ruches',
      suffix: ` / ${k.totalRuches}`,
    },
    {
      icon: 'i-lucide-droplets',
      value: Math.round(k.productionSaison * 10) / 10,
      label: 'Production',
      suffix: ' kg',
      sparkline: productionSparkline.value,
    },
    {
      icon: 'i-lucide-wallet',
      value: Math.round(k.caTotal),
      label: "Chiffre d'affaires",
      suffix: ' €',
    },
    {
      icon: 'i-lucide-bell-ring',
      value: k.alertesActives,
      label: 'Alertes',
    },
  ];
});

const alertesList = computed(() => dashboard.value?.alertesRecentes ?? []);

async function handleDismissAlert(id: string) {
  try {
    await $fetch(`/api/alertes/${id}`, {
      method: 'PUT',
      body: { lue: true },
    });
    await refresh();
  } catch {
    // Silently fail
  }
}
</script>
