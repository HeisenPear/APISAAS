<template>
  <div class="space-y-5">
    <!-- Rucher destination (dropdown dynamique) -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Deplacer dans le rucher :</label>
      <div v-if="ruchersLoading" class="flex items-center gap-2 py-2 text-sm text-stone-400">
        <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
        Chargement des ruchers...
      </div>
      <select
        v-else
        v-model="form.rucher_destination_id"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">-- Selectionner un rucher --</option>
        <option v-for="r in ruchers" :key="r.id" :value="r.id">
          {{ r.nom }} {{ r.commune ? `(${r.commune})` : '' }}
        </option>
      </select>
    </div>

    <!-- Emplacement -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Emplacement dans le rucher
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <input
        v-model="form.emplacement"
        type="text"
        placeholder="Ex: Rangee nord, place 3"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Motif -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Motif du deplacement</label>
      <select
        v-model="form.motif"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="transhumance">Transhumance</option>
        <option value="reorganisation">Reorganisation</option>
        <option value="vente">Vente</option>
        <option value="autre">Autre</option>
      </select>
    </div>

    <!-- Date retour prevue (conditionnel pour transhumance) -->
    <div v-if="form.motif === 'transhumance'" class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Date de retour prevue
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <input
        v-model="form.date_retour_prevue"
        type="date"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Info transhumance -->
    <div
      v-if="form.motif === 'transhumance'"
      class="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
    >
      <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
      <p class="text-xs text-blue-600">
        Pour une transhumance, pensez a verifier le registre d'elevage et les conditions sanitaires
        du nouveau site.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesDeplacement } from '~/types/interventions';
import type { ApiListResponse } from '~/types/api';

const props = defineProps<{
  modelValue: DonneesDeplacement;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesDeplacement];
}>();

// Fetch ruchers dynamically
const { data: ruchersData, status: ruchersStatus } = useFetch<
  ApiListResponse<{ id: string; nom: string; commune: string | null }>
>('/api/ruchers', {
  query: { limit: 100 },
  key: 'form-deplacement-ruchers',
  lazy: true,
});

const ruchersLoading = computed(() => ruchersStatus.value === 'pending');
const ruchers = computed(() => ruchersData.value?.data ?? []);

const form = reactive<{
  rucher_destination_id: string;
  emplacement: string;
  motif: DonneesDeplacement['motif'];
  date_retour_prevue: string;
}>({
  rucher_destination_id: props.modelValue.rucher_destination_id ?? '',
  emplacement: props.modelValue.emplacement ?? '',
  motif: props.modelValue.motif ?? 'reorganisation',
  date_retour_prevue: props.modelValue.date_retour_prevue ?? '',
});

watch(
  form,
  () => {
    const data: DonneesDeplacement = {
      rucher_destination_id: form.rucher_destination_id,
      motif: form.motif,
    };
    if (form.emplacement.trim()) {
      data.emplacement = form.emplacement.trim();
    }
    if (form.motif === 'transhumance' && form.date_retour_prevue) {
      data.date_retour_prevue = form.date_retour_prevue;
    }
    emit('update:modelValue', data);
  },
  { deep: true },
);
</script>
