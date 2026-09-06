<script setup lang="ts">
/**
 * Formulaire d'achat de matériel depuis la page Stocks.
 *
 * Un achat alimente l'inventaire (entrée stock, type = materiel) ET crée
 * la dépense côté Finances — via /api/finances/achats avec
 * ajouterAuStock + stockType='materiel'. Une seule action, deux effets.
 */
defineProps<{ loading?: boolean }>();
const emit = defineEmits<{ submit: [data: AchatMaterielData]; cancel: [] }>();

export interface AchatMaterielData {
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  tauxTva: number;
  seuilAlerte: number | null;
  dateTransaction: string;
  fournisseur: string;
  notes: string;
}

const CATEGORIES = [
  { value: 'cadres', label: 'Cadres' },
  { value: 'hausses', label: 'Hausses' },
  { value: 'corps', label: 'Corps de ruche' },
  { value: 'nourrissement', label: 'Nourrissement' },
  { value: 'traitement', label: 'Traitement' },
  { value: 'conditionnement', label: 'Conditionnement' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'outillage', label: 'Outillage' },
  { value: 'maturateur', label: 'Maturateur / fût' },
  { value: 'autre', label: 'Autre' },
];

const form = reactive<AchatMaterielData>({
  nom: '',
  categorie: 'equipement',
  quantite: 1,
  unite: 'unités',
  prixUnitaire: 0,
  tauxTva: 20,
  seuilAlerte: null,
  dateTransaction: dateDuJour(),
  fournisseur: '',
  notes: '',
});

const totalTtc = computed(() => {
  const ht = ligneTotalHt(form);
  return round2(ht + ligneTva(ht, form.tauxTva));
});

const canSubmit = computed(() => form.nom.trim().length > 0 && form.quantite > 0);

function handleSubmit() {
  if (!canSubmit.value) return;
  emit('submit', { ...form });
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Désignation *</label>
      <UInput v-model="form.nom" placeholder="Ex: Cadres filés Dadant, lève-cadres…" autofocus />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Catégorie</label>
        <select
          v-model="form.categorie"
          class="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-[14px]"
        >
          <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Date d'achat</label>
        <UiMobileDatePicker v-model="form.dateTransaction" mode="date" />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantité</label>
        <UInput v-model.number="form.quantite" type="number" step="1" min="0" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Unité</label>
        <UInput v-model="form.unite" placeholder="unités" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Prix HT / unité (€)</label>
        <UInput v-model.number="form.prixUnitaire" type="number" step="0.01" min="0" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">TVA (%)</label>
        <UInput v-model.number="form.tauxTva" type="number" step="0.1" min="0" max="100" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Seuil d'alerte</label>
        <UInput v-model.number="form.seuilAlerte" type="number" step="1" min="0" placeholder="—" />
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-sm font-medium text-stone-700">Fournisseur</label>
      <UInput v-model="form.fournisseur" placeholder="Optionnel" />
    </div>

    <div
      class="flex items-center justify-between rounded-[10px] bg-[var(--surface-muted)] px-4 py-3 text-sm"
    >
      <span class="text-stone-500">Total TTC de l'achat</span>
      <span class="font-semibold text-stone-900">{{ totalTtc.toFixed(2) }} €</span>
    </div>
    <p class="text-[12px] text-stone-400">
      Cet achat crée l'entrée en stock <strong>et</strong> la dépense correspondante dans vos
      finances.
    </p>

    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="emit('cancel')" />
      <UButton
        type="submit"
        label="Enregistrer l'achat"
        color="primary"
        :loading="loading"
        :disabled="!canSubmit"
      />
    </div>
  </form>
</template>
