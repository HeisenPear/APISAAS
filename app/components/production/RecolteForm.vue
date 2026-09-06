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
        <!-- Liste vide : le champ s'ouvrait sur une seule ligne inerte, sans
             dire d'où viennent les ruchers ni où en créer un. -->
        <p v-if="ruchersCharges && !ruchers.length" class="mt-1.5 text-xs text-stone-500">
          Aucun rucher enregistré —
          <NuxtLink to="/ruchers/nouveau" class="font-medium text-amber-700 hover:underline">
            en créer un
          </NuxtLink>
          pour rattacher cette récolte à son origine.
        </p>
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
        <UiMobileDatePicker v-model="form.dateRecolte" mode="date" />
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

    <!-- Suggestion de la balance : ce que la ruche a réellement perdu ce jour-là -->
    <button
      v-if="chuteBalance"
      type="button"
      class="flex w-full items-start gap-2.5 rounded-[12px] border border-[var(--honey)] bg-[var(--honey-soft)] px-3.5 py-2.5 text-left transition-all hover:shadow-sm"
      @click="appliquerChute"
    >
      <UIcon name="i-lucide-scale" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]" />
      <span class="flex-1">
        <span class="block text-[13px] font-semibold text-[var(--honey-deep)]">
          La balance a mesuré −{{ chuteBalance.chuteKg }} kg
        </span>
        <span class="block text-[12px] text-[var(--text-secondary)]">
          {{ chuteBalance.balanceNom }} · {{ chuteBalance.poidsAvantKg }} kg →
          {{ chuteBalance.poidsApresKg }} kg. Toucher pour utiliser cette quantité.
        </span>
      </span>
    </button>

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

const props = withDefaults(
  defineProps<{
    ruchers: Rucher[];
    ruches: (Ruche & { rucherNom?: string })[];
    loading?: boolean;
    initial?: Partial<RecolteFormData>;
    submitLabel?: string;
    /**
     * La liste des ruchers est-elle ARRIVÉE ? Une liste encore vide parce
     * qu'elle charge est indiscernable d'un compte sans rucher : sans cette
     * information, « aucun rucher enregistré » clignote chez tout le monde.
     */
    ruchersCharges?: boolean;
  }>(),
  // `undefined` explicite : le composant traite déjà ces deux cas, mais passer
  // par `withDefaults` oblige à les déclarer.
  { ruchersCharges: true, initial: undefined, submitLabel: undefined },
);

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
  dateRecolte: props.initial?.dateRecolte ?? dateDuJour(),
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

// ─── Suggestion issue de la balance ────────────────────────────────────────
// Si une balance est posée sous la ruche choisie, on peut lui demander ce que
// la colonie a réellement perdu ce jour-là : c'est une mesure, pas une
// estimation à l'œil. Purement indicatif — l'apiculteur reste maître du chiffre.

interface ChuteBalance {
  balanceId: string;
  balanceNom: string;
  poidsAvantKg: number | null;
  poidsApresKg: number | null;
  chuteKg: number | null;
}

const chuteBalance = ref<ChuteBalance | null>(null);

watch(
  () => [form.rucheId, form.dateRecolte],
  async ([rucheId, date]) => {
    chuteBalance.value = null;
    if (!rucheId || !date) return;
    try {
      const res = await appelApi<{ data: ChuteBalance | null }>('/api/balances/chute', {
        query: { rucheId, date },
      });
      // On n'affiche la suggestion que si une VRAIE baisse a été mesurée.
      chuteBalance.value = res.data?.chuteKg ? res.data : null;
    } catch {
      // Pas de balance, plan insuffisant, réseau : la saisie manuelle reste la norme.
      chuteBalance.value = null;
    }
  },
  { immediate: true },
);

function appliquerChute() {
  if (chuteBalance.value?.chuteKg) form.quantiteKg = chuteBalance.value.chuteKg;
}

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
