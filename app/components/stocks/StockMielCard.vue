<template>
  <div
    class="group relative overflow-hidden rounded-[14px] border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :class="isAlerte ? 'border-red-200' : 'border-[var(--border-default)]'"
  >
    <!-- Barre de couleur variété -->
    <div class="h-1 w-full" :class="couleurBarre" />

    <div class="p-4">
      <!-- Header : variété + actions -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
              {{ varietelabel }}
            </span>
            <span
              v-if="isAlerte"
              class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100"
            >
              <UIcon name="i-lucide-alert-triangle" class="h-2.5 w-2.5 text-red-500" />
            </span>
          </div>
          <!-- Badges présentation + conditionnement -->
          <div class="mt-1 flex flex-wrap items-center gap-1">
            <span
              v-if="presentationLabel"
              class="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]"
            >
              <UIcon :name="presentationIcon" class="h-2.5 w-2.5" />
              {{ presentationLabel }}
            </span>
            <span
              v-if="stock.conditionnement && stock.conditionnement !== 'vrac'"
              class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]"
            >
              {{ conditionnementLabel }}
            </span>
            <span
              v-if="stock.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--honey-deep)]"
            >
              {{ stock.anneeRecolte }}
            </span>
          </div>
        </div>
        <!-- Actions -->
        <div class="flex shrink-0 items-center gap-0.5">
          <button
            class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-amber-50 hover:text-amber-600"
            title="Entrée de stock"
            @click.stop="$emit('entree')"
          >
            <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          </button>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-orange-50 hover:text-orange-600"
            title="Sortie de stock"
            @click.stop="$emit('sortie')"
          >
            <UIcon name="i-lucide-minus" class="h-3.5 w-3.5" />
          </button>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
            title="Modifier"
            @click.stop="$emit('edit')"
          >
            <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
          </button>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-500"
            title="Supprimer"
            @click.stop="$emit('delete')"
          >
            <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Quantité + valeur -->
      <div class="mb-3 flex items-end justify-between">
        <div>
          <span
            class="text-[22px] font-bold tabular-nums leading-none"
            :class="isAlerte ? 'text-red-500' : 'text-[var(--text-primary)]'"
          >
            {{ quantiteFormatee }}
          </span>
          <span class="ml-1 text-[13px] text-[var(--text-tertiary)]">{{
            stock.unite ?? 'kg'
          }}</span>
        </div>
        <div v-if="valeur > 0" class="text-right">
          <p class="text-[13px] font-semibold tabular-nums text-[var(--honey-deep)]">
            {{ valeur.toFixed(0) }} €
          </p>
          <p class="text-[11px] text-[var(--text-tertiary)]">
            {{ Number(stock.prixUnitaire).toFixed(2) }} €/kg HT
          </p>
        </div>
      </div>

      <!-- Barre de stock vs seuil -->
      <div v-if="stock.seuilAlerte && Number(stock.seuilAlerte) > 0">
        <div class="mb-1 flex items-center justify-between">
          <span class="text-[10px] text-[var(--text-quaternary)]">
            Seuil {{ Number(stock.seuilAlerte) }} {{ stock.unite ?? 'kg' }}
          </span>
          <span
            class="text-[10px]"
            :class="isAlerte ? 'font-semibold text-red-500' : 'text-[var(--text-quaternary)]'"
          >
            {{ isAlerte ? 'ALERTE' : ratioLabel }}
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="barreClass"
            :style="{ width: `${Math.min(ratioStock * 100, 100)}%` }"
          />
        </div>
      </div>

      <!-- Lot + origine si renseignés -->
      <div v-if="stock.numLot || stock.origineGeo" class="mt-2.5 flex flex-wrap gap-1.5">
        <span v-if="stock.numLot" class="text-[11px] text-[var(--text-tertiary)]">
          <UIcon name="i-lucide-tag" class="inline h-3 w-3" /> {{ stock.numLot }}
        </span>
        <span v-if="stock.origineGeo" class="text-[11px] text-[var(--text-tertiary)]">
          <UIcon name="i-lucide-map-pin" class="inline h-3 w-3" /> {{ stock.origineGeo }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TYPES_MIEL, PRESENTATIONS_MIEL, CONDITIONNEMENTS_MIEL } from '~/types/enums';
import { valeurStockMiel } from '~/utils/stockMiel';
import type { Stock } from '~/types/models';

const props = defineProps<{ stock: Stock }>();

defineEmits<{
  entree: [];
  sortie: [];
  edit: [];
  delete: [];
}>();

const varietelabel = computed(() => {
  const t = TYPES_MIEL.find((x) => x.value === props.stock.typeMiel);
  if (t) return t.label;
  // Variété saisie librement : le texte brut est déjà le label
  return props.stock.typeMiel || props.stock.nom || 'Miel';
});

const presentationLabel = computed(() => {
  return PRESENTATIONS_MIEL.find((p) => p.value === props.stock.presentation)?.label ?? '';
});

const presentationIcon = computed(() => {
  return (
    PRESENTATIONS_MIEL.find((p) => p.value === props.stock.presentation)?.icon ??
    'i-lucide-droplets'
  );
});

const conditionnementLabel = computed(() => {
  return (
    CONDITIONNEMENTS_MIEL.find((c) => c.value === props.stock.conditionnement)?.label ??
    props.stock.conditionnement ??
    ''
  );
});

const quantiteFormatee = computed(() => {
  const q = Number(props.stock.quantite);
  if (q >= 1000) return (q / 1000).toFixed(1) + 't';
  return q % 1 === 0 ? q.toString() : q.toFixed(1);
});

// Valeur = (n · m · p) / 1000 — voir ~/utils/stockMiel.ts
const valeur = computed(() => valeurStockMiel(props.stock));

const isAlerte = computed(() => {
  if (!props.stock.seuilAlerte) return false;
  return Number(props.stock.quantite) <= Number(props.stock.seuilAlerte);
});

const ratioStock = computed(() => {
  if (!props.stock.seuilAlerte || Number(props.stock.seuilAlerte) === 0) return 1;
  return Number(props.stock.quantite) / (Number(props.stock.seuilAlerte) * 2);
});

const ratioLabel = computed(() => {
  const ratio = ratioStock.value * 2;
  if (ratio >= 1.5) return 'Bon niveau';
  if (ratio >= 1) return 'Niveau correct';
  return 'Stock bas';
});

const barreClass = computed(() => {
  if (isAlerte.value) return 'bg-red-400';
  if (ratioStock.value < 0.75) return 'bg-[var(--status-warn)]';
  return 'bg-[var(--sage)]';
});

// Couleur de la barre selon la variété
const COULEURS_VARIETE: Record<string, string> = {
  acacia: 'bg-amber-200',
  lavande: 'bg-purple-300',
  chataignier: 'bg-amber-800/60',
  tilleul: 'bg-amber-300',
  colza: 'bg-yellow-300',
  tournesol: 'bg-yellow-400',
  sarrasin: 'bg-stone-500',
  trefle: 'bg-pink-200',
  bruyere_callune: 'bg-purple-200',
  bruyere_erica: 'bg-purple-400',
  thym: 'bg-violet-300',
  romarin: 'bg-blue-200',
  oranger: 'bg-orange-300',
  framboisier: 'bg-rose-300',
  pissenlit: 'bg-yellow-200',
  eucalyptus: 'bg-amber-300',
  toutes_fleurs: 'bg-amber-300',
  montagne: 'bg-sky-300',
  garrigue: 'bg-amber-400',
  printemps: 'bg-amber-200',
  ete: 'bg-orange-200',
  prairie: 'bg-amber-300',
  foret: 'bg-amber-700/60',
  sapin: 'bg-amber-700/60',
  chene: 'bg-amber-900/50',
  epicea: 'bg-amber-600/60',
  miellat_mixte: 'bg-amber-500/60',
  autre: 'bg-stone-300',
};

const couleurBarre = computed(
  () => COULEURS_VARIETE[props.stock.typeMiel ?? ''] ?? 'bg-[var(--honey)]',
);
</script>
