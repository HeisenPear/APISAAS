<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-stone-600">Rucher de destination</label>

    <USelect
      :model-value="props.modelValue.rucherDestinationId"
      :items="rucherOptions"
      value-key="value"
      label-key="label"
      placeholder="Choisir un rucher"
      class="w-full"
      @update:model-value="update('rucherDestinationId', String($event))"
    />

    <p v-if="!ruchers.length" class="text-xs text-stone-400">
      Aucun rucher disponible. Creez d'abord un rucher.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { FormDeplacementData } from '~/types/interventions';

const props = defineProps<{
  modelValue: FormDeplacementData;
  ruchers: Array<{ id: string; nom: string }>;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: FormDeplacementData] }>();

function update<K extends keyof FormDeplacementData>(key: K, value: FormDeplacementData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const rucherOptions = computed(() => props.ruchers.map((r) => ({ value: r.id, label: r.nom })));
</script>
