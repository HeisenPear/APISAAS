<script setup lang="ts">
definePageMeta({ layout: 'default' });

const gating = useGating();
const hasAccess = computed(() => gating.can('previsionnelTresorerie'));

const soldeActuel = ref(0);
const horizon = ref(12);

const { data, pending, refresh } = useFetch('/api/finances/tresorerie', {
  key: 'tresorerie',
  query: { soldeActuel, horizon },
  lazy: true,
  immediate: false,
});

// Premier chargement uniquement quand l'accès est confirmé (évite un 402).
watch(hasAccess, (v) => v && refresh(), { immediate: true });

const labels = computed(() => data.value?.projection.map((p) => p.label) ?? []);
const entrees = computed(() => data.value?.projection.map((p) => p.entrees) ?? []);
const sorties = computed(() => data.value?.projection.map((p) => p.sorties) ?? []);
const solde = computed(() => data.value?.projection.map((p) => p.soldeCumule) ?? []);

const horizonOptions = [
  { label: '6 mois', value: 6 },
  { label: '12 mois', value: 12 },
  { label: '18 mois', value: 18 },
  { label: '24 mois', value: 24 },
];

function eur(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${Math.round(v).toLocaleString('fr-FR')} €`;
}

const confiance: Record<string, { label: string; color: string }> = {
  haute: { label: 'Fiable', color: 'var(--sage-deep)' },
  moyenne: { label: 'Moyenne', color: 'var(--honey-deep)' },
  faible: { label: 'Estimée', color: 'var(--text-tertiary)' },
};
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
          Prévisionnel de trésorerie
        </h1>
        <p class="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          Projection de votre solde sur les prochains mois, à partir de la saisonnalité de vos
          ventes et achats et de vos charges récurrentes.
        </p>
      </div>
    </div>

    <UiFeatureGate feature="previsionnelTresorerie" blur>
      <!-- Teaser flouté pour les plans inférieurs -->
      <template #preview>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 rounded-[14px] border border-[var(--border-default)] bg-white"
          />
          <div
            class="h-80 rounded-2xl border border-[var(--border-default)] bg-white sm:col-span-3"
          />
        </div>
      </template>

      <!-- Contenu réel (plans Pro+) -->
      <div class="space-y-6">
        <!-- Paramètres -->
        <div
          class="flex flex-col gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-5 sm:flex-row sm:items-end"
        >
          <UFormField label="Solde de trésorerie actuel" class="flex-1">
            <UInput v-model.number.lazy="soldeActuel" type="number" :step="100">
              <template #trailing><span class="text-[var(--text-tertiary)]">€</span></template>
            </UInput>
          </UFormField>
          <UFormField label="Horizon">
            <USelect
              v-model="horizon"
              :items="horizonOptions"
              value-key="value"
              label-key="label"
            />
          </UFormField>
          <UButton
            icon="i-lucide-refresh-cw"
            color="primary"
            variant="soft"
            :loading="pending"
            @click="refresh()"
          >
            Recalculer
          </UButton>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              Solde projeté à {{ horizon }} mois
            </p>
            <p
              class="mt-2 text-2xl font-semibold tabular-nums"
              :style="{
                color: (data?.soldeFinal ?? 0) >= 0 ? 'var(--text-primary)' : 'var(--clay-deep)',
              }"
            >
              {{ eur(data?.soldeFinal) }}
            </p>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              Point bas
            </p>
            <p
              class="mt-2 text-2xl font-semibold tabular-nums"
              :style="{
                color:
                  (data?.pointBas?.solde ?? 0) >= 0 ? 'var(--text-primary)' : 'var(--clay-deep)',
              }"
            >
              {{ eur(data?.pointBas?.solde) }}
            </p>
            <p v-if="data?.pointBas" class="mt-1 text-xs text-[var(--text-tertiary)]">
              en {{ data.pointBas.label }}
            </p>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              Mois en déficit
            </p>
            <p
              class="mt-2 text-2xl font-semibold tabular-nums"
              :style="{
                color: (data?.moisDeficit ?? 0) > 0 ? 'var(--clay-deep)' : 'var(--sage-deep)',
              }"
            >
              {{ data?.moisDeficit ?? 0 }}
            </p>
            <p class="mt-1 text-xs text-[var(--text-tertiary)]">solde sous zéro</p>
          </div>
        </div>

        <!-- Note de fiabilité -->
        <div
          v-if="data && !data.aHistorique"
          class="flex items-start gap-2 rounded-[12px] border border-[var(--border-default)] bg-[var(--honey-soft)] p-4"
        >
          <UIcon
            name="i-lucide-info"
            class="mt-0.5 h-4 w-4 shrink-0"
            style="color: var(--honey-deep)"
          />
          <p class="text-[13px] text-[var(--text-secondary)]">
            Projection basée sur vos charges récurrentes seules — ajoutez des ventes et des achats
            pour affiner la saisonnalité de votre trésorerie.
          </p>
        </div>

        <!-- Graphique -->
        <FinancesTresorerieChart
          v-if="data?.projection?.length"
          :labels="labels"
          :entrees="entrees"
          :sorties="sorties"
          :solde="solde"
        />

        <!-- Charges récurrentes -->
        <div v-if="data?.recurrents?.length" class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            Charges récurrentes prises en compte
          </p>
          <div
            class="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white"
          >
            <div
              v-for="(r, i) in data.recurrents"
              :key="i"
              class="flex items-center justify-between border-b border-[var(--border-faint)] px-5 py-3 last:border-0"
            >
              <span class="text-sm text-[var(--text-primary)]">{{ r.libelle }}</span>
              <span class="flex items-center gap-3 text-sm">
                <span
                  class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]"
                >
                  {{ r.intervalle }}
                </span>
                <span class="tabular-nums text-[var(--text-secondary)]">{{ eur(r.montant) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Détail mensuel -->
        <div v-if="data?.projection?.length" class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            Détail mensuel
          </p>
          <div
            class="overflow-x-auto rounded-[12px] border border-[var(--border-default)] bg-white"
          >
            <table class="w-full">
              <thead class="bg-[var(--surface-muted)]">
                <tr>
                  <th
                    class="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                  >
                    Mois
                  </th>
                  <th
                    class="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                  >
                    Entrées
                  </th>
                  <th
                    class="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                  >
                    Sorties
                  </th>
                  <th
                    class="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                  >
                    Solde
                  </th>
                  <th
                    class="hidden px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
                  >
                    Fiabilité
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-faint)]">
                <tr v-for="p in data.projection" :key="p.label">
                  <td class="px-4 py-2.5 text-sm text-[var(--text-primary)]">{{ p.label }}</td>
                  <td class="px-4 py-2.5 text-right text-sm tabular-nums text-[var(--sage-deep)]">
                    {{ eur(p.entrees) }}
                  </td>
                  <td
                    class="px-4 py-2.5 text-right text-sm tabular-nums text-[var(--text-secondary)]"
                  >
                    {{ eur(p.sorties) }}
                  </td>
                  <td
                    class="px-4 py-2.5 text-right text-sm font-medium tabular-nums"
                    :style="{
                      color: p.soldeCumule >= 0 ? 'var(--text-primary)' : 'var(--clay-deep)',
                    }"
                  >
                    {{ eur(p.soldeCumule) }}
                  </td>
                  <td class="hidden px-4 py-2.5 text-right sm:table-cell">
                    <span
                      class="text-[11px] font-semibold"
                      :style="{ color: confiance[p.confiance]!.color }"
                    >
                      {{ confiance[p.confiance]!.label }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UiFeatureGate>
  </div>
</template>
