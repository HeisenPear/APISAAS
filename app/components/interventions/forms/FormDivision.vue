<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-stone-600">Nombre de divisions</label>

    <div class="flex items-center gap-3">
      <button
        aria-label="Une division de moins"
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100 disabled:opacity-40"
        :disabled="props.modelValue.nombreDivisions <= 1"
        @click="update('nombreDivisions', Math.max(1, props.modelValue.nombreDivisions - 1))"
      >
        <UIcon name="i-lucide-minus" class="h-5 w-5" />
      </button>

      <div class="flex flex-col items-center">
        <span class="text-3xl font-bold text-[#F5A623]">
          {{ props.modelValue.nombreDivisions }}
        </span>
        <span class="text-xs text-stone-400">
          {{ props.modelValue.nombreDivisions === 1 ? 'division' : 'divisions' }}
        </span>
      </div>

      <button
        type="button"
        aria-label="Une division de plus"
        class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100 disabled:opacity-40"
        :disabled="props.modelValue.nombreDivisions >= 10"
        @click="update('nombreDivisions', Math.min(10, props.modelValue.nombreDivisions + 1))"
      >
        <UIcon name="i-lucide-plus" class="h-5 w-5" />
      </button>
    </div>

    <p class="text-xs text-stone-400">Entre 1 et 10 divisions possibles</p>
  </div>
</template>

<script setup lang="ts">
import type { FormDivisionData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormDivisionData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormDivisionData] }>();

function update<K extends keyof FormDivisionData>(key: K, value: FormDivisionData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>
