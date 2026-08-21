<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-stone-600">Type de produit recolte</label>

    <div class="flex gap-2">
      <button
        v-for="opt in produitOptions"
        :key="opt.value"
        type="button"
        class="min-h-[44px] flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-all duration-200"
        :class="
          props.modelValue.typeProduit === opt.value
            ? 'border-[#F5A623]/60 bg-amber-50'
            : 'border-stone-200/60 bg-white hover:border-stone-300'
        "
        @click="update('typeProduit', opt.value)"
      >
        <UIcon
          :name="opt.icon"
          class="h-6 w-6"
          :class="props.modelValue.typeProduit === opt.value ? 'text-honey-deep' : 'text-stone-400'"
        />
        <span
          class="text-sm font-medium"
          :class="props.modelValue.typeProduit === opt.value ? 'text-amber-700' : 'text-stone-600'"
        >
          {{ opt.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormRecolteData } from '~/types/interventions';

const props = defineProps<{ modelValue: FormRecolteData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormRecolteData] }>();

function update<K extends keyof FormRecolteData>(key: K, value: FormRecolteData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const produitOptions = [
  { value: 'miel' as const, label: 'Miel', icon: 'i-lucide-droplets' },
  { value: 'pollen' as const, label: 'Pollen', icon: 'i-lucide-flower-2' },
  { value: 'propolis' as const, label: 'Propolis', icon: 'i-lucide-hexagon' },
];
</script>
