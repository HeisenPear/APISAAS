<template>
  <div class="space-y-4">
    <!-- Poids -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Poids (kg)</label>
      <UInput
        type="number"
        :model-value="props.modelValue.poidsKg"
        placeholder="25.5"
        :min="0"
        step="0.1"
        class="w-full"
        @update:model-value="update('poidsKg', Number($event) || 0)"
      />
    </div>

    <!-- Type de pesee -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Type de pesee</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="opt in typesPesee"
          :key="opt.value"
          type="button"
          class="min-h-[44px] rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200"
          :class="
            props.modelValue.typePesee === opt.value
              ? 'border-[#F5A623]/60 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="update('typePesee', opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormPeseeData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormPeseeData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormPeseeData] }>();

function update<K extends keyof FormPeseeData>(key: K, value: FormPeseeData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const typesPesee = [
  { value: 'totale' as const, label: 'Pesee totale' },
  { value: 'cote_droit' as const, label: 'Cote droit' },
  { value: 'cote_gauche' as const, label: 'Cote gauche' },
  { value: 'arriere' as const, label: 'Arriere' },
];
</script>
