<template>
  <form class="space-y-6" @submit.prevent="$emit('submit')">
    <!-- Client -->
    <div>
      <label class="mb-1 block text-sm font-medium text-stone-600">Client</label>
      <select
        :value="modelValue.clientId"
        class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        @change="update('clientId', ($event.target as HTMLSelectElement).value || undefined)"
      >
        <option value="">Sans client</option>
        <option v-for="c in clients" :key="c.id" :value="c.id">
          {{ c.entreprise || `${c.nom} ${c.prenom ?? ''}`.trim() }}
        </option>
      </select>
    </div>

    <!-- Date + Echeance -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="mb-1 block text-sm font-medium text-stone-600">Date</label>
        <input
          :value="modelValue.dateTransaction"
          type="date"
          required
          class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @input="update('dateTransaction', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-stone-600">Echeance</label>
        <input
          :value="modelValue.dateEcheance"
          type="date"
          class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @input="update('dateEcheance', ($event.target as HTMLInputElement).value || undefined)"
        />
      </div>
    </div>

    <!-- Lignes -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-sm font-medium text-stone-600">Lignes de facturation</label>
        <div class="flex gap-2">
          <button
            v-if="availableStocks.length > 0"
            type="button"
            class="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
            @click="showStockPicker = !showStockPicker"
          >
            <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5" />
            Depuis le stock
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
            @click="addEmptyLine"
          >
            <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
            Ligne libre
          </button>
        </div>
      </div>

      <!-- Stock picker -->
      <div
        v-if="showStockPicker"
        class="mb-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3"
      >
        <p class="mb-2 text-xs font-medium text-amber-800">
          Selectionnez un produit depuis vos stocks :
        </p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            v-for="stock in availableStocks"
            :key="stock.id"
            type="button"
            class="flex flex-col items-start gap-1 rounded-lg border border-amber-200 bg-white p-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-50"
            @click="addStockLine(stock)"
          >
            <span class="text-sm font-medium text-stone-900">{{ stock.nom }}</span>
            <div class="flex w-full items-center justify-between">
              <span class="text-xs text-stone-500">
                {{ Number(stock.quantite) }} {{ stock.unite ?? 'unites' }} dispo
              </span>
              <span v-if="stock.prixUnitaire" class="text-xs font-medium text-amber-700">
                {{ formatMoney(Number(stock.prixUnitaire)) }}/{{ stock.unite ?? 'u' }}
              </span>
            </div>
            <span class="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
              {{ stock.categorie }}
            </span>
          </button>
        </div>
      </div>

      <!-- Lines list -->
      <div class="space-y-2">
        <div
          v-for="(ligne, index) in modelValue.lignes"
          :key="index"
          class="rounded-xl bg-stone-50 p-3"
        >
          <!-- Stock badge if from stock -->
          <div v-if="ligne.stockId" class="mb-2 flex items-center gap-1.5">
            <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5 text-amber-600" />
            <span class="text-xs font-medium text-amber-700">Depuis le stock</span>
          </div>
          <div class="grid grid-cols-12 items-end gap-2">
            <div class="col-span-5">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400"
                >Description</label
              >
              <input
                :value="ligne.description"
                type="text"
                required
                placeholder="Description"
                class="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                @input="
                  updateLigne(index, 'description', ($event.target as HTMLInputElement).value)
                "
              />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400">Quantite</label>
              <input
                :value="ligne.quantite"
                type="number"
                min="0.01"
                step="0.01"
                required
                :max="ligne.stockQuantite ?? undefined"
                class="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                @input="
                  updateLigne(index, 'quantite', Number(($event.target as HTMLInputElement).value))
                "
              />
              <p v-if="ligne.stockQuantite" class="mt-0.5 text-[10px] text-stone-400">
                max {{ ligne.stockQuantite }}
              </p>
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400"
                >Prix unit. HT</label
              >
              <input
                :value="ligne.prixUnitaire"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                @input="
                  updateLigne(
                    index,
                    'prixUnitaire',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
            </div>
            <div class="col-span-2 text-right">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400">Total HT</label>
              <p class="py-1.5 text-sm font-medium text-stone-900">
                {{ formatMoney(ligne.quantite * ligne.prixUnitaire) }}
              </p>
            </div>
            <div class="col-span-1 flex justify-end">
              <button
                v-if="modelValue.lignes.length > 1"
                type="button"
                class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                @click="removeLine(index)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TVA -->
    <div>
      <label class="mb-2 block text-sm font-medium text-stone-600">Taux de TVA</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="taux in TVA_RATES"
          :key="taux.value"
          type="button"
          class="flex flex-col items-center rounded-xl border-2 px-4 py-2.5 transition-all"
          :class="
            modelValue.tauxTva === taux.value
              ? 'border-amber-500 bg-amber-50 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300'
          "
          @click="update('tauxTva', taux.value)"
        >
          <span
            class="text-sm font-bold"
            :class="modelValue.tauxTva === taux.value ? 'text-amber-700' : 'text-stone-900'"
          >
            {{ taux.value }}%
          </span>
          <span
            class="text-[11px]"
            :class="modelValue.tauxTva === taux.value ? 'text-amber-600' : 'text-stone-400'"
          >
            {{ taux.label }}
          </span>
        </button>
      </div>
      <p class="mt-1.5 text-xs text-stone-400">
        {{ currentTvaDescription }}
      </p>
    </div>

    <!-- Totals -->
    <div class="ml-auto w-72 space-y-1.5 rounded-xl bg-stone-50 p-4">
      <div class="flex justify-between text-sm text-stone-600">
        <span>Sous-total HT</span>
        <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
      </div>
      <div class="flex justify-between text-sm text-stone-600">
        <span>TVA {{ modelValue.tauxTva }}%</span>
        <span class="font-medium">{{ formatMoney(tvaAmount) }}</span>
      </div>
      <div
        class="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900"
      >
        <span>Total TTC</span>
        <span>{{ formatMoney(totalTTC) }}</span>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="mb-1 block text-sm font-medium text-stone-600">Notes</label>
      <textarea
        :value="modelValue.notes"
        :rows="2"
        class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        placeholder="Notes optionnelles..."
        @input="update('notes', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Client, Stock } from '~/types/models';

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  stockId?: string;
  stockQuantite?: number;
}

interface VenteFormData {
  clientId?: string;
  dateTransaction: string;
  dateEcheance?: string;
  lignes: Ligne[];
  tauxTva: number;
  notes?: string;
}

const TVA_RATES = [
  {
    value: 5.5,
    label: 'Reduit',
    description:
      "Miel, pollen, gelee royale, propolis alimentaire, pain d'epices, vinaigre de miel, cire d'abeille (usage apicole/alimentaire), essaims, reines, nourrissement (sirop, pate proteinee)",
  },
  {
    value: 10,
    label: 'Intermediaire',
    description:
      'Produits agricoles non transformes livres a un non-assujetti, certaines prestations de services agricoles',
  },
  {
    value: 20,
    label: 'Normal',
    description:
      'Materiel apicole, equipements, confiseries au miel (nougats, sucettes), propolis teinture-mere (alcoolisee), hydromel, chouchen, cire pour bougies/cosmetiques, produits cosmetiques',
  },
  {
    value: 0,
    label: 'Franchise / Export',
    description:
      'Franchise en base de TVA (art. 293 B CGI, CA < 85 000 €), livraisons intracommunautaires, exportations hors UE',
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

const showStockPicker = ref(false);

const availableStocks = computed(() => (props.stocks ?? []).filter((s) => Number(s.quantite) > 0));

const sousTotal = computed(() =>
  props.modelValue.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0),
);
const tvaAmount = computed(() => Math.round(sousTotal.value * props.modelValue.tauxTva) / 100);
const totalTTC = computed(() => Math.round((sousTotal.value + tvaAmount.value) * 100) / 100);

const currentTvaDescription = computed(() => {
  const rate = TVA_RATES.find((r) => r.value === props.modelValue.tauxTva);
  return rate?.description ?? '';
});

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
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addEmptyLine() {
  const lignes = [
    ...props.modelValue.lignes,
    { description: '', quantite: 1, prixUnitaire: 0, total: 0 },
  ];
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function addStockLine(stock: Stock) {
  const ligne: Ligne = {
    description: stock.nom,
    quantite: 1,
    prixUnitaire: Number(stock.prixUnitaire ?? 0),
    total: 0,
    stockId: stock.id,
    stockQuantite: Number(stock.quantite),
  };
  const lignes = [...props.modelValue.lignes];
  // Replace the first empty line or append
  const emptyIdx = lignes.findIndex((l) => !l.description && l.prixUnitaire === 0);
  if (emptyIdx >= 0) {
    lignes[emptyIdx] = ligne;
  } else {
    lignes.push(ligne);
  }
  emit('update:modelValue', { ...props.modelValue, lignes });
  showStockPicker.value = false;
}

function removeLine(index: number) {
  const lignes = props.modelValue.lignes.filter((_, i) => i !== index);
  emit('update:modelValue', { ...props.modelValue, lignes });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
