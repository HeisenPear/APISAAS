<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="mb-4 text-sm font-semibold text-stone-900">Indicateurs de rentabilite</h3>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl bg-stone-50 p-4">
        <p class="text-xs text-stone-500">Rentabilite / ruche</p>
        <p
          class="mt-1 text-xl font-bold"
          :class="rentabiliteParRuche >= 0 ? 'text-amber-600' : 'text-red-600'"
        >
          {{ formatMoney(rentabiliteParRuche) }}
        </p>
      </div>
      <div class="rounded-xl bg-stone-50 p-4">
        <p class="text-xs text-stone-500">Cout / kg miel</p>
        <p class="mt-1 text-xl font-bold text-stone-900">{{ formatMoney(coutParKg) }}</p>
      </div>
      <div class="rounded-xl bg-stone-50 p-4">
        <p class="text-xs text-stone-500">Production totale</p>
        <p class="mt-1 text-xl font-bold text-amber-600">{{ productionKg }} kg</p>
      </div>
      <div class="rounded-xl bg-stone-50 p-4">
        <p class="text-xs text-stone-500">Ruches actives</p>
        <p class="mt-1 text-xl font-bold text-stone-900">{{ nbRuches }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  rentabiliteParRuche: number;
  coutParKg: number;
  productionKg: number;
  nbRuches: number;
}>();

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
