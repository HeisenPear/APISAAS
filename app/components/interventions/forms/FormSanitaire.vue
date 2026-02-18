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
            ? 'bg-rose-50 text-rose-700 ring-2 ring-rose-400'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        "
        @click="form.sous_action = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Essaim mort -->
    <div v-if="form.sous_action === 'essaim_mort'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Essaim mort</h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Cause probable</label>
        <select
          v-model="form.cause_probable"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Choisir une cause</option>
          <option v-for="c in causesProbables" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <label
        class="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border border-stone-200 cursor-pointer"
      >
        <input
          v-model="form.declaration_gdsa"
          type="checkbox"
          class="h-4 w-4 rounded accent-amber-500"
        />
        <div>
          <span class="text-sm font-medium text-stone-700">Declaration GDSA</span>
          <p class="text-xs text-stone-400">
            Declarer la mortalite aupres du Groupement de Defense Sanitaire Apicole
          </p>
        </div>
      </label>
    </div>

    <!-- Nettoyer ruche -->
    <div v-if="form.sous_action === 'nettoyer_ruche'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Nettoyage ruche</h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Type de nettoyage</label>
        <select
          v-model="form.type_nettoyage"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Choisir un type</option>
          <option v-for="t in typesNettoyageRuche" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Produit utilise</label>
        <input
          v-model="form.produit_utilise"
          type="text"
          placeholder="ex: Soude caustique, javel..."
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>

    <!-- Nettoyer plancher -->
    <div
      v-if="form.sous_action === 'nettoyer_plancher'"
      class="space-y-4 rounded-xl bg-stone-50 p-4"
    >
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Nettoyage plancher
      </h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Type de nettoyage</label>
        <select
          v-model="form.type_nettoyage"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Choisir un type</option>
          <option v-for="t in typesNettoyagePlancher" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <!-- Retrait couvain -->
    <div v-if="form.sous_action === 'retrait_couvain'" class="space-y-4 rounded-xl bg-stone-50 p-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">Retrait couvain</h4>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Type de couvain</label>
        <select
          v-model="form.type_couvain"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Choisir un type</option>
          <option v-for="t in typesCouvain" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-600">Nombre de cadres</label>
        <input
          v-model.number="form.nombre_cadres"
          type="number"
          min="0"
          step="1"
          placeholder="1"
          class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesSanitaire } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesSanitaire;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesSanitaire];
}>();

const sousActions = [
  { value: 'essaim_mort' as const, label: 'Essaim mort' },
  { value: 'nettoyer_ruche' as const, label: 'Nettoyer ruche' },
  { value: 'nettoyer_plancher' as const, label: 'Nettoyer plancher' },
  { value: 'retrait_couvain' as const, label: 'Retrait couvain' },
];

const causesProbables = [
  'Varroa',
  'Famine',
  'Pesticides',
  'Maladie',
  'Pillage',
  'Froid',
  'Inconnue',
  'Autre',
];

const typesNettoyageRuche = ['Grattage', 'Flambage', 'Desinfection', 'Autre'];
const typesNettoyagePlancher = ['Grattage', 'Remplacement', 'Nettoyage eau', 'Flambage'];
const typesCouvain = ['Couvain male', 'Couvain malade', 'Couvain mort'];

const form = reactive<DonneesSanitaire>({
  sous_action: props.modelValue.sous_action ?? 'essaim_mort',
  cause_probable: props.modelValue.cause_probable ?? '',
  declaration_gdsa: props.modelValue.declaration_gdsa ?? false,
  type_nettoyage: props.modelValue.type_nettoyage ?? '',
  produit_utilise: props.modelValue.produit_utilise ?? '',
  type_couvain: props.modelValue.type_couvain ?? '',
  nombre_cadres: props.modelValue.nombre_cadres,
});

watch(
  () => ({ ...form }),
  () => {
    const data: DonneesSanitaire = {
      sous_action: form.sous_action,
    };

    if (form.sous_action === 'essaim_mort') {
      data.cause_probable = form.cause_probable || undefined;
      data.declaration_gdsa = form.declaration_gdsa;
    } else if (form.sous_action === 'nettoyer_ruche') {
      data.type_nettoyage = form.type_nettoyage || undefined;
      data.produit_utilise = form.produit_utilise || undefined;
    } else if (form.sous_action === 'nettoyer_plancher') {
      data.type_nettoyage = form.type_nettoyage || undefined;
    } else if (form.sous_action === 'retrait_couvain') {
      data.type_couvain = form.type_couvain || undefined;
      data.nombre_cadres = form.nombre_cadres;
    }

    emit('update:modelValue', data);
  },
  { deep: true, immediate: true },
);
</script>
