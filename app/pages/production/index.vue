<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h1
          class="font-display text-[26px] font-semibold tracking-tight text-[var(--text-primary)]"
        >
          Production
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Suivi de votre production et traçabilité réglementaire
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Year selector -->
        <div
          class="flex items-center gap-1 rounded-[8px] border border-[var(--border-default)] bg-white px-2 py-1.5"
        >
          <button
            class="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            @click="annee--"
          >
            <UIcon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />
          </button>
          <span class="px-1 text-[13px] font-semibold text-[var(--text-primary)]">{{ annee }}</span>
          <button
            class="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
            :disabled="annee >= currentYear"
            @click="annee++"
          >
            <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
          </button>
        </div>
        <NuxtLink
          to="/production/recoltes?action=nouvelle"
          class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Nouvelle récolte
        </NuxtLink>
      </div>
    </div>

    <UiFeatureGate feature="production" blur>
      <template #preview>
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="i in 4" :key="i" class="h-24 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
          <div class="h-48 rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
      </template>

      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="i in 4"
            :key="i"
            class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
          />
        </div>
        <div class="h-64 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="!stats"
        icon="i-lucide-droplets"
        title="La saison commence ici 🍯"
        description="Enregistrez votre première récolte et je suis votre production miellée par miellée, jusqu'à la traçabilité."
        action-label="Nouvelle récolte"
        @action="navigateTo('/production/recoltes?action=nouvelle')"
      />

      <template v-else>
        <!-- 01 — Saison en cours -->
        <div class="mb-8">
          <p
            class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            01 — Saison en cours
          </p>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <!-- Total kg -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide"
              >
                Total récolté
              </p>
              <p
                class="mt-2 text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]"
              >
                {{ stats.saison.totalKg
                }}<span class="ml-1 text-[16px] font-normal text-[var(--text-tertiary)]">kg</span>
              </p>
            </div>
            <!-- Nb récoltes -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide"
              >
                Récoltes
              </p>
              <p
                class="mt-2 text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]"
              >
                {{ stats.saison.nombreRecoltes }}
              </p>
            </div>
            <!-- Moy/ruche -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide"
              >
                Moy. / ruche
              </p>
              <p
                class="mt-2 text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]"
              >
                {{ moyParRuche
                }}<span class="ml-1 text-[16px] font-normal text-[var(--text-tertiary)]">kg</span>
              </p>
            </div>
            <!-- Évolution N/N-1 -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p
                class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide"
              >
                Évolution N/N-1
              </p>
              <p
                class="mt-2 text-[28px] font-bold leading-none tracking-tight"
                :class="
                  (stats.comparaison.evolutionPourcent ?? 0) >= 0
                    ? 'text-[var(--status-good)]'
                    : 'text-[var(--status-bad)]'
                "
              >
                {{ (stats.comparaison.evolutionPourcent ?? 0) >= 0 ? '+' : ''
                }}{{ stats.comparaison.evolutionPourcent ?? 0
                }}<span class="ml-0.5 text-[16px] font-normal">%</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 02 — Évolution mensuelle -->
        <div class="mb-8">
          <p
            class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            02 — Évolution mensuelle
          </p>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ProductionChart
                title="Production mensuelle"
                type="monthly"
                :chart-data="monthlyData"
              />
              <ProductionChart
                title="Répartition par type de miel"
                type="donut"
                :chart-data="typeMielData"
              />
            </div>
            <ProductionChart title="Production par rucher" type="bar" :chart-data="rucherData" />
          </div>
        </div>

        <!-- 03 — Récoltes récentes -->
        <div class="mb-8">
          <div class="mb-4 flex items-center justify-between">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              03 — Récoltes récentes
            </p>
            <NuxtLink
              to="/production/recoltes"
              class="text-[12px] font-medium text-[var(--honey-deep)] hover:underline"
            >
              Voir tout →
            </NuxtLink>
          </div>
          <div
            v-if="stats.parRucher.length === 0"
            class="bg-white border border-[var(--border-default)] rounded-[14px] p-8 text-center text-[13px] text-[var(--text-tertiary)]"
          >
            Pas encore de récolte cette année — elle apparaîtra ici dès la première miellée.
          </div>
          <div
            v-else
            class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
          >
            <table class="w-full">
              <thead>
                <tr class="bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
                  <th
                    class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Rucher
                  </th>
                  <th
                    class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Total kg
                  </th>
                  <th
                    class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Récoltes
                  </th>
                  <th
                    class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-faint)]">
                <tr
                  v-for="rucher in stats.parRucher"
                  :key="rucher.rucherNom ?? 'na'"
                  class="transition-colors hover:bg-[var(--surface-muted)]/40"
                >
                  <td class="px-4 py-3">
                    <span class="text-[13px] font-medium text-[var(--text-primary)]">{{
                      rucher.rucherNom ?? 'Non assigné'
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-[13px] font-semibold text-[var(--text-primary)]"
                      >{{ rucher.totalKg }} kg</span
                    >
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-[13px] text-[var(--text-secondary)]">{{
                      rucher.nombreRecoltes
                    }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <NuxtLink
                      to="/production/recoltes"
                      class="text-[12px] font-medium text-[var(--honey-deep)] hover:underline"
                    >
                      Voir →
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Traçabilité CTA -->
        <NuxtLink
          to="/production/tracabilite"
          class="flex items-center gap-4 rounded-[14px] border border-[var(--honey-soft)] bg-[var(--honey-soft)] p-5 transition-all hover:border-[var(--honey)] hover:shadow-sm"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--honey)]">
            <UIcon name="i-lucide-package" class="h-5 w-5 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-[14px] font-semibold text-[var(--text-primary)]">Traçabilité des lots</p>
            <p class="text-[12.5px] text-[var(--text-secondary)]">
              Cahier de miellerie numérique — conformité réglementaire
            </p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-[var(--honey-deep)]" />
        </NuxtLink>
      </template>
    </UiFeatureGate>
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

const moyParRuche = computed(() => {
  if (!stats.value) return 0;
  const nbRuchers = stats.value.parRucher.length;
  if (nbRuchers === 0) return 0;
  return (stats.value.saison.totalKg / nbRuchers).toFixed(1);
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
