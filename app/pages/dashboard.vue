<template>
  <div>
    <!-- Header -->
    <UiPageHeader :title="greeting" :description="todayDate">
      <template #actions>
        <UButton
          label="Nouvelle intervention"
          icon="i-lucide-plus"
          color="primary"
          to="/interventions/nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Loading state -->
    <div v-if="pending" class="space-y-6">
      <UiLoadingSkeleton variant="stat" :count="4" />
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="col-span-2 h-[340px] animate-pulse rounded-2xl bg-stone-100" />
        <div class="h-[340px] animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <!-- Dashboard content -->
    <template v-else-if="dashboard">
      <!-- KPIs -->
      <UiStatsGrid :stats="kpiStats" class="mb-6" />

      <!-- Charts row -->
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <DashboardProductionChart :data="dashboard.productionMensuelle" />
        </div>
        <DashboardSanteScore :data="dashboard.scoreSante" />
      </div>

      <!-- Bottom row -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <DashboardActivityFeed :activities="dashboard.activiteRecente" />
        </div>
        <div class="space-y-6">
          <DashboardMeteoWidget />
          <DashboardAlertsWidget :alertes="alertesList" />
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
const { dashboard, pending } = useDashboard();

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

const kpiStats = computed(() => {
  if (!dashboard.value) return [];
  const k = dashboard.value.kpis;
  return [
    {
      icon: 'i-lucide-box',
      value: k.ruchesActives,
      label: 'Ruches actives',
      suffix: ` / ${k.totalRuches}`,
    },
    {
      icon: 'i-lucide-droplets',
      value: Math.round(k.productionSaison * 10) / 10,
      label: 'Production saison',
      suffix: ' kg',
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
      label: 'Alertes actives',
    },
  ];
});

const alertesList = computed(() => {
  if (!dashboard.value || dashboard.value.kpis.alertesActives === 0) return [];
  return [
    {
      id: 'placeholder',
      type: 'info',
      titre: `${dashboard.value.kpis.alertesActives} alerte(s) en attente`,
      message: 'Consultez vos alertes pour plus de details',
      priorite: 'moyenne',
    },
  ];
});
</script>
