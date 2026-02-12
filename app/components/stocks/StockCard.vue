<template>
  <div
    class="group rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :class="isLowStock ? 'border-red-200 bg-red-50/30' : ''"
  >
    <!-- Header -->
    <div class="mb-3 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl"
          :class="categoryStyle.bg"
        >
          <UIcon :name="categoryStyle.icon" class="h-5 w-5" :class="categoryStyle.text" />
        </div>
        <div>
          <p class="font-semibold text-stone-900">{{ stock.nom }}</p>
          <p class="text-xs capitalize text-stone-400">{{ stock.categorie }}</p>
        </div>
      </div>
      <!-- Actions -->
      <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <UButton
          icon="i-lucide-plus"
          size="xs"
          variant="ghost"
          color="success"
          @click="$emit('entree', stock)"
        />
        <UButton
          icon="i-lucide-minus"
          size="xs"
          variant="ghost"
          color="error"
          @click="$emit('sortie', stock)"
        />
        <UButton
          icon="i-lucide-pencil"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="$emit('edit', stock)"
        />
      </div>
    </div>

    <!-- Quantity -->
    <div class="mb-3">
      <div class="flex items-baseline gap-1.5">
        <span class="text-2xl font-bold" :class="isLowStock ? 'text-red-600' : 'text-stone-900'">
          {{ Number(stock.quantite) }}
        </span>
        <span class="text-sm text-stone-400">{{ stock.unite || 'unites' }}</span>
      </div>
      <!-- Progress bar towards seuil -->
      <div v-if="stock.seuilAlerte" class="mt-2">
        <div class="h-1.5 w-full rounded-full bg-stone-100">
          <div
            class="h-1.5 rounded-full transition-all duration-500"
            :class="stockLevelColor"
            :style="{ width: `${Math.min(stockLevelPercent, 100)}%` }"
          />
        </div>
        <p class="mt-1 text-xs text-stone-400">
          Seuil d'alerte : {{ Number(stock.seuilAlerte) }} {{ stock.unite || 'unites' }}
        </p>
      </div>
    </div>

    <!-- Footer info -->
    <div class="flex flex-wrap gap-2">
      <span
        v-if="stock.fournisseur"
        class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
      >
        {{ stock.fournisseur }}
      </span>
      <span
        v-if="stock.emplacement"
        class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
      >
        {{ stock.emplacement }}
      </span>
      <span
        v-if="stock.prixUnitaire"
        class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500"
      >
        {{ Number(stock.prixUnitaire).toFixed(2) }} EUR/u
      </span>
    </div>

    <!-- Low stock alert -->
    <div
      v-if="isLowStock"
      class="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
    >
      <UIcon name="i-lucide-alert-triangle" class="h-3.5 w-3.5" />
      Stock bas
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stock } from '~/types/models';

const props = defineProps<{
  stock: Stock;
}>();

defineEmits<{
  entree: [stock: Stock];
  sortie: [stock: Stock];
  edit: [stock: Stock];
}>();

const categoryStyles: Record<string, { icon: string; bg: string; text: string }> = {
  cadres: { icon: 'i-lucide-square', bg: 'bg-amber-50', text: 'text-amber-600' },
  hausses: { icon: 'i-lucide-layers', bg: 'bg-amber-50', text: 'text-amber-600' },
  corps: { icon: 'i-lucide-box', bg: 'bg-amber-50', text: 'text-amber-600' },
  nourrissement: { icon: 'i-lucide-candy', bg: 'bg-blue-50', text: 'text-blue-600' },
  traitement: { icon: 'i-lucide-shield', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  conditionnement: { icon: 'i-lucide-package', bg: 'bg-purple-50', text: 'text-purple-600' },
  equipement: { icon: 'i-lucide-hard-hat', bg: 'bg-orange-50', text: 'text-orange-600' },
  outillage: { icon: 'i-lucide-wrench', bg: 'bg-stone-100', text: 'text-stone-600' },
  autre: { icon: 'i-lucide-circle-dot', bg: 'bg-stone-100', text: 'text-stone-600' },
};

const categoryStyle = computed(
  () => categoryStyles[props.stock.categorie] ?? categoryStyles.autre!,
);

const isLowStock = computed(() => {
  if (!props.stock.seuilAlerte) return false;
  return Number(props.stock.quantite) <= Number(props.stock.seuilAlerte);
});

const stockLevelPercent = computed(() => {
  if (!props.stock.seuilAlerte) return 100;
  const seuil = Number(props.stock.seuilAlerte);
  if (seuil === 0) return 100;
  // Map quantity to 0-100 scale where seuil = 30%
  const qty = Number(props.stock.quantite);
  const maxRef = seuil * 3;
  return (qty / maxRef) * 100;
});

const stockLevelColor = computed(() => {
  if (isLowStock.value) return 'bg-red-500';
  if (stockLevelPercent.value < 50) return 'bg-amber-500';
  return 'bg-emerald-500';
});
</script>
