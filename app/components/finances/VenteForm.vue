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

    <!-- Date + Échéance -->
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
        <label class="mb-1 block text-sm font-medium text-stone-600">Échéance</label>
        <input
          :value="modelValue.dateEcheance"
          type="date"
          class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          @input="update('dateEcheance', ($event.target as HTMLInputElement).value || undefined)"
        />
      </div>
    </div>

    <!-- Stock picker -->
    <div
      v-if="availableStocks.length > 0"
      class="rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-amber-50/30 p-4"
    >
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
          <UIcon name="i-lucide-warehouse" class="h-4 w-4 text-white" />
        </div>
        <div>
          <p class="text-sm font-semibold text-stone-900">Vendre depuis vos stocks</p>
          <p class="text-xs text-stone-500">
            {{ availableStocks.length }} produit(s) disponible(s) — cliquez pour ajouter
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="stock in availableStocks"
          :key="stock.id"
          type="button"
          class="flex flex-col items-start gap-1.5 rounded-xl border-2 border-amber-100 bg-white p-3 text-left shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
          @click="addStockLine(stock)"
        >
          <span class="text-sm font-semibold text-stone-900">{{ stock.nom }}</span>
          <div class="flex w-full items-center justify-between">
            <span class="text-xs text-stone-500">
              {{ Number(stock.quantite) }} {{ stock.unite ?? 'unités' }}
            </span>
            <span
              v-if="stock.prixUnitaire"
              class="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800"
            >
              {{ formatMoney(Number(stock.prixUnitaire)) }}/{{ stock.unite ?? 'u' }}
            </span>
          </div>
          <!-- Badge TVA du produit -->
          <span
            v-if="stock.tauxTva !== null && stock.tauxTva !== undefined"
            class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
            :class="tvaBadgeClass(Number(stock.tauxTva))"
          >
            TVA {{ Number(stock.tauxTva) }}%
          </span>
        </button>
      </div>
    </div>

    <!-- Lignes de facturation -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-sm font-medium text-stone-600">Lignes de facturation</label>
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-200"
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
          class="rounded-xl bg-stone-50 p-3"
        >
          <!-- Stock badge -->
          <div v-if="ligne.stockId" class="mb-2 flex items-center gap-1.5">
            <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5 text-amber-600" />
            <span class="text-xs font-medium text-amber-700">Depuis le stock</span>
          </div>

          <div class="grid grid-cols-12 items-end gap-2">
            <!-- Description -->
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
            <!-- Quantité -->
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400">Qté</label>
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
            <!-- Prix unitaire HT -->
            <div class="col-span-2">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400">PU HT (€)</label>
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
            <!-- Total HT -->
            <div class="col-span-2 text-right">
              <label v-if="index === 0" class="mb-1 block text-xs text-stone-400">Total HT</label>
              <p class="py-1.5 text-sm font-medium text-stone-900">
                {{ formatMoney(ligne.quantite * ligne.prixUnitaire) }}
              </p>
            </div>
            <!-- Supprimer -->
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

          <!-- Sélecteur TVA par ligne -->
          <div class="mt-2 flex items-center gap-2">
            <span class="text-xs text-stone-400">TVA :</span>
            <button
              v-for="taux in TVA_RATES"
              :key="taux.value"
              type="button"
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all"
              :class="
                ligne.tauxTva === taux.value
                  ? taux.activeClass
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              "
              :title="taux.description"
              @click="updateLigne(index, 'tauxTva', taux.value)"
            >
              {{ taux.value }}%
            </button>
            <span class="text-[10px] text-stone-400">{{
              currentTvaDescription(ligne.tauxTva)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Récapitulatif TVA par taux -->
    <div class="ml-auto w-72 space-y-1.5 rounded-xl bg-stone-50 p-4">
      <div class="flex justify-between text-sm text-stone-600">
        <span>Sous-total HT</span>
        <span class="font-medium">{{ formatMoney(sousTotal) }}</span>
      </div>
      <!-- Ligne TVA par taux (si taux mixtes) -->
      <template v-for="(amount, rate) in tvaParTaux" :key="rate">
        <div class="flex justify-between text-sm text-stone-500">
          <span>TVA {{ rate }}%</span>
          <span>{{ formatMoney(amount) }}</span>
        </div>
      </template>
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
import { TVA_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

interface Ligne {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva: number;
  stockId?: string;
  stockQuantite?: number;
}

interface VenteFormData {
  clientId?: string;
  dateTransaction: string;
  dateEcheance?: string;
  lignes: Ligne[];
  notes?: string;
}

const TVA_RATES = [
  {
    value: 5.5,
    label: 'Réduit',
    activeClass: 'bg-emerald-100 text-emerald-700',
    description:
      "Alimentaire — Art. 278-0 bis A CGI (miel, pollen, gelée royale, propolis, pain d'abeille, cire apicole…)",
  },
  {
    value: 10,
    label: 'Intermédiaire',
    activeClass: 'bg-blue-100 text-blue-700',
    description:
      'Animaux vivants & médicaments vétérinaires — Art. 278 bis CGI (essaims, reines, nourrissement, traitements…)',
  },
  {
    value: 20,
    label: 'Normal',
    activeClass: 'bg-stone-200 text-stone-700',
    description:
      'Taux normal — Art. 278 CGI (matériel, équipements, hydromel, cire bougies, cosmétiques…)',
  },
  {
    value: 0,
    label: 'Franchise',
    activeClass: 'bg-amber-100 text-amber-700',
    description:
      'Franchise en base (Art. 293 B CGI, CA < 85 000 €) / Export / Livraisons intracommunautaires',
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

const availableStocks = computed(() => (props.stocks ?? []).filter((s) => Number(s.quantite) > 0));

const sousTotal = computed(() =>
  props.modelValue.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0),
);

/** TVA calculée par taux — permet de voir la ventilation sur la facture */
const tvaParTaux = computed(() => {
  const byRate: Record<number, number> = {};
  for (const l of props.modelValue.lignes) {
    const ht = l.quantite * l.prixUnitaire;
    const tva = Math.round(ht * l.tauxTva) / 100;
    byRate[l.tauxTva] = (byRate[l.tauxTva] ?? 0) + tva;
  }
  return byRate;
});

const totalTVA = computed(() => Object.values(tvaParTaux.value).reduce((sum, t) => sum + t, 0));

const totalTTC = computed(() => Math.round((sousTotal.value + totalTVA.value) * 100) / 100);

function currentTvaDescription(taux: number) {
  return TVA_RATES.find((r) => r.value === taux)?.description?.split(' — ')[0] ?? '';
}

function tvaBadgeClass(taux: number) {
  const map: Record<number, string> = {
    5.5: 'bg-emerald-100 text-emerald-700',
    10: 'bg-blue-100 text-blue-700',
    20: 'bg-stone-100 text-stone-600',
    0: 'bg-amber-100 text-amber-700',
  };
  return map[taux] ?? 'bg-stone-100 text-stone-500';
}

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
  // TVA depuis le produit, sinon depuis la catégorie de vente, sinon 5.5% par défaut
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
    stockId: stock.id,
    stockQuantite: Number(stock.quantite),
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
