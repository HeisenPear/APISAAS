<template>
  <div class="space-y-4">
    <!-- Ruche destination -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Ruche de destination</label>
      <USelect
        :model-value="props.modelValue.rucheDestinationId"
        :items="rucheOptions"
        placeholder="Choisir une ruche"
        class="w-full"
        @update:model-value="update('rucheDestinationId', String($event))"
      />
      <p v-if="!ruches.length" class="text-xs text-stone-400">Aucune ruche disponible.</p>
    </div>

    <!-- Cadres transferes -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Nombre de cadres transferes</label>
      <UInput
        type="number"
        :model-value="props.modelValue.cadresTransferes"
        :min="0"
        step="1"
        placeholder="10"
        class="w-full"
        @update:model-value="update('cadresTransferes', Number($event) || 0)"
      />
    </div>

    <!-- Devenir ruche source -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Devenir de la ruche source</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="opt in devenirOptions"
          :key="opt.value"
          type="button"
          class="min-h-[44px] rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200"
          :class="
            props.modelValue.devenirRucheSource === opt.value
              ? 'border-[#F5A623]/60 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="update('devenirRucheSource', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Lieu stockage (conditionnel) -->
    <div v-if="props.modelValue.devenirRucheSource === 'stockage'" class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Lieu de stockage
        <span class="font-normal text-stone-400">optionnel</span>
      </label>
      <UInput
        :model-value="props.modelValue.lieuStockage ?? ''"
        placeholder="ex: Local materiel, hangar..."
        class="w-full"
        @update:model-value="update('lieuStockage', String($event))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormTransvasementData } from '~/types/interventions';

const props = defineProps<{
  modelValue: FormTransvasementData;
  ruches: Array<{ id: string; numero: string }>;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: FormTransvasementData] }>();

function update<K extends keyof FormTransvasementData>(key: K, value: FormTransvasementData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const rucheOptions = computed(() => props.ruches.map((r) => ({ value: r.id, label: r.numero })));

const devenirOptions = [
  { value: 'stockage' as const, label: 'Mise en stockage' },
  { value: 'destruction' as const, label: 'Destruction' },
  { value: 'reutilisation' as const, label: 'Reutilisation' },
  { value: 'reutilisation_immediate' as const, label: 'Reutilisation immediate' },
];
</script>
