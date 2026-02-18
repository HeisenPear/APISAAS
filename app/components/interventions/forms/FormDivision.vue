<template>
  <div class="space-y-5">
    <!-- Nombre de divisions -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Nombre de divisions</label>
      <input
        v-model.number="form.nombre_divisions"
        type="number"
        min="1"
        max="10"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
      <p class="text-xs text-stone-400">Entre 1 et 10 divisions</p>
    </div>

    <!-- Cadres par division -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Cadres par division</label>
      <input
        v-model.number="form.cadres_par_division"
        type="number"
        min="1"
        max="12"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Reine dans division toggle -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Reine placee dans la division</label>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            form.reine_dans_division
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="form.reine_dans_division = true"
        >
          Oui
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            !form.reine_dans_division
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
          "
          @click="form.reine_dans_division = false"
        >
          Non (orpheline)
        </button>
      </div>
    </div>

    <!-- Resume visuel -->
    <div class="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <p class="text-sm font-medium text-amber-800">Resume</p>
      <p class="mt-1 text-xs text-amber-600">
        {{ form.nombre_divisions }} division{{ form.nombre_divisions > 1 ? 's' : '' }} de
        {{ form.cadres_par_division }} cadre{{ form.cadres_par_division > 1 ? 's' : '' }} chacune.
        <span v-if="form.reine_dans_division">Reine transferee dans la division.</span>
        <span v-else>Division orpheline (elevage royal).</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesDivision } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesDivision;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesDivision];
}>();

const form = reactive<{
  nombre_divisions: number;
  cadres_par_division: number;
  reine_dans_division: boolean;
}>({
  nombre_divisions: props.modelValue.nombre_divisions,
  cadres_par_division: props.modelValue.cadres_par_division,
  reine_dans_division: props.modelValue.reine_dans_division,
});

watch(
  form,
  () => {
    const clamped = Math.max(1, Math.min(10, form.nombre_divisions));
    emit('update:modelValue', {
      nombre_divisions: clamped,
      cadres_par_division: Math.max(1, form.cadres_par_division),
      reine_dans_division: form.reine_dans_division,
      ruches_destination_ids: [],
    });
  },
  { deep: true },
);
</script>
