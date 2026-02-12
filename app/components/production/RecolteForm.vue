<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Rucher & Ruche -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Rucher</label>
        <select
          v-model="form.rucherId"
          class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @change="onRucherChange"
        >
          <option value="">Selectionner un rucher</option>
          <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Ruche (optionnel)</label>
        <select
          v-model="form.rucheId"
          class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Toutes les ruches</option>
          <option v-for="r in filteredRuches" :key="r.id" :value="r.id">
            {{ r.numero }}
          </option>
        </select>
      </div>
    </div>

    <!-- Date & Type miel -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Date de recolte *</label>
        <UInput v-model="form.dateRecolte" type="date" required />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Type de miel</label>
        <select
          v-model="form.typeMiel"
          class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Selectionner</option>
          <option v-for="t in typesMiel" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <!-- Quantite & Humidite -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantite (kg)</label>
        <UInput v-model.number="form.quantiteKg" type="number" step="0.1" min="0" placeholder="0" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Humidite (%)</label>
        <UInput
          v-model.number="form.humidite"
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder="0"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Nombre de hausses</label>
        <UInput v-model.number="form.nombreHausses" type="number" min="0" placeholder="0" />
      </div>
    </div>

    <!-- Lot -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Numero de lot</label>
      <UInput v-model="form.numeroLot" placeholder="Ex: LOT-2026-001" />
      <p class="mt-1 text-xs text-stone-400">Permet la tracabilite du miel</p>
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
      <UTextarea v-model="form.notes" :rows="3" placeholder="Observations sur la recolte..." />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton type="submit" :label="submitLabel" color="primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Rucher, Ruche } from '~/types/models';

export interface RecolteFormData {
  rucherId: string;
  rucheId: string;
  dateRecolte: string;
  typeMiel: string;
  quantiteKg: number | null;
  humidite: number | null;
  nombreHausses: number | null;
  numeroLot: string;
  notes: string;
}

const props = defineProps<{
  ruchers: Rucher[];
  ruches: (Ruche & { rucherNom?: string })[];
  loading?: boolean;
  initial?: Partial<RecolteFormData>;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  submit: [data: RecolteFormData];
  cancel: [];
}>();

const typesMiel = [
  'Toutes fleurs',
  'Acacia',
  'Tilleul',
  'Lavande',
  'Chataignier',
  'Colza',
  'Tournesol',
  'Bruyere',
  'Sapin',
  'Montagne',
  'Foret',
  'Garrigue',
  'Maquis',
  'Sarrasin',
  'Autre',
];

const form = reactive<RecolteFormData>({
  rucherId: props.initial?.rucherId ?? '',
  rucheId: props.initial?.rucheId ?? '',
  dateRecolte: props.initial?.dateRecolte ?? new Date().toISOString().slice(0, 10),
  typeMiel: props.initial?.typeMiel ?? '',
  quantiteKg: props.initial?.quantiteKg ?? null,
  humidite: props.initial?.humidite ?? null,
  nombreHausses: props.initial?.nombreHausses ?? null,
  numeroLot: props.initial?.numeroLot ?? '',
  notes: props.initial?.notes ?? '',
});

const filteredRuches = computed(() => {
  if (!form.rucherId) return props.ruches;
  return props.ruches.filter((r) => r.rucherId === form.rucherId);
});

function onRucherChange() {
  // Reset ruche if it doesn't belong to new rucher
  if (form.rucheId) {
    const ruche = props.ruches.find((r) => r.id === form.rucheId);
    if (ruche && ruche.rucherId !== form.rucherId) {
      form.rucheId = '';
    }
  }
}

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
