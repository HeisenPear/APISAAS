<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :class="isLowStock ? 'border-red-200' : 'border-stone-200/60'"
    @click="$emit('click', stock)"
  >
    <!-- Colored top accent bar -->
    <div class="h-1" :class="accentColor" />

    <div class="p-4">
      <!-- Row 1: icon + name + quantity -->
      <div class="flex items-center gap-3">
        <!-- Category icon -->
        <div
          class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          :class="categoryStyle.bg"
        >
          <UIcon :name="categoryStyle.icon" class="h-5 w-5" :class="categoryStyle.text" />
          <span
            v-if="isLowStock"
            class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
          />
        </div>

        <!-- Name + subtitle -->
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-stone-900">{{ stock.nom }}</p>
          <div class="mt-0.5 flex items-center gap-1.5">
            <span class="text-xs capitalize text-stone-400">{{ categorieLabel }}</span>
            <span
              v-if="tvaBadge"
              class="rounded-full px-1.5 py-px text-[10px] font-semibold"
              :class="tvaBadge.color"
            >
              {{ tvaBadge.rate }}%
            </span>
          </div>
        </div>

        <!-- Quantity block -->
        <div class="text-right">
          <p
            class="text-xl font-bold tabular-nums leading-tight"
            :class="isLowStock ? 'text-red-600' : 'text-stone-900'"
          >
            {{ Number(stock.quantite) }}
          </p>
          <p class="text-[11px] text-stone-400">{{ stock.unite || 'unités' }}</p>
        </div>
      </div>

      <!-- Row 2: metadata pills -->
      <div
        v-if="stock.prixUnitaire || stock.fournisseur || stock.emplacement"
        class="mt-3 flex flex-wrap items-center gap-1.5"
      >
        <span
          v-if="stock.prixUnitaire"
          class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
        >
          <UIcon name="i-lucide-euro" class="h-3 w-3" />
          {{ Number(stock.prixUnitaire).toFixed(2) }}/u
        </span>
        <span
          v-if="stock.fournisseur"
          class="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500"
        >
          <UIcon name="i-lucide-building-2" class="h-3 w-3" />
          {{ stock.fournisseur }}
        </span>
        <span
          v-if="stock.emplacement"
          class="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500"
        >
          <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
          {{ stock.emplacement }}
        </span>
      </div>

      <!-- Row 3: Actions — always visible -->
      <div class="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
        <!-- Low stock indicator -->
        <div v-if="isLowStock" class="flex items-center gap-1 text-[11px] font-medium text-red-600">
          <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
          Stock bas
        </div>
        <div v-else-if="stock.seuilAlerte" class="text-[11px] text-stone-300">
          Seuil : {{ Number(stock.seuilAlerte) }}
        </div>
        <div v-else />

        <!-- Action buttons -->
        <div class="flex items-center gap-0.5">
          <UButton
            icon="i-lucide-plus"
            size="xs"
            variant="ghost"
            color="success"
            aria-label="Entrée stock"
            @click.stop="$emit('entree', stock)"
          />
          <UButton
            icon="i-lucide-minus"
            size="xs"
            variant="ghost"
            color="error"
            aria-label="Sortie stock"
            @click.stop="$emit('sortie', stock)"
          />
          <UButton
            icon="i-lucide-pencil"
            size="xs"
            variant="ghost"
            color="neutral"
            aria-label="Modifier"
            @click.stop="$emit('edit', stock)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            aria-label="Supprimer"
            @click.stop="$emit('delete', stock)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stock } from '~/types/models';
import { TVA_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

const props = defineProps<{
  stock: Stock;
}>();

defineEmits<{
  click: [stock: Stock];
  entree: [stock: Stock];
  sortie: [stock: Stock];
  edit: [stock: Stock];
  delete: [stock: Stock];
}>();

const categorieLabelsMap: Record<string, string> = {
  cadres: 'Cadres',
  hausses: 'Hausses',
  corps: 'Corps de ruche',
  nourrissement: 'Nourrissement',
  traitement: 'Traitement',
  conditionnement: 'Conditionnement',
  equipement: 'Équipement',
  outillage: 'Outillage',
  autre: 'Autre',
};

const categorieLabel = computed(
  () => categorieLabelsMap[props.stock.categorie] ?? props.stock.categorie,
);

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

/** Colored accent bar at top of card */
const accentColor = computed(() => {
  const map: Record<string, string> = {
    cadres: 'bg-amber-400',
    hausses: 'bg-amber-400',
    corps: 'bg-amber-400',
    nourrissement: 'bg-blue-400',
    traitement: 'bg-emerald-400',
    conditionnement: 'bg-purple-400',
    equipement: 'bg-orange-400',
    outillage: 'bg-stone-300',
    autre: 'bg-stone-300',
  };
  return map[props.stock.categorie] ?? 'bg-stone-300';
});

const isLowStock = computed(() => {
  if (!props.stock.seuilAlerte) return false;
  return Number(props.stock.quantite) <= Number(props.stock.seuilAlerte);
});

const TVA_BADGE_CONFIG: Record<number, { color: string }> = {
  5.5: { color: 'bg-emerald-100 text-emerald-700' },
  10: { color: 'bg-blue-100 text-blue-700' },
  20: { color: 'bg-stone-100 text-stone-500' },
  0: { color: 'bg-amber-100 text-amber-700' },
};

const tvaBadge = computed(() => {
  const tva = props.stock.tauxTva
    ? Number(props.stock.tauxTva)
    : props.stock.categorieVente
      ? (TVA_PAR_CATEGORIE_VENTE[props.stock.categorieVente as CategorieVente] ?? null)
      : null;
  if (tva === null) return null;
  const cfg = TVA_BADGE_CONFIG[tva];
  return cfg ? { rate: tva, ...cfg } : null;
});
</script>
