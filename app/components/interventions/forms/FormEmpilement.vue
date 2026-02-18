<template>
  <div class="space-y-5">
    <!-- Ruche destination (dropdown dynamique) -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Ruche de destination</label>
      <div v-if="ruchesLoading" class="flex items-center gap-2 py-2 text-sm text-stone-400">
        <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
        Chargement des ruches...
      </div>
      <select
        v-else
        v-model="form.ruche_destination_id"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">-- Selectionner une ruche --</option>
        <option v-for="r in ruches" :key="r.id" :value="r.id">
          {{ r.numero }} {{ r.type ? `(${r.type})` : '' }}
        </option>
      </select>
    </div>

    <!-- Methode de reunion -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Methode de reunion</label>
      <select
        v-model="form.methode_reunion"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option v-for="m in methodesReunion" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </div>

    <!-- Info methode papier journal -->
    <div
      v-if="form.methode_reunion === 'papier_journal'"
      class="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 border border-amber-200"
    >
      <UIcon name="i-lucide-info" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p class="text-xs text-amber-700">
        La methode du papier journal permet aux abeilles de s'habituer progressivement les unes aux
        autres en le grignotant. Comptez 24 a 48h.
      </p>
    </div>

    <!-- Devenir ruche source -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Devenir de la ruche source</label>
      <select
        v-model="form.devenir_ruche_source"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option v-for="d in devenirs" :key="d.value" :value="d.value">{{ d.label }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesEmpilement } from '~/types/interventions';
import type { ApiListResponse } from '~/types/api';

const props = defineProps<{
  modelValue: DonneesEmpilement;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesEmpilement];
}>();

// Fetch ruches dynamically
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<{ id: string; numero: string; type: string }>
>('/api/ruches', {
  query: { limit: 100 },
  key: 'form-empilement-ruches',
  lazy: true,
});

const ruchesLoading = computed(() => ruchesStatus.value === 'pending');
const ruches = computed(() => ruchesData.value?.data ?? []);

const methodesReunion = [
  { value: 'papier_journal' as const, label: 'Papier journal' },
  { value: 'directe' as const, label: 'Directe' },
  { value: 'autre' as const, label: 'Autre' },
];

const devenirs = [
  { value: 'stockage' as const, label: 'Mise en stockage' },
  { value: 'destruction' as const, label: 'Destruction' },
  { value: 'reutilisation' as const, label: 'Reutilisation' },
];

const form = reactive<DonneesEmpilement>({
  ruche_destination_id: props.modelValue.ruche_destination_id ?? '',
  methode_reunion: props.modelValue.methode_reunion ?? 'papier_journal',
  devenir_ruche_source: props.modelValue.devenir_ruche_source ?? 'stockage',
});

watch(
  () => ({ ...form }),
  () => {
    emit('update:modelValue', {
      ruche_destination_id: form.ruche_destination_id,
      methode_reunion: form.methode_reunion,
      devenir_ruche_source: form.devenir_ruche_source,
    });
  },
  { deep: true, immediate: true },
);
</script>
