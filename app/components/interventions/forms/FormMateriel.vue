<template>
  <div class="space-y-6">
    <!-- Etat des lieux -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-stone-600">Elements presents sur la ruche</h4>
      <div v-if="form.elements.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="(el, idx) in form.elements"
          :key="idx"
          class="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
        >
          {{ getMaterielLabel(el.type) }}
          <span class="font-semibold text-stone-900">x{{ el.quantite }}</span>
          <button
            type="button"
            class="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-100 hover:text-red-600"
            @click="removeElement(idx)"
          >
            <UIcon name="i-lucide-x" class="h-3 w-3" />
          </button>
        </span>
      </div>
      <p
        v-else
        class="rounded-lg border border-dashed border-stone-200 p-4 text-center text-sm text-stone-400"
      >
        Aucun element ajoute pour le moment
      </p>
    </div>

    <!-- Grille de selection du materiel -->
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-stone-600">Ajouter du materiel</h4>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          class="flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-200"
          :class="
            selectedType === opt.value
              ? 'border-amber-500 bg-amber-50 shadow-sm'
              : 'border-stone-200/60 bg-white hover:border-stone-300 hover:bg-stone-50'
          "
          @click="selectedType = selectedType === opt.value ? '' : opt.value"
        >
          <UIcon
            :name="opt.icon"
            class="h-6 w-6"
            :class="selectedType === opt.value ? 'text-amber-600' : 'text-stone-400'"
          />
          <span
            class="text-xs font-medium"
            :class="selectedType === opt.value ? 'text-amber-700' : 'text-stone-600'"
          >
            {{ opt.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Quantite + bouton ajouter -->
    <div v-if="selectedType" class="flex items-end gap-3">
      <div class="flex-1 space-y-1.5">
        <label class="block text-xs text-stone-500">Quantite</label>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
            @click="addQuantite = Math.max(1, addQuantite - 1)"
          >
            <UIcon name="i-lucide-minus" class="h-4 w-4" />
          </button>
          <input
            v-model.number="addQuantite"
            type="number"
            min="1"
            class="h-9 w-16 rounded-lg border border-stone-200 bg-white px-2 text-center text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
            @click="addQuantite += 1"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        type="button"
        class="flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600"
        @click="addElement"
      >
        <UIcon name="i-lucide-plus" class="h-4 w-4" />
        Ajouter le materiel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesMateriel } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesMateriel;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesMateriel];
}>();

const typeOptions = [
  { value: 'cadres', label: 'Cadres', icon: 'i-lucide-grid-2x2' },
  { value: 'cadres_male', label: 'Cadres a male', icon: 'i-lucide-grid-2x2' },
  { value: 'partitions', label: 'Partitions', icon: 'i-lucide-separator-vertical' },
  { value: 'nourrisseurs', label: 'Nourrisseurs', icon: 'i-lucide-cup-soda' },
  { value: 'corps', label: 'Corps de ruche', icon: 'i-lucide-box' },
  { value: 'hausses', label: 'Hausses', icon: 'i-lucide-layers' },
  { value: 'grilles_reine', label: 'Grilles a reine', icon: 'i-lucide-crown' },
  { value: 'grilles_propolis', label: 'Grilles a propolis', icon: 'i-lucide-grid-3x3' },
  { value: 'trappes_pollen', label: 'Trappes a pollen', icon: 'i-lucide-flower-2' },
];

const selectedType = ref('');
const addQuantite = ref(1);

const form = reactive<DonneesMateriel>({
  action: props.modelValue.action ?? 'ajout',
  elements:
    props.modelValue.elements?.length > 0 ? props.modelValue.elements.map((e) => ({ ...e })) : [],
});

function getMaterielLabel(type: string): string {
  return typeOptions.find((o) => o.value === type)?.label ?? type;
}

function addElement() {
  if (!selectedType.value) return;
  const existing = form.elements.find((e) => e.type === selectedType.value);
  if (existing) {
    existing.quantite += addQuantite.value;
  } else {
    form.elements.push({ type: selectedType.value, quantite: addQuantite.value });
  }
  selectedType.value = '';
  addQuantite.value = 1;
}

function removeElement(index: number) {
  form.elements.splice(index, 1);
}

watch(
  form,
  () => {
    emit('update:modelValue', {
      action: form.action,
      elements: form.elements.map((e) => ({ ...e })),
    });
  },
  { deep: true },
);
</script>
