<template>
  <form @submit.prevent="handleSubmit">
    <!-- Tab navigation -->
    <div class="mb-5 inline-flex w-full rounded-lg border border-stone-200 bg-stone-50 p-0.5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150"
        :class="
          activeTab === tab.key
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-400 hover:text-stone-600'
        "
        @click="activeTab = tab.key"
      >
        <UIcon :name="tab.icon" class="h-3.5 w-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 1: Produit -->
    <div v-show="activeTab === 'produit'" class="space-y-5">
      <!-- Nom -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Nom de l'article *</label>
        <UInput v-model="form.nom" required placeholder="Ex: Miel de lavande" />
      </div>

      <!-- Type de produit -->
      <div>
        <label class="mb-2.5 block text-sm font-medium text-stone-700">Type de produit</label>
        <div class="space-y-3">
          <div v-for="group in TYPES_PRODUIT" :key="group.group">
            <p
              class="mb-1 text-[11px] font-semibold uppercase tracking-wide"
              :class="groupLabelClass(group.color)"
            >
              {{ group.group }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="item in group.items"
                :key="item.label"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
                :class="
                  isSelected(item, group)
                    ? chipSelectedClass(group.color)
                    : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                "
                @click="selectType(item)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- TVA feedback -->
        <div v-if="tvaBadge" class="mt-3 flex items-center gap-2">
          <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="tvaBadge.color">
            TVA {{ tvaBadge.rate }}%
          </span>
          <span class="text-xs text-stone-400">{{ tvaBadge.base }}</span>
          <button
            type="button"
            class="ml-auto text-[11px] text-stone-400 underline decoration-dotted hover:text-stone-600"
            @click="showTvaOverride = !showTvaOverride"
          >
            Modifier
          </button>
        </div>
        <div v-if="showTvaOverride" class="mt-2">
          <select
            v-model.number="form.tauxTva"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option :value="null">Auto (depuis type)</option>
            <option :value="5.5">5,5% — Alimentaire</option>
            <option :value="10">10% — Animaux / Vétérinaire</option>
            <option :value="20">20% — Taux normal</option>
            <option :value="0">0% — Franchise en base</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tab 2: Stock -->
    <div v-show="activeTab === 'stock'" class="space-y-4">
      <div v-if="showQuantite">
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantité initiale</label>
        <UInput
          v-model.number="form.quantite"
          type="number"
          :step="decimalAllowed ? '0.01' : '1'"
          min="0"
          placeholder="0"
        />
        <p v-if="!decimalAllowed" class="mt-1 text-xs text-stone-400">
          Quantité en nombre entier (unité « {{ form.unite || 'pièces' }} »). Utilisez une unité de
          poids/volume (kg, L, g…) pour autoriser les décimales.
        </p>
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Unité</label>
        <UInput v-model="form.unite" placeholder="kg, pots, pièces…" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Seuil d'alerte</label>
        <UInput
          v-model.number="form.seuilAlerte"
          type="number"
          :step="decimalAllowed ? '0.01' : '1'"
          min="0"
          placeholder="0"
        />
        <p class="mt-1 text-xs text-stone-400">Notification quand le stock passe en dessous</p>
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">
          Mode de tarification
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-[10px] border px-3 py-2 text-[13px] font-medium transition-colors"
            :class="
              form.modePrix === 'format'
                ? 'border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'border-stone-200 text-stone-600 hover:border-stone-300'
            "
            @click="form.modePrix = 'format'"
          >
            Prix par {{ form.unite || 'unité' }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-[10px] border px-3 py-2 text-[13px] font-medium transition-colors"
            :class="
              form.modePrix === 'poids'
                ? 'border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'border-stone-200 text-stone-600 hover:border-stone-300'
            "
            @click="form.modePrix = 'poids'"
          >
            Prix au poids / volume
          </button>
        </div>
      </div>

      <!-- Contenance — requise en mode poids (ex: seau = 25 kg) -->
      <div v-if="form.modePrix === 'poids'" class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700">
            Contenance / {{ form.unite || 'unité' }}
          </label>
          <UInput
            v-model.number="form.contenance"
            type="number"
            step="0.001"
            min="0"
            placeholder="Ex: 25"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-700">Unité de mesure</label>
          <UInput v-model="form.uniteContenance" placeholder="kg, L, g…" />
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">
          {{
            form.modePrix === 'poids'
              ? `Prix HT par ${form.uniteContenance || 'kg'} (€)`
              : `Prix unitaire HT par ${form.unite || 'unité'} (€)`
          }}
        </label>
        <UInput
          v-model.number="form.prixUnitaire"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
        <p
          v-if="form.modePrix === 'poids' && form.contenance && form.prixUnitaire"
          class="mt-1 text-xs text-stone-400"
        >
          Soit {{ (form.contenance * form.prixUnitaire).toFixed(2) }} € HT par
          {{ form.unite || 'unité' }}
        </p>
      </div>
    </div>

    <!-- Tab 3: Infos -->
    <div v-show="activeTab === 'infos'" class="space-y-4">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Fournisseur</label>
        <UInput v-model="form.fournisseur" placeholder="Nom du fournisseur" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Emplacement</label>
        <UInput v-model="form.emplacement" placeholder="Ex: Atelier, Hangar, Cabanon" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Notes</label>
        <UTextarea v-model="form.notes" :rows="3" placeholder="Notes supplémentaires..." />
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton type="submit" :label="submitLabel" color="primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { TYPES_PRODUIT, TVA_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente, TypeProduitItem, TypeProduitGroup } from '~/types/enums';

export interface StockFormData {
  nom: string;
  categorie: string;
  categorieVente: string;
  tauxTva: number | null;
  quantite: number;
  unite: string;
  modePrix: 'format' | 'poids';
  contenance: number | null;
  uniteContenance: string;
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

type TabKey = 'produit' | 'stock' | 'infos';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'produit', label: 'Produit', icon: 'i-lucide-tag' },
  { key: 'stock', label: 'Stock', icon: 'i-lucide-hash' },
  { key: 'infos', label: 'Infos', icon: 'i-lucide-info' },
];

const activeTab = ref<TabKey>('produit');
const showTvaOverride = ref(false);

const form = reactive<StockFormData>({
  nom: props.initial?.nom ?? '',
  categorie: props.initial?.categorie ?? '',
  categorieVente: props.initial?.categorieVente ?? '',
  tauxTva: props.initial?.tauxTva ?? null,
  quantite: props.initial?.quantite ?? 0,
  unite: props.initial?.unite ?? '',
  modePrix: props.initial?.modePrix ?? 'format',
  contenance: props.initial?.contenance ?? null,
  uniteContenance: props.initial?.uniteContenance ?? '',
  seuilAlerte: props.initial?.seuilAlerte ?? null,
  prixUnitaire: props.initial?.prixUnitaire ?? null,
  fournisseur: props.initial?.fournisseur ?? '',
  emplacement: props.initial?.emplacement ?? '',
  notes: props.initial?.notes ?? '',
});

function groupLabelClass(color: 'emerald' | 'blue' | 'stone'): string {
  const map = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    stone: 'text-stone-500',
  };
  return map[color];
}

function isSelected(item: TypeProduitItem, group: TypeProduitGroup): boolean {
  if (!form.categorieVente) return false;
  if (item.value === form.categorieVente && item.catStock === form.categorie) return true;
  const sameValueItems = group.items.filter((i) => i.value === form.categorieVente);
  if (sameValueItems.length === 1 && sameValueItems[0] === item) return true;
  return false;
}

function chipSelectedClass(color: 'emerald' | 'blue' | 'stone'): string {
  const map = {
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    blue: 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    stone: 'border-stone-400 bg-stone-100 text-stone-800 ring-1 ring-stone-300',
  };
  return map[color];
}

function selectType(item: TypeProduitItem) {
  form.categorieVente = item.value;
  form.categorie = item.catStock;
  if (!showTvaOverride.value) {
    form.tauxTva = item.tva;
  }
}

const tauxEffectif = computed(() => {
  if (form.tauxTva !== null) return form.tauxTva;
  if (form.categorieVente)
    return TVA_PAR_CATEGORIE_VENTE[form.categorieVente as CategorieVente] ?? null;
  return null;
});

const TVA_BADGE_CONFIG: Record<number, { color: string; base: string }> = {
  5.5: { color: 'bg-emerald-100 text-emerald-700', base: 'Alimentaire' },
  10: { color: 'bg-blue-100 text-blue-700', base: 'Animaux / Vétérinaire' },
  20: { color: 'bg-stone-100 text-stone-600', base: 'Taux normal' },
  0: { color: 'bg-amber-100 text-amber-700', base: 'Franchise en base' },
};

const tvaBadge = computed(() => {
  if (tauxEffectif.value === null) return null;
  const cfg = TVA_BADGE_CONFIG[tauxEffectif.value];
  return cfg ? { rate: tauxEffectif.value, ...cfg } : null;
});

// Décimales autorisées seulement pour les articles au poids/volume
const decimalAllowed = computed(() => allowsDecimalQuantity(form.unite, form.categorie));

function handleSubmit() {
  // Arrondit à l'entier si les décimales ne sont pas pertinentes pour cet article
  const quantite = normalizeStockQuantity(form.quantite, form.unite, form.categorie);
  const seuilAlerte =
    form.seuilAlerte == null
      ? form.seuilAlerte
      : normalizeStockQuantity(form.seuilAlerte, form.unite, form.categorie);
  emit('submit', { ...form, quantite, seuilAlerte });
}
</script>
