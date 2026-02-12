<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Production" description="Suivi de vos recoltes et production de miel">
      <template #actions>
        <UButton
          label="Nouvelle recolte"
          icon="i-lucide-plus"
          color="primary"
          to="/production/recoltes?action=nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="loading" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="4" />
    </div>

    <template v-else-if="stats">
      <!-- KPIs -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UiKpiCard
          label="Production saison"
          :value="stats.saison.totalKg"
          suffix=" kg"
          icon="i-lucide-droplets"
        />
        <UiKpiCard
          label="Recoltes"
          :value="stats.saison.nombreRecoltes"
          icon="i-lucide-calendar-check"
        />
        <UiKpiCard label="Lots traces" :value="stats.saison.nombreLots" icon="i-lucide-package" />
        <UiKpiCard
          label="Evolution N/N-1"
          :value="stats.comparaison.evolutionPourcent ?? 0"
          suffix="%"
          :icon="evolutionIcon"
        />
      </div>

      <!-- Year selector -->
      <div class="mt-6 flex items-center gap-3">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="annee--"
        />
        <span class="text-sm font-semibold text-stone-700">{{ annee }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="annee >= currentYear"
          @click="annee++"
        />
      </div>

      <!-- Charts row -->
      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Production mensuelle -->
        <ProductionProductionChart
          title="Production mensuelle"
          type="monthly"
          :chart-data="monthlyData"
        />

        <!-- Repartition par type de miel -->
        <ProductionProductionChart
          title="Repartition par type de miel"
          type="donut"
          :chart-data="typeMielData"
        />
      </div>

      <!-- Production par rucher -->
      <div class="mt-6">
        <ProductionProductionChart
          title="Production par rucher"
          type="bar"
          :chart-data="rucherData"
        />
      </div>

      <!-- Quick links -->
      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          to="/production/recoltes"
          class="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <UIcon name="i-lucide-list" class="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">Toutes les recoltes</p>
            <p class="text-sm text-stone-400">Historique complet</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/production/tracabilite"
          class="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
            <UIcon name="i-lucide-package" class="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">Tracabilite des lots</p>
            <p class="text-sm text-stone-400">Suivi par numero de lot</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/stocks"
          class="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <UIcon name="i-lucide-warehouse" class="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p class="font-semibold text-stone-900">Gestion des stocks</p>
            <p class="text-sm text-stone-400">Inventaire et mouvements</p>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ProductionStats } from '~/composables/useProduction';
import type { ChartDataItem } from '~/components/production/ProductionChart.vue';

definePageMeta({ layout: 'default' });

const currentYear = new Date().getFullYear();
const annee = ref(currentYear);

const { getStats } = useProduction();

const stats = ref<ProductionStats | null>(null);
const loading = ref(true);

const moisLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aou',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

async function loadStats() {
  loading.value = true;
  try {
    stats.value = await getStats(annee.value);
  } catch {
    stats.value = null;
  } finally {
    loading.value = false;
  }
}

watch(annee, () => loadStats());
onMounted(() => loadStats());

const evolutionIcon = computed(() => {
  if (!stats.value?.comparaison.evolutionPourcent) return 'i-lucide-minus';
  return stats.value.comparaison.evolutionPourcent >= 0
    ? 'i-lucide-trending-up'
    : 'i-lucide-trending-down';
});

const monthlyData = computed<ChartDataItem[]>(() => {
  if (!stats.value) return [];
  const maxKg = Math.max(...stats.value.parMois.map((m) => m.totalKg), 1);
  // Fill all 12 months
  return moisLabels.map((label, i) => {
    const moisData = stats.value!.parMois.find((m) => m.mois === i + 1);
    const value = moisData?.totalKg ?? 0;
    return {
      label,
      value,
      percent: (value / maxKg) * 100,
    };
  });
});

const typeMielData = computed<ChartDataItem[]>(() => {
  if (!stats.value) return [];
  const totalKg = stats.value.parTypeMiel.reduce((sum, t) => sum + t.totalKg, 0) || 1;
  return stats.value.parTypeMiel.map((t) => ({
    label: t.typeMiel,
    value: t.totalKg,
    percent: (t.totalKg / totalKg) * 100,
  }));
});

const rucherData = computed<ChartDataItem[]>(() => {
  if (!stats.value) return [];
  const maxKg = Math.max(...stats.value.parRucher.map((r) => r.totalKg), 1);
  return stats.value.parRucher.map((r) => ({
    label: r.rucherNom ?? 'Non assigne',
    value: r.totalKg,
    percent: (r.totalKg / maxKg) * 100,
  }));
});
</script>
