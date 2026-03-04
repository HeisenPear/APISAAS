<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-stone-600"
      >Ruche de destination (fusionner avec)</label
    >

    <USelect
      :model-value="props.modelValue.rucheDestinationId"
      :items="rucheOptions"
      placeholder="Choisir une ruche"
      class="w-full"
      @update:model-value="update('rucheDestinationId', String($event))"
    />

    <p v-if="!ruches.length" class="text-xs text-stone-400">Aucune ruche disponible.</p>
  </div>
</template>

<script setup lang="ts">
import type { FormEmpilementData } from '~/types/interventions';

const props = defineProps<{
  modelValue: FormEmpilementData;
  ruches: Array<{ id: string; numero: string }>;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: FormEmpilementData] }>();

function update<K extends keyof FormEmpilementData>(key: K, value: FormEmpilementData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const rucheOptions = computed(() => props.ruches.map((r) => ({ value: r.id, label: r.numero })));
</script>
