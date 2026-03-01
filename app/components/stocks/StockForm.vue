<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <!-- Nom & Catégorie inventaire -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Nom de l'article *</label>
        <UInput v-model="form.nom" required placeholder="Ex: Miel de lavande" />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Catégorie stock *</label>
        <select
          v-model="form.categorie"
          required
          class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Sélectionner</option>
          <option v-for="cat in CATEGORIE_STOCK" :key="cat" :value="cat">
            {{ categorieLabels[cat] || cat }}
          </option>
        </select>
      </div>
    </div>

    <!-- Catégorie de vente (TVA) -->
    <div class="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
      <div class="mb-3 flex items-center gap-2">
        <UIcon name="i-lucide-receipt" class="h-4 w-4 text-amber-600" />
        <span class="text-sm font-semibold text-stone-800"
          >Catégorie produit & TVA (facturation)</span
        >
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-stone-600">Type de produit</label>
          <select
            v-model="form.categorieVente"
            class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            @change="onCategorieVenteChange"
          >
            <option value="">— Non défini —</option>
            <optgroup label="Produits alimentaires — TVA 5,5%">
              <option value="miel">Miel (toutes variétés)</option>
              <option value="gelee_royale">Gelée royale</option>
              <option value="pollen">Pollen alimentaire</option>
              <option value="propolis_alimentaire">Propolis (usage alimentaire)</option>
              <option value="pain_abeille">Pain d'abeille</option>
              <option value="cire_alimentaire">Cire (usage alimentaire/apicole)</option>
              <option value="vinaigre_miel">Vinaigre de miel</option>
            </optgroup>
            <optgroup label="Animaux vivants & traitements — TVA 10%">
              <option value="essaim">Essaim</option>
              <option value="reine">Reine</option>
              <option value="ruche_peuplee">Ruche peuplée / Nucléi</option>
              <option value="nourrissement">Nourrissement (sirop, candi, pain protéiné)</option>
              <option value="traitement_veterinaire">
                Traitement vétérinaire (acide oxalique, formique…)
              </option>
            </optgroup>
            <optgroup label="Matériel & autres — TVA 20%">
              <option value="materiel_apicole">Matériel apicole (ruches, cadres, hausses…)</option>
              <option value="equipement_apiculteur">
                Équipement apiculteur (combinaison, enfumoir…)
              </option>
              <option value="cire_technique">Cire technique (bougies, cosmétiques)</option>
              <option value="conditionnement">Conditionnement (pots, étiquettes, opercules)</option>
              <option value="hydromel">Hydromel / Chouchen</option>
              <option value="propolis_teinture">Propolis teinture mère (alcoolisée)</option>
              <option value="cosmetique">Cosmétique au miel (crème, baume…)</option>
              <option value="autre">Autre</option>
            </optgroup>
          </select>
          <p class="mt-1 text-xs text-stone-400">
            Détermine la TVA applicable lors de la facturation
          </p>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-stone-600">
            Taux de TVA (%)
            <span class="ml-1 text-stone-400">— auto-calculé, surchargeable</span>
          </label>
          <div class="flex items-center gap-2">
            <select
              v-model.number="form.tauxTva"
              class="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option :value="null">— Auto —</option>
              <option :value="5.5">5,5% — Alimentaire (Art. 278-0 bis CGI)</option>
              <option :value="10">
                10% — Animaux / Médicaments vétérinaires (Art. 278 bis CGI)
              </option>
              <option :value="20">20% — Taux normal (Art. 278 CGI)</option>
              <option :value="0">0% — Franchise en base / Export (Art. 293 B CGI)</option>
            </select>
          </div>
          <!-- Badge TVA effective -->
          <div v-if="tvaBadge" class="mt-2 flex items-center gap-1.5">
            <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="tvaBadge.color">
              TVA {{ tvaBadge.rate }}%
            </span>
            <span class="text-xs text-stone-500">{{ tvaBadge.base }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quantité, Unité, Seuil -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-if="showQuantite">
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Quantité initiale</label>
        <UInput v-model.number="form.quantite" type="number" step="0.01" min="0" placeholder="0" />
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
        <label class="mb-1.5 block text-sm font-medium text-stone-700">Prix unitaire HT (€)</label>
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
      <UTextarea v-model="form.notes" :rows="2" placeholder="Notes supplémentaires..." />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton type="submit" :label="submitLabel" color="primary" :loading="loading" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { CATEGORIE_STOCK, TVA_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente } from '~/types/enums';

export interface StockFormData {
  nom: string;
  categorie: string;
  categorieVente: string;
  tauxTva: number | null;
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
  equipement: 'Équipement',
  outillage: 'Outillage',
  autre: 'Autre',
};

const form = reactive<StockFormData>({
  nom: props.initial?.nom ?? '',
  categorie: props.initial?.categorie ?? '',
  categorieVente: props.initial?.categorieVente ?? '',
  tauxTva: props.initial?.tauxTva ?? null,
  quantite: props.initial?.quantite ?? 0,
  unite: props.initial?.unite ?? '',
  seuilAlerte: props.initial?.seuilAlerte ?? null,
  prixUnitaire: props.initial?.prixUnitaire ?? null,
  fournisseur: props.initial?.fournisseur ?? '',
  emplacement: props.initial?.emplacement ?? '',
  notes: props.initial?.notes ?? '',
});

/** Quand la catégorie vente change, auto-set le taux TVA */
function onCategorieVenteChange() {
  if (form.categorieVente && form.tauxTva === null) {
    const auto = TVA_PAR_CATEGORIE_VENTE[form.categorieVente as CategorieVente];
    if (auto !== undefined) form.tauxTva = auto;
  }
}

/** Taux effectif : manuel si défini, sinon auto depuis catégorie */
const tauxEffectif = computed(() => {
  if (form.tauxTva !== null) return form.tauxTva;
  if (form.categorieVente)
    return TVA_PAR_CATEGORIE_VENTE[form.categorieVente as CategorieVente] ?? null;
  return null;
});

const TVA_BADGE_CONFIG: Record<number, { color: string; base: string }> = {
  5.5: { color: 'bg-emerald-100 text-emerald-700', base: 'Alimentaire (Art. 278-0 bis A CGI)' },
  10: {
    color: 'bg-blue-100 text-blue-700',
    base: 'Animaux / Médicaments vétérinaires (Art. 278 bis CGI)',
  },
  20: { color: 'bg-stone-100 text-stone-600', base: 'Taux normal (Art. 278 CGI)' },
  0: { color: 'bg-amber-100 text-amber-700', base: 'Franchise en base / Export (Art. 293 B CGI)' },
};

const tvaBadge = computed(() => {
  if (tauxEffectif.value === null) return null;
  const cfg = TVA_BADGE_CONFIG[tauxEffectif.value];
  return cfg ? { rate: tauxEffectif.value, ...cfg } : null;
});

function handleSubmit() {
  emit('submit', { ...form });
}
</script>
