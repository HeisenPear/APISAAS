<template>
  <div class="space-y-5">
    <!-- Choix du produit (Boutons de selection) -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-stone-600">Choix du produit</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in produitOptions"
          :key="opt.value"
          type="button"
          class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200"
          :class="
            form.type_produit === opt.value
              ? 'border-amber-500 bg-amber-50 shadow-sm'
              : 'border-stone-200/60 bg-white hover:border-stone-300'
          "
          @click="form.type_produit = opt.value"
        >
          <span class="text-2xl">{{ opt.icon }}</span>
          <span
            class="text-sm font-medium"
            :class="form.type_produit === opt.value ? 'text-amber-700' : 'text-stone-600'"
          >
            {{ opt.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Quantite + Unite -->
    <div class="flex gap-3">
      <div class="flex-1 space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Quantite</label>
        <input
          v-model.number="form.quantite"
          type="number"
          min="0"
          step="0.1"
          placeholder="0"
          class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <div class="w-28 space-y-1.5">
        <label class="block text-sm font-medium text-stone-600">Unite</label>
        <select
          v-model="form.unite"
          class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="litres">litres</option>
        </select>
      </div>
    </div>

    <!-- Type de miel (conditionnel) -->
    <div v-if="form.type_produit === 'miel'" class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Type de miel</label>
      <select
        v-model="form.type_miel"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">-- Selectionner --</option>
        <option v-for="type in typesMiel" :key="type" :value="type">{{ type }}</option>
      </select>
    </div>

    <!-- Taux humidite -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Taux d'humidite (%)
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <input
        v-model.number="form.taux_humidite"
        type="number"
        min="0"
        max="100"
        step="0.1"
        placeholder="Ex: 17.5"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Numero lot -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">Numero de lot</label>
      <input
        v-model="form.numero_lot"
        type="text"
        placeholder="Ex: LOT-2026-001"
        class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Notes qualite -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-stone-600">
        Notes de qualite
        <span class="text-stone-400 font-normal">optionnel</span>
      </label>
      <textarea
        v-model="form.notes_qualite"
        :rows="3"
        placeholder="Couleur, texture, observations..."
        class="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-colors duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DonneesRecolte } from '~/types/interventions';

const props = defineProps<{
  modelValue: DonneesRecolte;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DonneesRecolte];
}>();

const produitOptions = [
  { value: 'miel' as const, label: 'Miel', icon: '\u{1F36F}' },
  { value: 'pollen' as const, label: 'Pollen', icon: '\u{1F33B}' },
  { value: 'propolis' as const, label: 'Propolis', icon: '\u{1FAB5}' },
];

const typesMiel = [
  'Acacia',
  'Toutes fleurs',
  'Chataignier',
  'Lavande',
  'Tilleul',
  'Colza',
  'Tournesol',
  'Bruyere',
  'Sapin',
  'Montagne',
  'Autre',
];

const form = reactive<{
  type_produit: DonneesRecolte['type_produit'];
  quantite: number;
  unite: DonneesRecolte['unite'];
  type_miel: string;
  taux_humidite: number | undefined;
  numero_lot: string;
  notes_qualite: string;
}>({
  type_produit: props.modelValue.type_produit,
  quantite: props.modelValue.quantite,
  unite: props.modelValue.unite,
  type_miel: props.modelValue.type_miel ?? '',
  taux_humidite: props.modelValue.taux_humidite,
  numero_lot: props.modelValue.numero_lot,
  notes_qualite: props.modelValue.notes_qualite ?? '',
});

watch(
  form,
  () => {
    const data: DonneesRecolte = {
      type_produit: form.type_produit,
      quantite: form.quantite,
      unite: form.unite,
      numero_lot: form.numero_lot,
    };
    if (form.type_produit === 'miel' && form.type_miel) {
      data.type_miel = form.type_miel;
    }
    if (form.taux_humidite != null && form.taux_humidite > 0) {
      data.taux_humidite = form.taux_humidite;
    }
    if (form.notes_qualite.trim()) {
      data.notes_qualite = form.notes_qualite.trim();
    }
    emit('update:modelValue', data);
  },
  { deep: true },
);
</script>
