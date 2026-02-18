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
      <p class="mt-1 text-xs text-stone-400">Les cadres seront egalement ajoutes</p>
    </div>

    <!-- Cadres transferes -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Nombre de cadres transferes</label>
      <input
        v-model.number="form.cadres_transferes"
        type="number"
        min="0"
        step="1"
        placeholder="10"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Lieu de stockage de la ruche a remiser -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600"
        >Lieux de stockage de la ruche a remiser</label
      >
      <div v-if="ruchersLoading" class="flex items-center gap-2 py-2 text-sm text-stone-400">
        <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
        Chargement...
      </div>
      <select
        v-else
        v-model="form.lieu_stockage_id"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">-- Selectionner un lieu --</option>
        <option v-for="r in ruchers" :key="r.id" :value="r.id">
          {{ r.nom }} {{ r.commune ? `(${r.commune})` : '' }}
        </option>
      </select>
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
import type { DonneesTransvasement } from '~/types/interventions';
import type { ApiListResponse } from '~/types/api';

const props = defineProps<{
  modelValue: DonneesTransvasement;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesTransvasement];
}>();

// Fetch ruches and ruchers
const { data: ruchesData, status: ruchesStatus } = useFetch<
  ApiListResponse<{ id: string; numero: string; type: string }>
>('/api/ruches', {
  query: { limit: 100 },
  key: 'form-transvasement-ruches',
  lazy: true,
});

const { data: ruchersData, status: ruchersStatus } = useFetch<
  ApiListResponse<{ id: string; nom: string; commune: string | null }>
>('/api/ruchers', {
  query: { limit: 100 },
  key: 'form-transvasement-ruchers',
  lazy: true,
});

const ruchesLoading = computed(() => ruchesStatus.value === 'pending');
const ruchersLoading = computed(() => ruchersStatus.value === 'pending');
const ruches = computed(() => ruchesData.value?.data ?? []);
const ruchers = computed(() => ruchersData.value?.data ?? []);

const devenirs = [
  { value: 'stockage' as const, label: 'Mise en stockage' },
  { value: 'destruction' as const, label: 'Destruction' },
  { value: 'reutilisation_immediate' as const, label: 'Reutilisation immediate' },
];

const form = reactive<{
  ruche_destination_id: string;
  cadres_transferes: number;
  devenir_ruche_source: DonneesTransvasement['devenir_ruche_source'];
  lieu_stockage_id: string;
  origine: DonneesTransvasement['origine'];
}>({
  ruche_destination_id: props.modelValue.ruche_destination_id ?? '',
  cadres_transferes: props.modelValue.cadres_transferes ?? 0,
  devenir_ruche_source: props.modelValue.devenir_ruche_source ?? 'stockage',
  lieu_stockage_id: props.modelValue.lieu_stockage_id ?? '',
  origine: props.modelValue.origine ?? 'transvasement',
});

watch(
  () => ({ ...form }),
  () => {
    const data: DonneesTransvasement = {
      ruche_destination_id: form.ruche_destination_id,
      cadres_transferes: form.cadres_transferes,
      devenir_ruche_source: form.devenir_ruche_source,
      origine: form.origine,
    };
    if (form.lieu_stockage_id) {
      data.lieu_stockage_id = form.lieu_stockage_id;
    }
    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
