<template>
  <div class="space-y-4">
    <!-- Sous-action buttons -->
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="action in SOUS_ACTIONS_VARROA"
        :key="action"
        type="button"
        class="min-h-[44px] flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all duration-200"
        :class="
          props.modelValue.sousAction === action
            ? 'border-red-400 bg-red-50 text-red-700'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
        "
        @click="update('sousAction', action)"
      >
        <UIcon :name="SOUS_ACTIONS_VARROA_META[action].icon" class="h-4 w-4" />
        {{ SOUS_ACTIONS_VARROA_META[action].label }}
      </button>
    </div>

    <!-- Comptage plancher -->
    <div
      v-if="props.modelValue.sousAction === 'comptage_plancher'"
      class="space-y-3 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Comptage plancher
      </h4>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Nombre de varroas</label>
          <UInput
            type="number"
            :model-value="props.modelValue.nombreVarroas ?? 0"
            :min="0"
            step="1"
            placeholder="0"
            class="w-full"
            @update:model-value="update('nombreVarroas', Number($event) || 0)"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Duree (jours)</label>
          <UInput
            type="number"
            :model-value="props.modelValue.dureeJours ?? 3"
            :min="1"
            step="1"
            placeholder="3"
            class="w-full"
            @update:model-value="update('dureeJours', Number($event) || 1)"
          />
        </div>
      </div>
      <div
        v-if="chuteParJour !== null"
        class="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3"
      >
        <UIcon name="i-lucide-calculator" class="h-4 w-4 text-stone-400" />
        <span class="text-sm text-stone-600">
          Chute :
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
    <div
      v-if="props.modelValue.sousAction === 'traitement'"
      class="space-y-3 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Traitement</h4>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Type de traitement</label>
        <USelect
          :model-value="props.modelValue.typeTraitement ?? ''"
          :items="traitementOptions"
          value-key="value"
          label-key="label"
          placeholder="Choisir un traitement"
          class="w-full"
          @update:model-value="update('typeTraitement', String($event))"
        />
      </div>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Dosage</label>
        <UInput
          :model-value="props.modelValue.dosage ?? ''"
          placeholder="ex: 3.5ml par inter-cadre"
          class="w-full"
          @update:model-value="update('dosage', String($event))"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Date debut</label>
          <UInput
            type="date"
            :model-value="props.modelValue.dateDebut ?? ''"
            class="w-full"
            @update:model-value="update('dateDebut', String($event))"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Date fin prevue</label>
          <UInput
            type="date"
            :model-value="props.modelValue.dateFinPrevue ?? ''"
            class="w-full"
            @update:model-value="update('dateFinPrevue', String($event))"
          />
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Numero de lot</label>
        <UInput
          :model-value="props.modelValue.numeroLotProduit ?? ''"
          placeholder="ex: LOT-2026-001"
          class="w-full"
          @update:model-value="update('numeroLotProduit', String($event))"
        />
      </div>
    </div>

    <!-- Suppression couvain -->
    <div
      v-if="props.modelValue.sousAction === 'suppression_couvain'"
      class="space-y-3 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Suppression couvain male
      </h4>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Nombre de cadres retires</label>
        <UInput
          type="number"
          :model-value="props.modelValue.nombreCadres ?? 0"
          :min="0"
          step="1"
          placeholder="1"
          class="w-full"
          @update:model-value="update('nombreCadres', Number($event) || 0)"
        />
      </div>
    </div>

    <!-- VPH -->
    <div v-if="props.modelValue.sousAction === 'vph'" class="space-y-3 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        VPH (Varroas Pour 100 abeilles)
      </h4>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Nombre de varroas</label>
          <UInput
            type="number"
            :model-value="props.modelValue.nombreVarroas ?? 0"
            :min="0"
            step="1"
            placeholder="0"
            class="w-full"
            @update:model-value="update('nombreVarroas', Number($event) || 0)"
          />
        </div>
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-stone-600">Nb abeilles echantillon</label>
          <UInput
            type="number"
            :model-value="props.modelValue.nombreAbeilles ?? 300"
            :min="1"
            step="1"
            placeholder="300"
            class="w-full"
            @update:model-value="update('nombreAbeilles', Number($event) || 300)"
          />
        </div>
      </div>
      <div
        v-if="tauxVph !== null"
        class="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3"
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
import {
  SOUS_ACTIONS_VARROA,
  SOUS_ACTIONS_VARROA_META,
  type FormVarroaData,
} from '~/types/interventions';

const props = defineProps<{ modelValue: FormVarroaData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormVarroaData] }>();

function update<K extends keyof FormVarroaData>(key: K, value: FormVarroaData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const chuteParJour = computed(() => {
  const v = props.modelValue;
  if (
    v.sousAction !== 'comptage_plancher' ||
    !v.nombreVarroas ||
    !v.dureeJours ||
    v.dureeJours <= 0
  ) {
    return null;
  }
  return Math.round((v.nombreVarroas / v.dureeJours) * 100) / 100;
});

const tauxVph = computed(() => {
  const v = props.modelValue;
  if (v.sousAction !== 'vph' || !v.nombreVarroas || !v.nombreAbeilles || v.nombreAbeilles <= 0) {
    return null;
  }
  return Math.round((v.nombreVarroas / v.nombreAbeilles) * 100 * 100) / 100;
});

const traitementOptions = [
  { value: 'Acide oxalique', label: 'Acide oxalique' },
  { value: 'Acide formique', label: 'Acide formique' },
  { value: 'Thymol', label: 'Thymol' },
  { value: 'Amitraz', label: 'Amitraz' },
  { value: 'Apivar', label: 'Apivar' },
  { value: 'Apistan', label: 'Apistan' },
  { value: 'Autre', label: 'Autre' },
];
</script>
