<template>
  <form class="space-y-5" @submit.prevent="$emit('submit')">
    <!-- Client -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
        >Client</label
      >
      <div class="relative">
        <select
          :value="modelValue.clientId"
          class="h-11 w-full appearance-none rounded-[10px] border border-[var(--border-default)] bg-white px-4 pr-9 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          @change="update('clientId', ($event.target as HTMLSelectElement).value || undefined)"
        >
          <option value="">Sans client</option>
          <option v-for="c in clients" :key="c.id" :value="c.id">
            {{ clientDisplayName(c) }}{{ clientTypeSuffix(c) }}
          </option>
        </select>
        <UIcon
          name="i-lucide-chevron-down"
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
      </div>
    </div>

    <!-- Date + Échéance -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Date <span class="text-[var(--status-bad)]">*</span></label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateTransaction ?? null"
          mode="date"
          @update:model-value="update('dateTransaction', $event ?? '')"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
          >Échéance</label
        >
        <UiMobileDatePicker
          :model-value="modelValue.dateEcheance ?? null"
          mode="date"
          @update:model-value="update('dateEcheance', $event ?? undefined)"
        />
      </div>
    </div>

    <!-- Stock picker -->
    <div
      v-if="availableStocks.length > 0"
      class="rounded-[12px] border border-[var(--honey)]/30 bg-[var(--honey-soft)] p-4"
    >
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--honey)]">
          <UIcon name="i-lucide-warehouse" class="h-4 w-4 text-white" />
        </div>
        <div>
          <p class="text-[13px] font-semibold text-[var(--honey-deep)]">Vendre depuis vos stocks</p>
          <p class="text-[11px] text-[var(--honey-deep)]/70">
            {{ availableStocks.length }} produit(s) disponible(s)
          </p>
        </div>
      </div>
      <!-- Honey stocks en premier -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="stock in availableStocks"
          :key="stock.id"
          type="button"
          class="flex flex-col items-start gap-1 rounded-[10px] border border-[var(--honey)]/20 bg-white p-3 text-left transition-all hover:border-[var(--honey)]/60 hover:shadow-sm"
          @click="addStockLine(stock)"
        >
          <span class="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{{
            stock.nom
          }}</span>
          <!-- Honey traceability preview -->
          <div v-if="stock.typeMiel" class="flex flex-wrap gap-1">
            <span
              class="rounded-full bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--honey-deep)]"
            >
              {{ varietelabel(stock.typeMiel) }}
            </span>
            <span
              v-if="stock.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] text-[var(--honey-deep)]"
            >
              {{ stock.anneeRecolte }}
            </span>
          </div>
          <div class="flex w-full items-center justify-between">
            <span class="text-[11px] text-[var(--text-tertiary)]"
              >{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }}</span
            >
            <span
              v-if="stock.prixUnitaire"
              class="rounded-[6px] bg-[var(--honey-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--honey-deep)]"
            >
              {{ formatMoney(Number(stock.prixUnitaire)) }}/{{ stock.unite ?? 'u' }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Lignes de facturation -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-[13px] font-semibold text-[var(--text-primary)]">Lignes</label>
        <button
          type="button"
          class="flex items-center gap-1 rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
          @click="addEmptyLine"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Ligne libre
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(ligne, index) in modelValue.lignes"
          :key="index"
          class="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
        >
          <!-- Stock / Honey badge -->
          <div
            v-if="ligne.stockId || ligne.typeMiel"
            class="mb-2 flex flex-wrap items-center gap-1.5"
          >
            <span
              v-if="ligne.stockId"
              class="flex items-center gap-1 text-[11px] font-medium text-[var(--honey-deep)]"
            >
              <UIcon name="i-lucide-warehouse" class="h-3 w-3" /> Stock
            </span>
            <span
              v-if="ligne.typeMiel"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--honey-deep)]"
            >
              🍯 {{ varietelabel(ligne.typeMiel) }}
            </span>
            <span
              v-if="ligne.anneeRecolte"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] text-[var(--honey-deep)]"
            >
              {{ ligne.anneeRecolte }}
            </span>
            <span
              v-if="ligne.numLot"
              class="rounded-full bg-[var(--surface-muted)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]"
            >
              {{ ligne.numLot }}
            </span>
            <span v-if="ligne.origineGeo" class="text-[10px] text-[var(--text-tertiary)]">
              <UIcon name="i-lucide-map-pin" class="inline h-2.5 w-2.5" /> {{ ligne.origineGeo }}
            </span>
          </div>

          <div class="grid grid-cols-12 items-end gap-2">
            <!-- Description -->
            <div class="col-span-5">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Description</label
              >
              <input
                :value="ligne.description"
                type="text"
                required
                placeholder="Description"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(index, 'description', ($event.target as HTMLInputElement).value)
                "
              />
            </div>
            <!-- Quantité -->
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Qté</label
              >
              <input
                :value="ligne.quantite"
                type="number"
                min="0.01"
                step="0.01"
                required
                :max="ligne.stockQuantite ?? undefined"
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(index, 'quantite', Number(($event.target as HTMLInputElement).value))
                "
              />
              <p
                v-if="ligne.stockQuantite"
                class="mt-0.5 text-[10px] text-[var(--text-quaternary)]"
              >
                max {{ ligne.stockQuantite }}
              </p>
            </div>
            <!-- Prix unitaire HT -->
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >PU HT (€)</label
              >
              <input
                :value="ligne.prixUnitaire"
                type="number"
                min="0"
                step="0.01"
                required
                class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
                @input="
                  updateLigne(
                    index,
                    'prixUnitaire',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
            </div>
            <!-- Total HT -->
            <div class="col-span-2 text-right">
              <label v-if="index === 0" class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                >Total HT</label
              >
              <p class="py-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                {{ formatMoney(ligneTotalHt(ligne)) }}
              </p>
              <p
                v-if="ligne.modePrix === 'poids' && ligne.contenance"
                class="text-[10px] text-[var(--text-tertiary)]"
              >
                {{ ligne.quantite }} × {{ ligne.contenance }}{{ ligne.uniteContenance || '' }}
              </p>
            </div>
            <!-- Supprimer -->
            <div class="col-span-1 flex justify-end">
              <button
                v-if="modelValue.lignes.length > 1"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500"
                @click="removeLine(index)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- TVA par ligne -->
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-[var(--text-tertiary)]">TVA :</span>
            <button
              v-for="taux in TVA_RATES"
              :key="taux.value"
              type="button"
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all"
              :class="
                ligne.tauxTva === taux.value
                  ? taux.activeClass
                  : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)] hover:bg-[var(--border-default)]'
              "
              :title="taux.description"
              @click="updateLigne(index, 'tauxTva', taux.value)"
            >
              {{ taux.value }}%
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Remise -->
    <div class="flex items-center gap-3">
      <label class="shrink-0 text-[13px] font-semibold text-[var(--text-primary)]">Remise</label>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          :value="modelValue.remise ?? 0"
          placeholder="0"
          class="w-20 rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          @input="update('remise', Number(($event.target as HTMLInputElement).value) || 0)"
        />
        <span class="text-[13px] text-[var(--text-secondary)]">%</span>
        <span v-if="(modelValue.remise ?? 0) > 0" class="text-[12px] text-emerald-600">
          — {{ formatMoney(remiseMontant) }} déduits
        </span>
      </div>
    </div>

    <!-- Récapitulatif TVA -->
    <div
      class="ml-auto w-72 space-y-1.5 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
    >
      <div class="flex justify-between text-[13px] text-[var(--text-secondary)]">
        <span>Sous-total HT</span>
        <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
      </div>
      <div
        v-if="(modelValue.remise ?? 0) > 0"
        class="flex justify-between text-[12px] text-emerald-600"
      >
        <span>Remise ({{ modelValue.remise }}%)</span>
        <span>- {{ formatMoney(remiseMontant) }}</span>
      </div>
      <div
        v-if="(modelValue.remise ?? 0) > 0"
        class="flex justify-between text-[12px] text-[var(--text-secondary)]"
      >
        <span>HT net</span>
        <span class="font-medium">{{ formatMoney(sousTotalNet) }}</span>
      </div>
      <template v-for="(amount, rate) in tvaParTaux" :key="rate">
        <div class="flex justify-between text-[12px] text-[var(--text-tertiary)]">
          <span>TVA {{ rate }}%</span>
          <span>{{ formatMoney(amount) }}</span>
        </div>
      </template>
      <div
        class="flex justify-between border-t border-[var(--border-default)] pt-2 text-[15px] font-bold text-[var(--text-primary)]"
      >
        <span>Total TTC</span>
        <span>{{ formatMoney(totalTTC) }}</span>
      </div>
    </div>

    <!-- Nature de l'opération -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
        Nature de l'opération <span class="text-[var(--status-bad)]">*</span>
      </label>
      <div class="flex gap-2">
        <button
          v-for="cat in CATEGORIES_OPERATION"
          :key="cat.value"
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border-2 px-3 py-2 text-[12px] font-medium transition-all"
          :class="
            modelValue.categorieOperation === cat.value
              ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
              : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          "
          @click="update('categorieOperation', cat.value)"
        >
          <UIcon :name="cat.icon" class="h-4 w-4" />
          {{ cat.label }}
        </button>
      </div>
      <p class="mt-1 text-[11px] text-[var(--text-tertiary)]">
        Mention obligatoire depuis sept. 2026 (décret n° 2022-1299)
      </p>
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">Notes</label>
      <textarea
        :value="modelValue.notes"
        :rows="2"
        class="w-full resize-none rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
        placeholder="Notes optionnelles…"
        @input="update('notes', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Client, Stock } from '~/types/models';
import { TVA_PAR_CATEGORIE_VENTE, TYPES_MIEL } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva: number;
  modePrix?: 'format' | 'poids';
  contenance?: number | null;
  uniteContenance?: string;
  stockId?: string;
  stockQuantite?: number;
  // Traçabilité miel — Décret 2003-587
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
}

interface VenteFormData {
  clientId?: string;
  dateTransaction: string;
  dateEcheance?: string;
  lignes: Ligne[];
  remise?: number;
  notes?: string;
  categorieOperation: 'livraison_biens' | 'prestation_services' | 'mixte';
}

const CATEGORIES_OPERATION = [
  { value: 'livraison_biens', label: 'Livraison de biens', icon: 'i-lucide-package' },
  { value: 'prestation_services', label: 'Prestation', icon: 'i-lucide-briefcase' },
  { value: 'mixte', label: 'Mixte', icon: 'i-lucide-shuffle' },
] as const;

const TVA_RATES = [
  {
    value: 5.5,
    label: '5,5%',
    activeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Alimentaire — Art. 278-0 bis A CGI (miel, pollen, gelée royale…)',
  },
  {
    value: 10,
    label: '10%',
    activeClass: 'bg-blue-100 text-blue-700',
    description: 'Animaux vivants & médicaments vétérinaires — Art. 278 bis CGI',
  },
  {
    value: 20,
    label: '20%',
    activeClass: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
    description: 'Taux normal — matériel, équipements, hydromel, cosmétiques…',
  },
  {
    value: 0,
    label: '0%',
    activeClass: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]',
    description: 'Franchise en base (Art. 293 B CGI) / Export / Intra-UE',
  },
] as const;

const props = defineProps<{
  modelValue: VenteFormData;
  clients: Client[];
  stocks?: Stock[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: VenteFormData];
  submit: [];
}>();

function varietelabel(typeMiel: string) {
  return TYPES_MIEL.find((t) => t.value === typeMiel)?.label ?? typeMiel;
}

function clientDisplayName(c: Client) {
  return c.entreprise || `${c.nom} ${c.prenom ?? ''}`.trim();
}

function clientTypeSuffix(c: Client) {
  if (c.type === 'revendeur') return ' (Revendeur)';
  if (c.type === 'professionnel') return ' (Pro)';
  return '';
}

const availableStocks = computed(() => {
  const list = (props.stocks ?? []).filter((s) => Number(s.quantite) > 0);
  return [...list].sort((a, b) => {
    if (a.typeMiel && !b.typeMiel) return -1;
    if (!a.typeMiel && b.typeMiel) return 1;
    return 0;
  });
});

// Total HT d'une ligne — miroir client de server/utils/pricing.ligneTotalHt
// (mode poids : quantité × contenance × prix ; sinon quantité × prix)
function ligneTotalHt(l: Pick<Ligne, 'quantite' | 'prixUnitaire' | 'modePrix' | 'contenance'>) {
  const q = Number(l.quantite) || 0;
  const pu = Number(l.prixUnitaire) || 0;
  if (l.modePrix === 'poids') {
    const c = Number(l.contenance) || 0;
    if (c > 0) return q * c * pu;
  }
  return q * pu;
}

const sousTotal = computed(() =>
  props.modelValue.lignes.reduce((sum, l) => sum + ligneTotalHt(l), 0),
);

const remiseRatio = computed(() => {
  const r = props.modelValue.remise ?? 0;
  return r > 0 ? (100 - r) / 100 : 1;
});

const remiseMontant = computed(() => {
  const r = props.modelValue.remise ?? 0;
  return r > 0 ? Math.round(sousTotal.value * r) / 100 : 0;
});

const sousTotalNet = computed(
  () => Math.round((sousTotal.value - remiseMontant.value) * 100) / 100,
);

const tvaParTaux = computed(() => {
  const byRate: Record<number, number> = {};
  for (const l of props.modelValue.lignes) {
    const ht = ligneTotalHt(l) * remiseRatio.value;
    const tva = Math.round(ht * l.tauxTva) / 100;
    byRate[l.tauxTva] = (byRate[l.tauxTva] ?? 0) + tva;
  }
  return byRate;
});

const totalTVA = computed(() => Object.values(tvaParTaux.value).reduce((sum, t) => sum + t, 0));
const totalTTC = computed(() => Math.round((sousTotalNet.value + totalTVA.value) * 100) / 100);

function update(key: keyof VenteFormData, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

function updateLigne(index: number, key: keyof Ligne, value: string | number) {
  const lignes: Ligne[] = props.modelValue.lignes.map((l) => ({ ...l }));
  const ligne = lignes[index];
  if (!ligne) return;
  if (key === 'description') ligne.description = value as string;
  else if (key === 'quantite') ligne.quantite = value as number;
  else if (key === 'prixUnitaire') ligne.prixUnitaire = value as number;
  else if (key === 'total') ligne.total = value as number;
  else if (key === 'tauxTva') ligne.tauxTva = value as number;
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addEmptyLine() {
  const lignes = [
    ...props.modelValue.lignes,
    { description: '', quantite: 1, prixUnitaire: 0, total: 0, tauxTva: 5.5 },
  ];
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addStockLine(stock: Stock) {
  const tauxTva =
    stock.tauxTva !== null && stock.tauxTva !== undefined
      ? Number(stock.tauxTva)
      : stock.categorieVente
        ? (TVA_PAR_CATEGORIE_VENTE[stock.categorieVente as CategorieVente] ?? 5.5)
        : 5.5;

  const ligne: Ligne = {
    description: stock.nom,
    quantite: 1,
    prixUnitaire: Number(stock.prixUnitaire ?? 0),
    total: 0,
    tauxTva,
    modePrix: stock.modePrix ?? 'format',
    contenance: stock.contenance != null ? Number(stock.contenance) : null,
    uniteContenance: stock.uniteContenance ?? undefined,
    stockId: stock.id,
    stockQuantite: Number(stock.quantite),
    // Traçabilité miel auto-fill
    typeMiel: stock.typeMiel ?? undefined,
    presentation: stock.presentation ?? undefined,
    numLot: stock.numLot ?? undefined,
    origineGeo: stock.origineGeo ?? undefined,
    anneeRecolte: stock.anneeRecolte ?? undefined,
  };

  const lignes = [...props.modelValue.lignes];
  const emptyIdx = lignes.findIndex((l) => !l.description && l.prixUnitaire === 0);
  if (emptyIdx >= 0) {
    lignes[emptyIdx] = ligne;
  } else {
    lignes.push(ligne);
  }
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function removeLine(index: number) {
  const lignes = props.modelValue.lignes.filter((_, i) => i !== index);
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
