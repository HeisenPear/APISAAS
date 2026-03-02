<template>
  <div>
    <!-- Hero greeting -->
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-stone-400">{{ todayDate }}</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          {{ greeting }}
        </h1>
      </div>
      <DashboardQuickActions />
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="space-y-6">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="h-80 animate-pulse rounded-2xl bg-stone-100" />
        <div class="h-80 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="dashboard">
      <!-- KPIs -->
      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UiKpiCard
          v-for="kpi in kpiStats"
          :key="kpi.label"
          :icon="kpi.icon"
          :value="kpi.value"
          :label="kpi.label"
          :trend="kpi.trend"
          :prefix="kpi.prefix"
          :suffix="kpi.suffix"
          :sparkline="kpi.sparkline"
        />
      </div>

      <!-- Production + Sante — toujours ouvertes, pas de déroulant -->
      <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardProductionChart :data="dashboard.productionMensuelle" />
        <DashboardSanteScore :data="dashboard.scoreSante" />
      </div>

      <!-- Cartes deroulantes — 2 colonnes flex independantes -->
      <div class="flex flex-col gap-4 lg:flex-row">
        <!-- Colonne gauche -->
        <div class="flex flex-1 flex-col gap-4">
          <DashboardActivityFeed :activities="dashboard.activiteRecente" />
          <DashboardMeteoWidget />
        </div>
        <!-- Colonne droite -->
        <div class="flex flex-1 flex-col gap-4">
          <DashboardUpcomingTasks />
          <DashboardAlertsWidget
            :alertes="alertesList"
            :total="dashboard?.kpis.alertesActives"
            @dismiss="handleDismissAlert"
          />
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <UiEmptyState
      v-else
      icon="i-lucide-layout-dashboard"
      title="Aucune donnee"
      description="Commencez par ajouter votre premier rucher et vos ruches"
      action-label="Ajouter un rucher"
      @action="navigateTo('/ruchers/new')"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const { dashboard, pending, refresh } = useDashboard();

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

const productionSparkline = computed(() => {
  if (!dashboard.value?.productionMensuelle) return undefined;
  const values = dashboard.value.productionMensuelle.map((d) => d.total);
  return values.some((v) => v > 0) ? values : undefined;
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
