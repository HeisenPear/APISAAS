<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Poids -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Poids (kg)</label>
        <input
          v-model.number="form.poids_kg"
          type="number"
          min="0"
          step="0.1"
          placeholder="25.5"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <!-- Type de pesee -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Type de pesee</label>
        <select
          v-model="form.type_pesee"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option v-for="tp in typesPesee" :key="tp.value" :value="tp.value">{{ tp.label }}</option>
        </select>
      </div>
    </div>

    <!-- Poids estime total (auto-calculated for partial weighing) -->
    <div
      v-if="poidsEstimeTotal !== null && form.type_pesee !== 'totale'"
      class="flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-3 border border-sky-200"
    >
      <UIcon name="i-lucide-calculator" class="h-4 w-4 text-sky-500" />
      <span class="text-sm text-stone-600">
        Poids total estime :
        <strong class="font-semibold text-sky-700">{{ poidsEstimeTotal }} kg</strong>
        <span class="text-xs text-stone-400 ml-1">(x2 pesee partielle)</span>
      </span>
    </div>

    <!-- Variation -->
    <div class="rounded-xl bg-stone-50 p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Variation</h4>
        <span v-if="previousWeight != null" class="text-xs text-stone-400">
          Poids precedent : {{ previousWeight }} kg
        </span>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model.number="form.variation_kg"
          type="number"
          step="0.1"
          placeholder="0.0"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />

        <div
          v-if="form.variation_kg != null && form.variation_kg !== 0"
          class="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2"
          :class="form.variation_kg > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
        >
          <UIcon
            :name="form.variation_kg > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="h-4 w-4"
          />
          <span class="text-sm font-medium">
            {{ form.variation_kg > 0 ? '+' : '' }}{{ form.variation_kg }} kg
          </span>
        </div>
      </div>

      <button
        v-if="previousWeight != null && form.poids_kg != null && autoVariation !== null"
        type="button"
        class="mt-2 text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2"
        @click="form.variation_kg = autoVariation"
      >
        Calculer automatiquement ({{ autoVariation > 0 ? '+' : '' }}{{ autoVariation }} kg)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesPesee } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesPesee;
  previousWeight?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesPesee];
}>();

const typesPesee = [
  { value: 'totale' as const, label: 'Pesee totale' },
  { value: 'cote_droit' as const, label: 'Cote droit' },
  { value: 'cote_gauche' as const, label: 'Cote gauche' },
  { value: 'arriere' as const, label: 'Arriere' },
];

const form = reactive<DonneesPesee>({
  poids_kg: props.modelValue.poids_kg ?? 0,
  type_pesee: props.modelValue.type_pesee ?? 'totale',
  poids_estime_total: props.modelValue.poids_estime_total,
  variation_kg: props.modelValue.variation_kg,
});

const poidsEstimeTotal = computed(() => {
  if (form.type_pesee === 'totale' || form.poids_kg == null || form.poids_kg <= 0) {
    return null;
  }
  return Math.round(form.poids_kg * 2 * 10) / 10;
});

const autoVariation = computed(() => {
  if (props.previousWeight == null || form.poids_kg == null) return null;
  const currentTotal =
    form.type_pesee === 'totale' ? form.poids_kg : (poidsEstimeTotal.value ?? form.poids_kg);
  return Math.round((currentTotal - props.previousWeight) * 10) / 10;
});

watch(
  () => ({ ...form }),
  () => {
    const data: DonneesPesee = {
      poids_kg: form.poids_kg,
      type_pesee: form.type_pesee,
    };

    if (form.type_pesee !== 'totale' && poidsEstimeTotal.value !== null) {
      data.poids_estime_total = poidsEstimeTotal.value;
    }

    if (form.variation_kg != null) {
      data.variation_kg = form.variation_kg;
    }

    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
