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
              <option v-for="t in typesMielParGroupe[groupe]" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </optgroup>
            <option value="__libre__">✏️ Saisie libre — ma propre variété…</option>
          </select>
          <UIcon
            name="i-lucide-chevron-down"
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
        </div>
        <input
          v-if="estSaisieLibre"
          v-model="form.typeMielLibre"
          type="text"
          required
          maxlength="100"
          placeholder="Ex : Callune des Monts d'Arrée"
          class="mt-2 h-11 w-full rounded-[10px] border border-[var(--border-default)] bg-white px-4 text-[15px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/15"
        />
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
            v-for="c in conditionnements"
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
          <button
            type="button"
            title="Créer un conditionnement personnalisé"
            class="rounded-full border border-dashed border-[var(--border-default)] px-3 py-1 text-[12px] font-medium text-[var(--text-tertiary)] transition-all duration-150 hover:border-[var(--honey)] hover:text-[var(--honey-deep)]"
            @click="showNouveauCond = !showNouveauCond"
          >
            + Autre…
          </button>
        </div>
        <!-- Création rapide d'un conditionnement personnalisé (ex : Fût 300 kg) -->
        <div
          v-if="showNouveauCond"
          class="mt-2 flex flex-wrap items-end gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
        >
          <div class="min-w-0 flex-1">
            <label class="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]"
              >Nom</label
            >
            <input
              v-model="nouveauCond.nom"
              type="text"
              maxlength="50"
              placeholder="Ex : Fût 300 kg"
              class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)]"
            />
          </div>
          <div class="w-24">
            <label class="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]"
              >Contenance</label
            >
            <input
              v-model.number="nouveauCond.contenance"
              type="number"
              step="0.001"
              min="0"
              placeholder="300"
              class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)]"
            />
          </div>
          <div class="w-20">
            <label class="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]"
              >Unité</label
            >
            <select
              v-model="nouveauCond.uniteContenance"
              class="h-9 w-full rounded-[8px] border border-[var(--border-default)] bg-white px-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--honey)]"
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
            </select>
          </div>
          <UButton
            size="sm"
            color="primary"
            variant="soft"
            :loading="creationCond"
            :disabled="!nouveauCond.nom.trim() || !nouveauCond.contenance"
            @click="creerConditionnement"
          >
            Créer
          </UButton>
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
            />
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
          />
        </div>
      </div>

      <!-- TVA info + TTC -->
      <div class="flex items-center gap-2 rounded-[8px] bg-[var(--honey-soft)] px-3 py-2">
        <span class="rounded-full bg-[var(--honey)] px-2 py-0.5 text-[11px] font-bold text-white"
          >TVA 5,5%</span
        >
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
        />
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
            />
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
            />
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
    <div
      class="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-default)] pt-4"
    >
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
import { useCatalogueProduits, type ProduitCatalogue } from '~/composables/useCatalogueProduits';

export interface StockMielFormData {
  nom: string;
  categorie: 'conditionnement';
  categorieVente: 'miel';
  tauxTva: 5.5;
  typeMiel: string;
  presentation: string;
  conditionnementMiel: string;
  /** Poids unitaire d'un conditionnement personnalisé (fallback valorisation). */
  contenance: number | null;
  uniteContenance: string | null;
  quantite: number;
  unite: string;
  prixUnitaire: number | null;
  seuilAlerte: number | null;
  anneeRecolte: number | null;
  numLot: string;
  origineGeo: string;
  notes: string;
}

interface CondEntry {
  value: string;
  label: string;
  unite: string;
  poids: number | null;
  contenance: number | null;
  uniteContenance: string | null;
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

// Une variété hors référentiel (créée en saisie libre) s'édite via le mode libre.
const initialTypeMiel = props.initial?.typeMiel ?? '';
const initialEstLibre = !!initialTypeMiel && !TYPES_MIEL.some((t) => t.value === initialTypeMiel);

const form = reactive({
  typeMiel: initialEstLibre ? '__libre__' : initialTypeMiel,
  typeMielLibre: initialEstLibre ? initialTypeMiel : '',
  presentation: props.initial?.presentation ?? '',
  conditionnementMiel: props.initial?.conditionnementMiel ?? 'vrac',
  quantite: props.initial?.quantite ?? 0,
  unite: props.initial?.unite ?? 'kg',
  prixUnitaire: props.initial?.prixUnitaire ?? (null as number | null),
  seuilAlerte: props.initial?.seuilAlerte ?? (null as number | null),
  anneeRecolte: props.initial?.anneeRecolte ?? (null as number | null),
  numLot: props.initial?.numLot ?? '',
  origineGeo: props.initial?.origineGeo ?? '',
  notes: props.initial?.notes ?? '',
});

const estSaisieLibre = computed(() => form.typeMiel === '__libre__');

function normaliser(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Valeur réellement stockée : slug du référentiel, ou texte libre trimé.
// Si la saisie libre correspond à un label connu, on retombe sur son slug
// (rétro-compatibilité couleurs/groupes qui sont keyés par slug).
const typeMielFinal = computed(() => {
  if (!estSaisieLibre.value) return form.typeMiel;
  const saisie = form.typeMielLibre.trim();
  if (!saisie) return '';
  const preset = TYPES_MIEL.find((t) => normaliser(t.label) === normaliser(saisie));
  return preset?.value ?? saisie;
});

// Grouper les types de miel par groupe
const groupesMiel = computed(() => {
  const g = new Set<string>();
  for (const t of TYPES_MIEL) g.add(t.groupe);
  return [...g];
});

const typesMielParGroupe = computed(() => {
  const map: Record<string, (typeof TYPES_MIEL)[number][]> = {};
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

// ─── Conditionnements : liste standard + conditionnements perso du catalogue ───

const { list: listCatalogue, create: createCatalogue } = useCatalogueProduits();
const conditionnementsPerso = ref<CondEntry[]>([]);

function presetVersCondEntry(p: ProduitCatalogue): CondEntry {
  const contenance = p.contenance != null ? Number(p.contenance) : null;
  const uniteContenance = p.uniteContenance || 'kg';
  // Poids en kg pour l'affichage/unité (même convention que CONDITIONNEMENTS_MIEL)
  const poidsKg =
    contenance == null ? null : uniteContenance === 'g' ? contenance / 1000 : contenance;
  return {
    // stocks.conditionnement est du texte libre (max 50 côté API) : on stocke le nom
    value: p.nom.slice(0, 50),
    label: p.nom,
    unite: p.uniteTypique?.trim() || 'unités',
    poids: poidsKg,
    contenance,
    uniteContenance,
  };
}

onMounted(async () => {
  try {
    const produits = await listCatalogue();
    conditionnementsPerso.value = produits
      .filter((p) => p.categorie === 'conditionnement' && Number(p.contenance) > 0)
      .map(presetVersCondEntry);
  } catch {
    // Le catalogue est un bonus : la liste standard reste disponible.
  }
});

const conditionnements = computed<CondEntry[]>(() => {
  const base: CondEntry[] = CONDITIONNEMENTS_MIEL.map((c) => ({
    value: c.value,
    label: c.label,
    unite: c.unite,
    poids: c.poids,
    contenance: null,
    uniteContenance: null,
  }));
  const fusion = [...base, ...conditionnementsPerso.value];
  // Valeur inconnue (preset supprimé, donnée historique) : on la garde visible.
  const courant = form.conditionnementMiel;
  if (courant && !fusion.some((c) => c.value === courant)) {
    fusion.push({
      value: courant,
      label: courant,
      unite: form.unite || 'unités',
      poids: null,
      contenance: null,
      uniteContenance: null,
    });
  }
  return fusion;
});

function selectConditionnement(c: CondEntry) {
  form.conditionnementMiel = c.value;
  form.unite = c.poids ? c.unite : 'kg';
}

// Création rapide d'un conditionnement perso (persisté au catalogue produits)
const showNouveauCond = ref(false);
const creationCond = ref(false);
const nouveauCond = reactive({
  nom: '',
  contenance: null as number | null,
  uniteContenance: 'kg',
});

async function creerConditionnement() {
  const nom = nouveauCond.nom.trim();
  if (!nom || !nouveauCond.contenance) return;
  creationCond.value = true;
  try {
    const cree = await createCatalogue({
      nom,
      categorie: 'conditionnement',
      groupe: 'Conditionnement',
      uniteTypique: 'unités',
      modePrix: 'poids',
      contenance: nouveauCond.contenance,
      uniteContenance: nouveauCond.uniteContenance,
      icon: '🛢️',
    });
    const entry = presetVersCondEntry(cree);
    conditionnementsPerso.value = [...conditionnementsPerso.value, entry];
    selectConditionnement(entry);
    showNouveauCond.value = false;
    nouveauCond.nom = '';
    nouveauCond.contenance = null;
  } catch (e) {
    useToast().add({
      title: getApiErrorMessage(e, 'Erreur lors de la création du conditionnement'),
      color: 'error',
    });
  } finally {
    creationCond.value = false;
  }
}

const prixTtc = computed(() => {
  if (!form.prixUnitaire) return 0;
  return form.prixUnitaire * 1.055;
});

// Nom auto-généré depuis variété + présentation (les variétés libres gardent leur texte)
const nomAuto = computed(() => {
  const variete =
    TYPES_MIEL.find((t) => t.value === typeMielFinal.value)?.label ??
    (estSaisieLibre.value ? typeMielFinal.value : '');
  const pres = PRESENTATIONS_MIEL.find((p) => p.value === form.presentation)?.label ?? '';
  if (!variete) return 'Miel';
  return pres ? `Miel de ${variete} — ${pres}` : `Miel de ${variete}`;
});

const isValid = computed(() => !!typeMielFinal.value && !!form.presentation && form.quantite >= 0);

function handleSubmit() {
  const cond = conditionnements.value.find((c) => c.value === form.conditionnementMiel);
  emit('submit', {
    nom: nomAuto.value,
    categorie: 'conditionnement',
    categorieVente: 'miel',
    tauxTva: 5.5,
    typeMiel: typeMielFinal.value,
    presentation: form.presentation,
    conditionnementMiel: form.conditionnementMiel,
    contenance: cond?.contenance ?? null,
    uniteContenance: cond?.contenance != null ? cond.uniteContenance : null,
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
