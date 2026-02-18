<template>
  <div class="space-y-5">
    <!-- Sous-action tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in sousActions"
        :key="tab.value"
        type="button"
        class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
        :class="
          form.sous_action === tab.value
            ? 'bg-red-50 text-red-700 ring-2 ring-red-400'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        "
        @click="form.sous_action = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Comptage plancher -->
    <div
      v-if="form.sous_action === 'comptage_plancher'"
      class="space-y-4 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Comptage plancher
      </h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Nombre de varroas</label>
          <input
            v-model.number="form.nombre_varroas"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600"
            >Duree comptage (jours)</label
          >
          <input
            v-model.number="form.duree_comptage_jours"
            type="number"
            min="1"
            step="1"
            placeholder="3"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div
        v-if="chuteParJour !== null"
        class="flex items-center gap-2 rounded-lg bg-white px-4 py-3 border border-stone-200"
      >
        <UIcon name="i-lucide-calculator" class="h-4 w-4 text-stone-400" />
        <span class="text-sm text-stone-600">
          Chute par jour :
          <strong
            class="font-semibold"
            :class="
              chuteParJour > 5
                ? 'text-red-600'
                : chuteParJour > 2
                  ? 'text-amber-600'
                  : 'text-green-600'
            "
          >
            {{ chuteParJour }} varroas/jour
          </strong>
        </span>
      </div>
    </div>

    <!-- Traitement -->
    <div v-if="form.sous_action === 'traitement'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Traitement</h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Type de traitement</label>
        <select
          v-model="form.type_traitement"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Choisir un traitement</option>
          <option v-for="t in traitements" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Dosage</label>
        <input
          v-model="form.dosage"
          type="text"
          placeholder="ex: 3.5ml par inter-cadre"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Date debut</label>
          <input
            v-model="form.date_debut"
            type="date"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Date fin prevue</label>
          <input
            v-model="form.date_fin_prevue"
            type="date"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600"
          >Numero de lot du produit</label
        >
        <input
          v-model="form.numero_lot_produit"
          type="text"
          placeholder="ex: LOT-2026-001"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>

    <!-- Suppression couvain male -->
    <div
      v-if="form.sous_action === 'suppression_couvain_male'"
      class="space-y-4 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Suppression couvain male
      </h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600"
          >Nombre de cadres retires</label
        >
        <input
          v-model.number="form.nombre_cadres_retires"
          type="number"
          min="0"
          step="1"
          placeholder="1"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>

    <!-- Comptage VPH -->
    <div v-if="form.sous_action === 'comptage_vph'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Comptage VPH (Varroas Pour 100 abeilles)
      </h4>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">Nombre de varroas</label>
          <input
            v-model.number="form.nombre_varroas"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600"
            >Nombre d'abeilles echantillon</label
          >
          <input
            v-model.number="form.nombre_abeilles_echantillon"
            type="number"
            min="1"
            step="1"
            placeholder="300"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div
        v-if="tauxVph !== null"
        class="flex items-center gap-2 rounded-lg bg-white px-4 py-3 border border-stone-200"
      >
        <UIcon name="i-lucide-calculator" class="h-4 w-4 text-stone-400" />
        <span class="text-sm text-stone-600">
          Taux VPH :
          <strong
            class="font-semibold"
            :class="
              tauxVph > 3 ? 'text-red-600' : tauxVph > 1 ? 'text-amber-600' : 'text-green-600'
            "
          >
            {{ tauxVph }}%
          </strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesVarroa } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesVarroa;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesVarroa];
}>();

const sousActions = [
  { value: 'comptage_plancher' as const, label: 'Comptage plancher' },
  { value: 'traitement' as const, label: 'Traitement' },
  { value: 'suppression_couvain_male' as const, label: 'Suppression couvain male' },
  { value: 'comptage_vph' as const, label: 'Comptage VPH' },
];

const traitements = [
  'Acide oxalique',
  'Acide formique',
  'Thymol',
  'Amitraz',
  'Apivar',
  'Apistan',
  'Autre',
];

const form = reactive<DonneesVarroa>({
  sous_action: props.modelValue.sous_action ?? 'comptage_plancher',
  nombre_varroas: props.modelValue.nombre_varroas,
  duree_comptage_jours: props.modelValue.duree_comptage_jours ?? 3,
  chute_par_jour: props.modelValue.chute_par_jour,
  type_traitement: props.modelValue.type_traitement ?? '',
  dosage: props.modelValue.dosage ?? '',
  date_debut: props.modelValue.date_debut ?? '',
  date_fin_prevue: props.modelValue.date_fin_prevue ?? '',
  numero_lot_produit: props.modelValue.numero_lot_produit ?? '',
  nombre_cadres_retires: props.modelValue.nombre_cadres_retires,
  nombre_abeilles_echantillon: props.modelValue.nombre_abeilles_echantillon ?? 300,
  taux_vph: props.modelValue.taux_vph,
});

const chuteParJour = computed(() => {
  if (
    form.sous_action !== 'comptage_plancher' ||
    form.nombre_varroas == null ||
    !form.duree_comptage_jours ||
    form.duree_comptage_jours <= 0
  ) {
    return null;
  }
  return Math.round((form.nombre_varroas / form.duree_comptage_jours) * 100) / 100;
});

const tauxVph = computed(() => {
  if (
    form.sous_action !== 'comptage_vph' ||
    form.nombre_varroas == null ||
    !form.nombre_abeilles_echantillon ||
    form.nombre_abeilles_echantillon <= 0
  ) {
    return null;
  }
  return Math.round((form.nombre_varroas / form.nombre_abeilles_echantillon) * 100 * 100) / 100;
});

watch(
  () => ({ ...form }),
  () => {
    const data: DonneesVarroa = {
      sous_action: form.sous_action,
    };

    if (form.sous_action === 'comptage_plancher') {
      data.nombre_varroas = form.nombre_varroas;
      data.duree_comptage_jours = form.duree_comptage_jours;
      data.chute_par_jour = chuteParJour.value ?? undefined;
    } else if (form.sous_action === 'traitement') {
      data.type_traitement = form.type_traitement || undefined;
      data.dosage = form.dosage || undefined;
      data.date_debut = form.date_debut || undefined;
      data.date_fin_prevue = form.date_fin_prevue || undefined;
      data.numero_lot_produit = form.numero_lot_produit || undefined;
    } else if (form.sous_action === 'suppression_couvain_male') {
      data.nombre_cadres_retires = form.nombre_cadres_retires;
    } else if (form.sous_action === 'comptage_vph') {
      data.nombre_varroas = form.nombre_varroas;
      data.nombre_abeilles_echantillon = form.nombre_abeilles_echantillon;
      data.taux_vph = tauxVph.value ?? undefined;
    }

    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
