<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <!-- Nom & Categorie -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Nom de l'article *</label>
        <UInput v-model="form.nom" required placeholder="Ex: Cadres Dadant" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Categorie *</label>
        <select
          v-model="form.categorie"
          required
          class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Selectionner</option>
          <option v-for="cat in CATEGORIE_STOCK" :key="cat" :value="cat">
            {{ categorieLabels[cat] || cat }}
          </option>
        </select>
      </div>
    </div>

    <!-- Quantite, Unite, Seuil -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-if="showQuantite">
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantite initiale</label>
        <UInput v-model.number="form.quantite" type="number" step="0.01" min="0" placeholder="0" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Unite</label>
        <UInput v-model="form.unite" placeholder="Ex: pieces, kg, litres" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Seuil d'alerte</label>
        <UInput
          v-model.number="form.seuilAlerte"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
        />
        <p class="mt-1 text-xs text-stone-400">Alerte quand le stock passe en dessous</p>
      </div>
    </div>

    <!-- Prix & Fournisseur -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Prix unitaire (EUR)</label>
        <UInput
          v-model.number="form.prixUnitaire"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Fournisseur</label>
        <UInput v-model="form.fournisseur" placeholder="Nom du fournisseur" />
      </div>
    </div>

    <!-- Emplacement -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Emplacement</label>
      <UInput v-model="form.emplacement" placeholder="Ex: Atelier, Hangar, Cabanon" />
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
      <UTextarea v-model="form.notes" :rows="2" placeholder="Notes supplementaires..." />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton type="submit" :label="submitLabel" color="primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { CATEGORIE_STOCK } from '~/types/enums';

export interface StockFormData {
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  seuilAlerte: number | null;
  prixUnitaire: number | null;
  fournisseur: string;
  emplacement: string;
  notes: string;
}

const props = defineProps<{
  loading?: boolean;
  initial?: Partial<StockFormData>;
  submitLabel?: string;
  showQuantite?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: StockFormData];
  cancel: [];
}>();

const categorieLabels: Record<string, string> = {
  cadres: 'Cadres',
  hausses: 'Hausses',
  corps: 'Corps de ruche',
  nourrissement: 'Nourrissement',
  traitement: 'Traitement',
  conditionnement: 'Conditionnement',
  equipement: 'Equipement',
  outillage: 'Outillage',
  autre: 'Autre',
};

const form = reactive<StockFormData>({
  nom: props.initial?.nom ?? '',
  categorie: props.initial?.categorie ?? '',
  quantite: props.initial?.quantite ?? 0,
  unite: props.initial?.unite ?? '',
  seuilAlerte: props.initial?.seuilAlerte ?? null,
  prixUnitaire: props.initial?.prixUnitaire ?? null,
  fournisseur: props.initial?.fournisseur ?? '',
  emplacement: props.initial?.emplacement ?? '',
  notes: props.initial?.notes ?? '',
});

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
