<template>
  <div class="space-y-4">
    <p class="text-sm font-medium text-stone-600">Ajoutez ou retirez du materiel sur la ruche</p>

    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="el in ELEMENTS_MATERIEL"
        :key="el"
        class="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200"
        :class="
          getQuantite(el) > 0 ? 'border-[#F5A623]/60 bg-amber-50' : 'border-stone-200/60 bg-white'
        "
      >
        <span
          class="text-xs font-medium text-center leading-tight"
          :class="getQuantite(el) > 0 ? 'text-amber-800' : 'text-stone-600'"
        >
          {{ ELEMENTS_MATERIEL_LABELS[el] }}
        </span>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100"
            @click="updateElement(el, getQuantite(el) - 1)"
          >
            <UIcon name="i-lucide-minus" class="h-3.5 w-3.5" />
          </button>

          <span
            class="w-8 text-center text-sm font-semibold"
            :class="getQuantite(el) > 0 ? 'text-amber-700' : 'text-stone-400'"
          >
            {{ getQuantite(el) }}
          </span>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50 active:bg-stone-100"
            @click="updateElement(el, getQuantite(el) + 1)"
          >
            <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ELEMENTS_MATERIEL,
  ELEMENTS_MATERIEL_LABELS,
  type ElementMateriel,
  type FormMaterielData,
} from '~/types/interventions';

const props = defineProps<{ modelValue: FormMaterielData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormMaterielData] }>();

function getQuantite(el: ElementMateriel): number {
  return props.modelValue.elements.find((e) => e.element === el)?.quantite ?? 0;
}

function updateElement(el: ElementMateriel, qty: number) {
  const filtered = props.modelValue.elements.filter((e) => e.element !== el);
  if (qty > 0) {
    filtered.push({ element: el, quantite: qty });
  }
  emit('update:modelValue', { elements: filtered });
}
</script>
