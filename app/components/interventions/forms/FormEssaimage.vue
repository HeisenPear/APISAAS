<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-stone-600"> L'essaim a-t-il ete recupere ? </label>

    <div class="flex gap-3">
      <button
        type="button"
        class="min-h-[44px] flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all duration-200"
        :class="
          props.modelValue.essaimRecupere
            ? 'border-[var(--honey)]/60 bg-[var(--honey-soft)] text-[var(--honey-deep)]'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
        "
        @click="update('essaimRecupere', true)"
      >
        <UIcon name="i-lucide-check-circle" class="h-5 w-5" />
        Oui, recupere
      </button>

      <button
        type="button"
        class="min-h-[44px] flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all duration-200"
        :class="
          !props.modelValue.essaimRecupere
            ? 'border-red-400 bg-red-50 text-red-700'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
        "
        @click="update('essaimRecupere', false)"
      >
        <UIcon name="i-lucide-x-circle" class="h-5 w-5" />
        Non, perdu
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormEssaimageData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormEssaimageData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormEssaimageData] }>();

function update<K extends keyof FormEssaimageData>(key: K, value: FormEssaimageData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>
