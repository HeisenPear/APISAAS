<template>
  <div class="space-y-4">
    <!-- Type de nourriture -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Type de nourriture</label>
      <USelect
        :model-value="props.modelValue.type"
        :items="typeOptions"
        value-key="value"
        label-key="label"
        placeholder="Choisir un type"
        class="w-full"
        @update:model-value="update('type', $event as FormNourrissementData['type'])"
      />
    </div>

    <!-- Quantite -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Quantite</label>
      <UInput
        type="number"
        :model-value="props.modelValue.quantite"
        placeholder="0"
        :min="0"
        step="0.1"
        class="w-full"
        @update:model-value="update('quantite', Number($event) || 0)"
      />
    </div>

    <!-- Unite -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Unite</label>
      <USelect
        :model-value="props.modelValue.unite"
        :items="uniteOptions"
        value-key="value"
        label-key="label"
        class="w-full"
        @update:model-value="update('unite', $event as FormNourrissementData['unite'])"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  TYPES_NOURRISSEMENT,
  TYPES_NOURRISSEMENT_LABELS,
  type FormNourrissementData,
} from '~/types/interventions';

const props = defineProps<{ modelValue: FormNourrissementData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormNourrissementData] }>();

function update<K extends keyof FormNourrissementData>(key: K, value: FormNourrissementData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const typeOptions = TYPES_NOURRISSEMENT.map((t) => ({
  value: t,
  label: TYPES_NOURRISSEMENT_LABELS[t],
}));

const uniteOptions = [
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'g', label: 'Grammes (g)' },
  { value: 'litres', label: 'Litres (L)' },
  { value: 'ml', label: 'Millilitres (mL)' },
];
</script>
