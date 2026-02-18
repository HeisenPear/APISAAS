<template>
  <div class="space-y-5">
    <!-- Type nourriture -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Type de nourriture</label>
      <select
        v-model="form.type_nourriture"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Quantite stepper + Unite -->
    <div class="flex gap-3">
      <div class="flex-1 space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Quantite</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
            @click="form.quantite = Math.max(0, Math.round((form.quantite - stepSize) * 10) / 10)"
          >
            <UIcon name="i-lucide-minus" class="h-4 w-4" />
          </button>
          <input
            v-model.number="form.quantite"
            type="number"
            min="0"
            :step="stepSize"
            class="h-10 w-24 rounded-lg border border-stone-200 bg-white px-3 text-center text-sm font-semibold text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
            @click="form.quantite = Math.round((form.quantite + stepSize) * 10) / 10"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div class="w-36 space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Unite</label>
        <select
          v-model="form.unite"
          class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="kg">Kilogrammes</option>
          <option value="g">Grammes</option>
          <option value="litres">Litres</option>
          <option value="ml">Millilitres</option>
        </select>
      </div>
    </div>

    <!-- Concentration (conditionnel pour sirop) -->
    <div v-if="isSirop" class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Concentration</label>
      <select
        v-model="form.concentration"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">-- Selectionner --</option>
        <option value="50_50">50/50 (leger - printemps)</option>
        <option value="60_40">60/40 (moyen)</option>
        <option value="70_30">70/30 (lourd - automne)</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesNourrissement } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesNourrissement;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesNourrissement];
}>();

const typeOptions = [
  { value: 'sirop_sucre', label: 'Sirop de sucre' },
  { value: 'sirop_glucose', label: 'Sirop de glucose' },
  { value: 'candi', label: 'Candi' },
  { value: 'pate_proteique', label: 'Pate proteique' },
  { value: 'miel', label: 'Miel' },
  { value: 'autre', label: 'Autre' },
];

const form = reactive<{
  type_nourriture: DonneesNourrissement['type_nourriture'];
  quantite: number;
  unite: DonneesNourrissement['unite'];
  concentration: string;
}>({
  type_nourriture: props.modelValue.type_nourriture,
  quantite: props.modelValue.quantite,
  unite: props.modelValue.unite,
  concentration: props.modelValue.concentration ?? '',
});

const isSirop = computed(
  () => form.type_nourriture === 'sirop_sucre' || form.type_nourriture === 'sirop_glucose',
);

const stepSize = computed(() => {
  if (form.unite === 'kg' || form.unite === 'litres') return 0.5;
  return 100;
});

watch(
  form,
  () => {
    const data: DonneesNourrissement = {
      type_nourriture: form.type_nourriture,
      quantite: form.quantite,
      unite: form.unite,
    };
    if (isSirop.value && form.concentration) {
      data.concentration = form.concentration;
    }
    emit('update:modelValue', data);
  },
  { deep: true },
);
</script>
