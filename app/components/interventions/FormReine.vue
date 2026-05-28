<template>
  <div class="space-y-4">
    <!-- Type événement -->
    <div>
      <label class="mb-1.5 block text-xs font-medium text-stone-600">Type d'événement *</label>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          class="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all"
          :class="
            modelValue.typeEvenement === opt.value
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:bg-white'
          "
          @click="emit('update:modelValue', { ...modelValue, typeEvenement: opt.value })"
        >
          <UIcon :name="opt.icon" class="h-4 w-4" />
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Date événement -->
    <div>
      <label class="mb-1.5 block text-xs font-medium text-stone-600">Date de l'événement</label>
      <UiMobileDatePicker
        :model-value="modelValue.dateEvenement?.slice(0, 10) ?? null"
        mode="date"
        @update:model-value="
          emit('update:modelValue', {
            ...modelValue,
            dateEvenement: $event ? $event + 'T00:00:00Z' : '',
          })
        "
      />
    </div>

    <!-- Champs conditionnels selon type -->
    <template v-if="showCouleur">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-stone-600">Couleur de marquage</label>
        <div class="flex gap-2">
          <button
            v-for="c in couleurOptions"
            :key="c.value"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all"
            :class="
              modelValue.couleur === c.value
                ? 'border-stone-900 scale-110'
                : 'border-transparent hover:border-stone-300'
            "
            :style="{ backgroundColor: c.hex }"
            :title="c.label"
            @click="emit('update:modelValue', { ...modelValue, couleur: c.value })"
          />
        </div>
        <p class="mt-1 text-[10px] text-stone-400">
          Année {{ currentYear }} → marquage
          <strong>{{ couleurAnneeCourante }}</strong>
        </p>
      </div>
    </template>

    <template v-if="showOrigine">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-stone-600">Origine</label>
          <select
            :value="modelValue.origine"
            class="h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
            @change="
              emit('update:modelValue', {
                ...modelValue,
                origine: ($event.target as HTMLSelectElement).value,
              })
            "
          >
            <option value="">Sélectionner…</option>
            <option value="elevage_propre">Élevage propre</option>
            <option value="achat">Achat</option>
            <option value="capture_essaim">Capture d'essaim</option>
            <option value="inconnue">Inconnue</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-stone-600">Race</label>
          <select
            :value="modelValue.race"
            class="h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
            @change="
              emit('update:modelValue', {
                ...modelValue,
                race: ($event.target as HTMLSelectElement).value || undefined,
              })
            "
          >
            <option value="">Inconnue</option>
            <option value="buckfast">Buckfast</option>
            <option value="carnica">Carnica</option>
            <option value="noire">Noire (Mellifera)</option>
            <option value="italienne">Italienne (Ligustica)</option>
            <option value="caucasienne">Caucasienne</option>
            <option value="hybride">Hybride</option>
          </select>
        </div>
      </div>
    </template>

    <template v-if="showQualitePonte">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-stone-600"
          >Qualité de ponte (1-5)</label
        >
        <div class="flex gap-2">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="h-9 w-9 rounded-lg border text-sm font-medium transition-all"
            :class="
              modelValue.qualitePonte === n
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300'
            "
            @click="emit('update:modelValue', { ...modelValue, qualitePonte: n })"
          >
            {{ n }}
          </button>
        </div>
      </div>
    </template>

    <template v-if="showActionOrpheline">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-stone-600">Action envisagée</label>
        <select
          :value="modelValue.actionOrpheline"
          class="h-9 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          @change="
            emit('update:modelValue', {
              ...modelValue,
              actionOrpheline: ($event.target as HTMLSelectElement).value,
            })
          "
        >
          <option value="">Sélectionner…</option>
          <option value="attente">Attente (cellule en cours)</option>
          <option value="introduction_reine">Introduction d'une reine</option>
          <option value="fusion">Fusion avec autre colonie</option>
          <option value="abandon">Abandon de la ruche</option>
        </select>
      </div>
    </template>

    <!-- Notes -->
    <div>
      <label class="mb-1.5 block text-xs font-medium text-stone-600">Notes</label>
      <textarea
        :value="modelValue.notes"
        :rows="3"
        placeholder="Observations…"
        class="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 placeholder-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        @input="
          emit('update:modelValue', {
            ...modelValue,
            notes: ($event.target as HTMLTextAreaElement).value,
          })
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FormReineData {
  typeEvenement: string;
  dateEvenement: string;
  couleur?: string;
  origine?: string;
  race?: string;
  actionOrpheline?: string;
  qualitePonte?: number;
  notes?: string;
}

const props = defineProps<{ modelValue: FormReineData }>();
const emit = defineEmits<{ 'update:modelValue': [value: FormReineData] }>();

const typeOptions = [
  { value: 'introduction', label: 'Introduction', icon: 'i-lucide-arrow-down-circle' },
  { value: 'marquage', label: 'Marquage', icon: 'i-lucide-paint-bucket' },
  { value: 'clipping', label: 'Clipping', icon: 'i-lucide-scissors' },
  { value: 'remplacement', label: 'Remplacement', icon: 'i-lucide-refresh-cw' },
  { value: 'perte', label: 'Perte', icon: 'i-lucide-alert-triangle' },
  { value: 'ponte_vue', label: 'Ponte vue', icon: 'i-lucide-eye' },
  { value: 'cellule_royale_trouvee', label: 'Cellule royale', icon: 'i-lucide-hexagon' },
  { value: 'elevage', label: 'Élevage', icon: 'i-lucide-sprout' },
];

const couleurOptions = [
  { value: 'blanc', label: 'Blanc (1, 6)', hex: '#FFFFFF' },
  { value: 'jaune', label: 'Jaune (2, 7)', hex: '#F5C842' },
  { value: 'rouge', label: 'Rouge (3, 8)', hex: '#EF4444' },
  { value: 'vert', label: 'Vert (4, 9)', hex: '#22C55E' },
  { value: 'bleu', label: 'Bleu (5, 0)', hex: '#3B82F6' },
];

const currentYear = new Date().getFullYear();
const COULEURS_PAR_RESTE = ['bleu', 'blanc', 'jaune', 'rouge', 'vert'];
const couleurAnneeCourante = computed(() => COULEURS_PAR_RESTE[currentYear % 5] ?? 'blanc');

const showCouleur = computed(() =>
  ['introduction', 'marquage', 'remplacement'].includes(props.modelValue.typeEvenement),
);
const showOrigine = computed(() =>
  ['introduction', 'remplacement'].includes(props.modelValue.typeEvenement),
);
const showQualitePonte = computed(() =>
  ['ponte_vue', 'introduction', 'remplacement'].includes(props.modelValue.typeEvenement),
);
const showActionOrpheline = computed(() => props.modelValue.typeEvenement === 'perte');
</script>
