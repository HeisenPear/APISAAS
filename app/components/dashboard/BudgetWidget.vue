<template>
  <div class="bg-white border border-[var(--border-default)] rounded-[14px] overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-[var(--border-default)]">
      <div class="flex items-center justify-between">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Équilibre financier
        </p>
        <NuxtLink
          to="/finances"
          class="text-[12px] font-medium hover:underline"
          style="color: var(--text-tertiary)"
        >
          Détail →
        </NuxtLink>
      </div>
      <p class="text-[12px] mt-0.5" style="color: var(--text-tertiary)">{{ currentYear }}</p>
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="p-5 space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-8 animate-pulse rounded-[8px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Content -->
    <div v-else-if="finances" class="p-5 space-y-3">
      <!-- Recettes -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-[var(--sage)]" />
          <span class="text-[13px]" style="color: var(--text-secondary)">Recettes</span>
        </div>
        <span class="text-[14px] font-semibold tabular-nums" style="color: var(--sage-deep)">
          +{{ formatCurrency(finances.ca) }}
        </span>
      </div>

      <!-- Dépenses -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-2 w-2 rounded-full bg-[var(--clay)]" />
          <span class="text-[13px]" style="color: var(--text-secondary)">Dépenses</span>
        </div>
        <span class="text-[14px] font-semibold tabular-nums" style="color: var(--clay-deep)">
          −{{ formatCurrency(finances.charges) }}
        </span>
      </div>

      <!-- Barre visuelle -->
      <div
        class="relative h-2 rounded-full overflow-hidden"
        style="background: var(--surface-muted)"
      >
        <div
          v-if="finances.ca > 0"
          class="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style="background: var(--sage)"
          :style="{ width: caWidth }"
        />
        <div
          v-if="finances.charges > 0"
          class="absolute top-0 h-full rounded-full transition-all duration-700"
          style="background: var(--clay)"
          :style="{ left: caWidth, width: chargesWidth }"
        />
      </div>

      <!-- Solde -->
      <div
        class="flex items-center justify-between rounded-[10px] px-4 py-2.5"
        :style="solde >= 0 ? 'background:var(--sage-soft)' : 'background:var(--clay-soft)'"
      >
        <span
          class="text-[13px] font-semibold"
          :style="solde >= 0 ? 'color:var(--sage-deep)' : 'color:var(--clay-deep)'"
        >
          Solde
        </span>
        <span
          class="text-[15px] font-bold tabular-nums"
          :style="solde >= 0 ? 'color:var(--sage-deep)' : 'color:var(--clay-deep)'"
        >
          {{ solde >= 0 ? '+' : '' }}{{ formatCurrency(solde) }}
        </span>
      </div>

      <!-- Coût/kg si disponible -->
      <div
        v-if="finances.coutParKg && finances.coutParKg > 0"
        class="flex items-center justify-between text-[12px]"
        style="color: var(--text-tertiary)"
      >
        <span>Coût de revient / kg miel</span>
        <span class="font-medium tabular-nums">{{ formatCurrency(finances.coutParKg) }}/kg</span>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="flex flex-col items-center gap-2 py-8 text-center">
      <UIcon name="i-lucide-wallet" class="h-6 w-6" style="color: var(--text-tertiary)" />
      <p class="text-[12.5px]" style="color: var(--text-tertiary)">
        Aucune transaction cette année
      </p>
      <NuxtLink
        to="/finances"
        class="text-[12px] font-medium hover:underline"
        style="color: var(--honey-deep)"
      >
        Enregistrer une vente →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FinancesDashboard {
  ca: number;
  charges: number;
  resultat: number;
  coutParKg: number | null;
}

const currentYear = new Date().getFullYear();

const { data: raw, pending } = useFetch<{ data: FinancesDashboard }>('/api/finances/dashboard', {
  key: 'dashboard-budget-widget',
  lazy: true,
});

const finances = computed(() => raw.value?.data ?? null);
const solde = computed(() => (finances.value ? finances.value.ca - finances.value.charges : 0));

const total = computed(() => {
  if (!finances.value) return 0;
  return finances.value.ca + finances.value.charges;
});

const caWidth = computed(() => {
  if (!finances.value || total.value === 0) return '0%';
  return `${Math.round((finances.value.ca / total.value) * 100)}%`;
});

const chargesWidth = computed(() => {
  if (!finances.value || total.value === 0) return '0%';
  return `${Math.round((finances.value.charges / total.value) * 100)}%`;
});

function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v);
}
</script>
