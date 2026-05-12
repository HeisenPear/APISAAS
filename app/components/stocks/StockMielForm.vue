<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-5">

      <!-- Variété de miel -->
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
          Variété de miel <span class="text-[var(--status-bad)]">*</span>
        </label>
        <div class="relative">
          <select
            v-model="form.typeMiel"
            required
            class="h-11 w-full appearance-none rounded-[10px] border border-[var(--border-default)] bg-white px-4 pr-9 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          >
            <option value="" disabled>Choisir une variété…</option>
            <optgroup v-for="groupe in groupesMiel" :key="groupe" :label="groupe">
              <option
                v-for="t in typesMielParGroupe[groupe]"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </optgroup>
          </select>
          <UIcon
            name="i-lucide-chevron-down"
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <!-- Présentation -->
      <div>
        <label class="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
          Présentation <span class="text-[var(--status-bad)]">*</span>
        </label>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            v-for="p in PRESENTATIONS_MIEL"
            :key="p.value"
            type="button"
            class="flex flex-col items-center gap-1.5 rounded-[10px] border py-3 text-[11px] font-medium transition-all duration-150"
            :class="
              form.presentation === p.value
                ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-muted)]'
            "
            @click="form.presentation = p.value"
          >
            <UIcon :name="p.icon" class="h-4 w-4" />
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Conditionnement -->
      <div>
        <label class="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
          Conditionnement
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="c in CONDITIONNEMENTS_MIEL"
            :key="c.value"
            type="button"
            class="rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150"
            :class="
              form.conditionnementMiel === c.value
                ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
                : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]/50'
            "
            @click="selectConditionnement(c)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Quantité + Prix côte à côte -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
            Quantité <span class="text-[var(--status-bad)]">*</span>
          </label>
          <div class="flex items-center gap-1.5">
            <input
              v-model.number="form.quantite"
              type="number"
              step="0.1"
              min="0"
              required
              placeholder="0"
              class="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-4 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
            >
            <span class="shrink-0 text-[13px] text-[var(--text-tertiary)]">{{ form.unite }}</span>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
            Prix HT (€/kg)
          </label>
          <input
            v-model.number="form.prixUnitaire"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            class="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-4 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
          >
        </div>
      </div>

      <!-- TVA info + TTC -->
      <div class="flex items-center gap-2 rounded-[8px] bg-[var(--honey-soft)] px-3 py-2">
        <span class="rounded-full bg-[var(--honey)] px-2 py-0.5 text-[11px] font-bold text-white">TVA 5,5%</span>
        <span class="text-[12px] text-[var(--honey-deep)]">
          Art. 278-0 bis A CGI — Produit alimentaire
        </span>
        <span v-if="prixTtc > 0" class="ml-auto text-[12px] font-semibold text-[var(--honey-deep)]">
          TTC : {{ prixTtc.toFixed(2) }} €/kg
        </span>
      </div>

      <!-- Seuil d'alerte -->
      <div>
        <label class="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]">
          Seuil d'alerte ({{ form.unite }})
        </label>
        <input
          v-model.number="form.seuilAlerte"
          type="number"
          step="0.1"
          min="0"
          placeholder="Ex : 20"
          class="h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-4 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
        >
        <p class="mt-1 text-[11px] text-[var(--text-tertiary)]">
          Vous serez alerté quand le stock passe sous ce seuil
        </p>
      </div>

      <!-- Infos optionnelles (collapsible) -->
      <div>
        <button
          type="button"
          class="flex w-full items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          @click="showOptional = !showOptional"
        >
          <UIcon
            :name="showOptional ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="h-3.5 w-3.5"
          />
          Informations optionnelles (millésime, lot, origine)
        </button>

        <div v-if="showOptional" class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Millésime
            </label>
            <div class="relative">
              <select
                v-model.number="form.anneeRecolte"
                class="h-10 w-full appearance-none rounded-[8px] border border-[var(--border-default)] bg-white px-3 pr-8 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
              >
                <option :value="null">—</option>
                <option v-for="y in annees" :key="y" :value="y">{{ y }}</option>
              </select>
              <UIcon
                name="i-lucide-chevron-down"
                class="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              N° de lot
            </label>
            <input
              v-model="form.numLot"
              type="text"
              placeholder="LOT-2024-001"
              class="h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
            >
          </div>
          <div class="col-span-2">
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Origine géographique
            </label>
            <input
              v-model="form.origineGeo"
              type="text"
              placeholder="Ex : Provence, Alpes, Vosges…"
              class="h-10 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
            >
          </div>
          <div class="col-span-2">
            <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
              Notes
            </label>
            <textarea
              v-model="form.notes"
              :rows="2"
              placeholder="Notes libres…"
              class="w-full resize-none rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]/15"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-default)] pt-4">
      <UButton label="Annuler" variant="ghost" color="neutral" @click="$emit('cancel')" />
      <UButton
        type="submit"
        :label="submitLabel ?? 'Ajouter au stock'"
        color="primary"
        :loading="loading"
        :disabled="!isValid"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { TYPES_MIEL, PRESENTATIONS_MIEL, CONDITIONNEMENTS_MIEL } from '~/types/enums';

export interface StockMielFormData {
  nom: string;
  categorie: 'conditionnement';
  categorieVente: 'miel';
  tauxTva: 5.5;
  typeMiel: string;
  presentation: string;
  conditionnementMiel: string;
  quantite: number;
  unite: string;
  prixUnitaire: number | null;
  seuilAlerte: number | null;
  anneeRecolte: number | null;
  numLot: string;
  origineGeo: string;
  notes: string;
}

const props = defineProps<{
  loading?: boolean;
  initial?: Partial<StockMielFormData>;
  submitLabel?: string;
  showQuantite?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: StockMielFormData];
  cancel: [];
}>();

const showOptional = ref(false);

const form = reactive({
  typeMiel: props.initial?.typeMiel ?? '',
  presentation: props.initial?.presentation ?? '',
  conditionnementMiel: props.initial?.conditionnementMiel ?? 'vrac',
  quantite: props.initial?.quantite ?? 0,
  unite: props.initial?.unite ?? 'kg',
  prixUnitaire: props.initial?.prixUnitaire ?? null as number | null,
  seuilAlerte: props.initial?.seuilAlerte ?? null as number | null,
  anneeRecolte: props.initial?.anneeRecolte ?? null as number | null,
  numLot: props.initial?.numLot ?? '',
  origineGeo: props.initial?.origineGeo ?? '',
  notes: props.initial?.notes ?? '',
});

// Grouper les types de miel par groupe
const groupesMiel = computed(() => {
  const g = new Set<string>();
  for (const t of TYPES_MIEL) g.add(t.groupe);
  return [...g];
});

const typesMielParGroupe = computed(() => {
  const map: Record<string, typeof TYPES_MIEL[number][]> = {};
  for (const t of TYPES_MIEL) {
    const existing = map[t.groupe];
    if (existing) {
      existing.push(t);
    } else {
      map[t.groupe] = [t];
    }
  }
  return map;
});

// Années disponibles pour le millésime
const annees = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => current - i);
});

function selectConditionnement(c: (typeof CONDITIONNEMENTS_MIEL)[number]) {
  form.conditionnementMiel = c.value;
  form.unite = c.poids ? c.unite : 'kg';
}

const prixTtc = computed(() => {
  if (!form.prixUnitaire) return 0;
  return form.prixUnitaire * 1.055;
});

// Nom auto-généré depuis variété + présentation
const nomAuto = computed(() => {
  const variete = TYPES_MIEL.find((t) => t.value === form.typeMiel)?.label ?? '';
  const pres = PRESENTATIONS_MIEL.find((p) => p.value === form.presentation)?.label ?? '';
  if (!variete) return 'Miel';
  return pres ? `Miel de ${variete} — ${pres}` : `Miel de ${variete}`;
});

const isValid = computed(
  () => !!form.typeMiel && !!form.presentation && form.quantite >= 0,
);

function handleSubmit() {
  emit('submit', {
    nom: nomAuto.value,
    categorie: 'conditionnement',
    categorieVente: 'miel',
    tauxTva: 5.5,
    typeMiel: form.typeMiel,
    presentation: form.presentation,
    conditionnementMiel: form.conditionnementMiel,
    quantite: form.quantite,
    unite: form.unite,
    prixUnitaire: form.prixUnitaire,
    seuilAlerte: form.seuilAlerte,
    anneeRecolte: form.anneeRecolte,
    numLot: form.numLot,
    origineGeo: form.origineGeo,
    notes: form.notes,
  });
}
</script>
