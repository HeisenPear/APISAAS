<template>
  <div class="space-y-6">
    <!-- Checklist booleans -->
    <div class="space-y-4">
      <div v-for="field in checklistFields" :key="field.key" class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">{{ field.label }}</label>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="
              form[field.key] === true
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
            "
            @click="form[field.key] = form[field.key] === true ? null : true"
          >
            Oui
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="
              form[field.key] === false
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
            "
            @click="form[field.key] = form[field.key] === false ? null : false"
          >
            Non
          </button>
        </div>
      </div>
    </div>

    <!-- Force colonie -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600"> Force de la colonie </label>
      <div class="flex items-center gap-3">
        <div class="flex gap-1">
          <button
            v-for="star in 4"
            :key="star"
            type="button"
            class="text-2xl transition-all duration-200"
            :class="star <= form.force_colonie ? 'text-amber-400' : 'text-stone-300'"
            @click="form.force_colonie = star as 1 | 2 | 3 | 4"
          >
            &#9733;
          </button>
        </div>
        <span class="text-sm font-medium text-stone-500">{{ form.force_colonie }}/4</span>
      </div>
      <input
        type="range"
        :value="form.force_colonie"
        min="1"
        max="4"
        step="1"
        class="w-full accent-amber-500"
        @input="
          form.force_colonie = Number(($event.target as HTMLInputElement).value) as 1 | 2 | 3 | 4
        "
      />
    </div>

    <!-- Comportement radio -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600"> Comportement de la ruche </label>
      <div class="flex gap-2">
        <label
          v-for="option in comportementOptions"
          :key="option.value"
          class="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200"
          :class="
            form.comportement === option.value
              ? 'border-amber-400 bg-amber-50'
              : 'border-stone-200/60 bg-white hover:border-stone-300'
          "
        >
          <input v-model="form.comportement" type="radio" :value="option.value" class="sr-only" />
          <span class="text-2xl">{{ option.icon }}</span>
          <span
            class="text-xs font-medium"
            :class="form.comportement === option.value ? 'text-amber-700' : 'text-stone-600'"
          >
            {{ option.label }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesControle } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesControle;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesControle];
}>();

const form = reactive<DonneesControle>({
  reine_vue: props.modelValue.reine_vue,
  couvain_present: props.modelValue.couvain_present,
  cellules_royales: props.modelValue.cellules_royales,
  reserves_presentes: props.modelValue.reserves_presentes,
  force_colonie: props.modelValue.force_colonie,
  comportement: props.modelValue.comportement,
});

const checklistFields: Array<{
  key: keyof Pick<
    DonneesControle,
    'reine_vue' | 'couvain_present' | 'cellules_royales' | 'reserves_presentes'
  >;
  label: string;
}> = [
  { key: 'reine_vue', label: 'Avez-vous vu la reine ?' },
  { key: 'couvain_present', label: 'Avez-vous vu du couvain ?' },
  { key: 'cellules_royales', label: 'Avez-vous vu des cellules royales ?' },
  { key: 'reserves_presentes', label: "Est-ce qu'il y a des reserves ?" },
];

const comportementOptions = [
  { value: 'calme' as const, label: 'Calme', icon: '\u{1F60A}' },
  { value: 'agitee' as const, label: 'Agitee', icon: '\u{1F610}' },
  { value: 'agressive' as const, label: 'Agressive', icon: '\u{1F620}' },
];

watch(
  form,
  () => {
    emit('update:modelValue', { ...form });
  },
  { deep: true },
);
</script>
