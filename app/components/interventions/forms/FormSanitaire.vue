<template>
  <div class="space-y-4">
    <label class="block text-sm font-medium text-stone-600">Type d'evenement sanitaire</label>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="evt in TYPES_EVENEMENT_SANITAIRE"
        :key="evt"
        type="button"
        class="min-h-[44px] flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200"
        :class="
          props.modelValue.typeEvenement === evt
            ? 'border-rose-400 bg-rose-50 text-rose-700'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
        "
        @click="update('typeEvenement', evt)"
      >
        <UIcon :name="iconForType(evt)" class="h-4 w-4" />
        {{ TYPES_EVENEMENT_SANITAIRE_LABELS[evt] }}
      </button>
    </div>

    <!-- Sous-formulaire essaim mort -->
    <template v-if="props.modelValue.typeEvenement === 'essaim_mort'">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Cause probable</label>
        <USelect
          :model-value="props.modelValue.causeProbable ?? ''"
          :items="causeOptions"
          value-key="value"
          label-key="label"
          placeholder="Choisir une cause"
          class="w-full"
          @update:model-value="update('causeProbable', String($event))"
        />
      </div>

      <button
        type="button"
        class="min-h-[44px] flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200"
        :class="
          props.modelValue.declarationGdsa
            ? 'border-[#F5A623]/60 bg-amber-50 text-amber-700'
            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
        "
        @click="update('declarationGdsa', !props.modelValue.declarationGdsa)"
      >
        <UIcon
          :name="props.modelValue.declarationGdsa ? 'i-lucide-check-square' : 'i-lucide-square'"
          class="h-5 w-5"
        />
        <div class="text-left">
          <span class="text-sm font-medium">Declaration GDSA</span>
          <p class="text-xs text-stone-400">Declarer au Groupement de Defense Sanitaire Apicole</p>
        </div>
      </button>
    </template>

    <!-- Sous-formulaire nettoyage -->
    <template v-if="props.modelValue.typeEvenement === 'nettoyer_ruche'">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Type de nettoyage</label>
        <USelect
          :model-value="props.modelValue.typeNettoyage ?? ''"
          :items="nettoyageRucheOptions"
          value-key="value"
          label-key="label"
          placeholder="Choisir un type"
          class="w-full"
          @update:model-value="update('typeNettoyage', String($event))"
        />
      </div>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Produit utilise</label>
        <UInput
          :model-value="props.modelValue.produitUtilise ?? ''"
          placeholder="ex: Soude caustique, javel..."
          class="w-full"
          @update:model-value="update('produitUtilise', String($event))"
        />
      </div>
    </template>

    <!-- Sous-formulaire nettoyage plancher -->
    <template v-if="props.modelValue.typeEvenement === 'nettoyer_plancher'">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Type de nettoyage</label>
        <USelect
          :model-value="props.modelValue.typeNettoyage ?? ''"
          :items="nettoyagePlancherOptions"
          value-key="value"
          label-key="label"
          placeholder="Choisir un type"
          class="w-full"
          @update:model-value="update('typeNettoyage', String($event))"
        />
      </div>
    </template>

    <!-- Sous-formulaire retrait couvain -->
    <template v-if="props.modelValue.typeEvenement === 'retrait_couvain'">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Type de couvain</label>
        <USelect
          :model-value="props.modelValue.typeCouvain ?? ''"
          :items="couvainOptions"
          value-key="value"
          label-key="label"
          placeholder="Choisir un type"
          class="w-full"
          @update:model-value="update('typeCouvain', String($event))"
        />
      </div>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Nombre de cadres</label>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  TYPES_EVENEMENT_SANITAIRE,
  TYPES_EVENEMENT_SANITAIRE_LABELS,
  type TypeEvenementSanitaire,
  type FormSanitaireData,
} from '~/types/interventions';

const props = defineProps<{ modelValue: FormSanitaireData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormSanitaireData] }>();

function update<K extends keyof FormSanitaireData>(key: K, value: FormSanitaireData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function iconForType(t: TypeEvenementSanitaire): string {
  const icons: Record<TypeEvenementSanitaire, string> = {
    essaim_mort: 'i-lucide-skull',
    nettoyer_ruche: 'i-lucide-spray-can',
    nettoyer_plancher: 'i-lucide-paintbrush',
    retrait_couvain: 'i-lucide-scissors',
  };
  return icons[t];
}

const causeOptions = [
  { value: 'Varroa', label: 'Varroa' },
  { value: 'Famine', label: 'Famine' },
  { value: 'Pesticides', label: 'Pesticides' },
  { value: 'Maladie', label: 'Maladie' },
  { value: 'Pillage', label: 'Pillage' },
  { value: 'Froid', label: 'Froid' },
  { value: 'Inconnue', label: 'Inconnue' },
  { value: 'Autre', label: 'Autre' },
];

const nettoyageRucheOptions = [
  { value: 'Grattage', label: 'Grattage' },
  { value: 'Flambage', label: 'Flambage' },
  { value: 'Desinfection', label: 'Desinfection' },
  { value: 'Autre', label: 'Autre' },
];

const nettoyagePlancherOptions = [
  { value: 'Grattage', label: 'Grattage' },
  { value: 'Remplacement', label: 'Remplacement' },
  { value: 'Nettoyage eau', label: 'Nettoyage eau' },
  { value: 'Flambage', label: 'Flambage' },
];

const couvainOptions = [
  { value: 'Couvain male', label: 'Couvain male' },
  { value: 'Couvain malade', label: 'Couvain malade' },
  { value: 'Couvain mort', label: 'Couvain mort' },
];
</script>
