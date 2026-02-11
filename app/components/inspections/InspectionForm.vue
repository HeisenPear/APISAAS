<template>
  <div>
    <!-- Step indicator -->
    <div class="mb-8 flex items-center justify-between">
      <div v-for="(_s, i) in steps" :key="i" class="flex items-center">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all"
          :class="stepClass(i)"
          @click="goToStep(i)"
        >
          <UIcon v-if="i < step" name="i-lucide-check" class="h-4 w-4" />
          <span v-else>{{ i + 1 }}</span>
        </button>
        <span
          v-if="i < steps.length - 1"
          class="mx-2 h-px w-8 sm:w-12"
          :class="i < step ? 'bg-amber-400' : 'bg-stone-200'"
        />
      </div>
    </div>

    <h2 class="mb-1 text-lg font-semibold text-stone-900">{{ steps[step] }}</h2>
    <p class="mb-6 text-sm text-stone-500">{{ stepDescriptions[step] }}</p>

    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Ruche + Date + Meteo -->
      <div v-show="step === 0" class="space-y-4">
        <!-- Template -->
        <UFormField label="Template" name="template">
          <select
            v-model="template"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            @change="applyTemplate"
          >
            <option value="">Inspection libre</option>
            <option value="visite_printemps">Visite de printemps</option>
            <option value="controle">Controle regulier</option>
            <option value="traitement">Traitement sanitaire</option>
            <option value="recolte">Visite recolte</option>
            <option value="hivernage">Mise en hivernage</option>
          </select>
        </UFormField>

        <!-- Ruche selection -->
        <UFormField label="Ruche" name="rucheId" required>
          <select
            v-model="formData.rucheId"
            required
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="" disabled>Choisir une ruche</option>
            <optgroup v-for="rucher in ruchersWithRuches" :key="rucher.id" :label="rucher.nom">
              <option v-for="ruche in rucher.ruches" :key="ruche.id" :value="ruche.id">
                {{ ruche.numero }} ({{ ruche.type }})
              </option>
            </optgroup>
          </select>
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Date -->
          <UFormField label="Date de visite" name="dateVisite" required>
            <UInput v-model="formData.dateVisite" type="datetime-local" required class="w-full" />
          </UFormField>

          <!-- Type -->
          <UFormField label="Type" name="type">
            <select
              v-model="formData.type"
              class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Non specifie</option>
              <option value="visite_printemps">Visite de printemps</option>
              <option value="controle">Controle</option>
              <option value="traitement">Traitement</option>
              <option value="recolte">Recolte</option>
              <option value="hivernage">Hivernage</option>
            </select>
          </UFormField>
        </div>

        <!-- Meteo -->
        <div class="rounded-xl bg-stone-50 p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Meteo</h4>
          <div class="grid grid-cols-3 gap-3">
            <UFormField label="Temperature (°C)" name="meteoTemp">
              <UInput
                v-model.number="formData.meteoTemp"
                type="number"
                placeholder="18"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Vent" name="meteoVent">
              <select
                v-model="formData.meteoVent"
                class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">—</option>
                <option value="calme">Calme</option>
                <option value="leger">Leger</option>
                <option value="modere">Modere</option>
                <option value="fort">Fort</option>
              </select>
            </UFormField>
            <UFormField label="Ciel" name="meteoCiel">
              <select
                v-model="formData.meteoCiel"
                class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">—</option>
                <option value="soleil">Soleil</option>
                <option value="nuageux">Nuageux</option>
                <option value="couvert">Couvert</option>
                <option value="pluie">Pluie</option>
              </select>
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Step 2: Etat colonie -->
      <div v-show="step === 1" class="space-y-5">
        <!-- Force colonie slider -->
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700">
            Force de la colonie : <strong>{{ formData.forceColonie }}/5</strong>
          </label>
          <input
            v-model.number="formData.forceColonie"
            type="range"
            min="1"
            max="5"
            step="1"
            class="w-full accent-amber-500"
          />
          <div class="flex justify-between text-xs text-stone-400">
            <span>Tres faible</span>
            <span>Excellente</span>
          </div>
        </div>

        <!-- Couvain slider -->
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700">
            Couvain : <strong>{{ formData.couvain }}/5</strong>
          </label>
          <input
            v-model.number="formData.couvain"
            type="range"
            min="0"
            max="5"
            step="1"
            class="w-full accent-amber-500"
          />
          <div class="flex justify-between text-xs text-stone-400">
            <span>Absent</span>
            <span>Abondant</span>
          </div>
        </div>

        <!-- Reserves slider -->
        <div>
          <label class="mb-2 block text-sm font-medium text-stone-700">
            Reserves : <strong>{{ formData.reserves }}/5</strong>
          </label>
          <input
            v-model.number="formData.reserves"
            type="range"
            min="1"
            max="5"
            step="1"
            class="w-full accent-amber-500"
          />
          <div class="flex justify-between text-xs text-stone-400">
            <span>Vides</span>
            <span>Pleines</span>
          </div>
        </div>

        <!-- Comportement -->
        <UFormField label="Comportement" name="comportement">
          <select
            v-model="formData.comportement"
            class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">Non observe</option>
            <option value="calme">Calme</option>
            <option value="agressive">Agressive</option>
            <option value="nerveuse">Nerveuse</option>
          </select>
        </UFormField>

        <!-- Boolean checks -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2.5 cursor-pointer">
            <input v-model="formData.reineVue" type="checkbox" class="accent-amber-500" />
            <span class="text-sm text-stone-700">Reine vue</span>
          </label>
          <label class="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2.5 cursor-pointer">
            <input v-model="formData.celluleRoyale" type="checkbox" class="accent-amber-500" />
            <span class="text-sm text-stone-700">Cellule royale</span>
          </label>
          <label class="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2.5 cursor-pointer">
            <input v-model="formData.signeEssaimage" type="checkbox" class="accent-amber-500" />
            <span class="text-sm text-stone-700">Signe d'essaimage</span>
          </label>
        </div>
      </div>

      <!-- Step 3: Sanitaire -->
      <div v-show="step === 2" class="space-y-5">
        <UFormField label="Comptage varroa (chute naturelle)" name="varroa">
          <UInput
            v-model.number="formData.varroa"
            type="number"
            :min="0"
            placeholder="0"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Traitement applique" name="traitementApplique">
          <UInput
            v-model="formData.traitementApplique"
            placeholder="ex: Apivar, acide oxalique..."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Maladie observee" name="maladieObservee">
          <UInput
            v-model="formData.maladieObservee"
            placeholder="ex: Loque, nosema..."
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Step 4: Actions realisees -->
      <div v-show="step === 3" class="space-y-5">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="action in availableActions"
            :key="action.value"
            class="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5 cursor-pointer transition-colors"
            :class="
              formData.actionsRealisees.includes(action.value)
                ? 'bg-amber-50 border-amber-300'
                : 'bg-white hover:bg-stone-50'
            "
          >
            <input
              v-model="formData.actionsRealisees"
              type="checkbox"
              :value="action.value"
              class="accent-amber-500"
            />
            <div>
              <span class="text-sm font-medium text-stone-700">{{ action.label }}</span>
              <p v-if="action.desc" class="text-xs text-stone-400">{{ action.desc }}</p>
            </div>
          </label>
        </div>

        <!-- Nourrissement details -->
        <div
          v-if="formData.actionsRealisees.includes('nourrissement')"
          class="rounded-xl bg-amber-50 p-4"
        >
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600">
            Details nourrissement
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Type" name="nourrissementType">
              <select
                v-model="formData.nourrissementType"
                class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">—</option>
                <option value="sirop_50_50">Sirop 50/50</option>
                <option value="sirop_lourd">Sirop lourd</option>
                <option value="candi">Candi</option>
                <option value="pate_proteique">Pate proteique</option>
              </select>
            </UFormField>
            <UFormField label="Quantite (kg)" name="nourrissementQuantite">
              <UInput
                v-model.number="formData.nourrissementQuantite"
                type="number"
                :min="0"
                :step="0.1"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Step 5: Notes + Photos -->
      <div v-show="step === 4" class="space-y-5">
        <UFormField label="Notes" name="notes">
          <UTextarea
            v-model="formData.notes"
            placeholder="Observations, remarques..."
            :rows="5"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Duree de la visite (minutes)" name="dureeMinutes">
          <UInput
            v-model.number="formData.dureeMinutes"
            type="number"
            :min="0"
            placeholder="15"
            class="w-full"
          />
        </UFormField>

        <!-- Timer -->
        <div v-if="timerRunning || timerSeconds > 0" class="rounded-xl bg-stone-50 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-stone-400">Chronometre</p>
              <p class="text-2xl font-bold tabular-nums text-stone-900">{{ timerDisplay }}</p>
            </div>
            <div class="flex gap-2">
              <UButton
                v-if="!timerRunning"
                icon="i-lucide-play"
                variant="outline"
                color="primary"
                size="sm"
                @click="startTimer"
              />
              <UButton
                v-else
                icon="i-lucide-pause"
                variant="outline"
                color="neutral"
                size="sm"
                @click="stopTimer"
              />
              <UButton
                v-if="timerSeconds > 0 && !timerRunning"
                label="Appliquer"
                size="sm"
                color="primary"
                @click="applyTimer"
              />
            </div>
          </div>
        </div>

        <UButton
          v-else
          label="Demarrer le chronometre"
          icon="i-lucide-timer"
          variant="outline"
          color="neutral"
          @click="startTimer"
        />
      </div>

      <!-- Navigation buttons -->
      <div class="mt-8 flex items-center justify-between border-t border-stone-100 pt-6">
        <UButton
          v-if="step > 0"
          label="Precedent"
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          @click="step--"
        />
        <div v-else />

        <UButton
          v-if="step < steps.length - 1"
          label="Suivant"
          icon="i-lucide-arrow-right"
          trailing
          color="primary"
          @click="nextStep"
        />
        <UButton
          v-else
          type="submit"
          label="Enregistrer l'inspection"
          icon="i-lucide-check"
          color="primary"
          :loading="loading"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Rucher, Ruche } from '~/types/models';

const props = defineProps<{
  ruches: (Ruche & { rucherNom?: string })[];
  ruchers: Rucher[];
  loading?: boolean;
  initialRucheId?: string;
}>();

const emit = defineEmits<{
  submit: [data: InspectionFormData];
}>();

export interface InspectionFormData {
  rucheId: string;
  dateVisite: string;
  type: string;
  meteoTemp: number | undefined;
  meteoVent: string;
  meteoCiel: string;
  forceColonie: number;
  couvain: number;
  reserves: number;
  comportement: string;
  reineVue: boolean;
  celluleRoyale: boolean;
  signeEssaimage: boolean;
  varroa: number | undefined;
  traitementApplique: string;
  maladieObservee: string;
  actionsRealisees: string[];
  nourrissementType: string;
  nourrissementQuantite: number | undefined;
  notes: string;
  dureeMinutes: number | undefined;
}

const steps = ['Ruche & Date', 'Etat colonie', 'Sanitaire', 'Actions', 'Notes & Photos'];
const stepDescriptions = [
  'Selectionnez la ruche et renseignez les conditions',
  'Evaluez la force de la colonie',
  'Observations sanitaires et traitements',
  'Actions realisees pendant la visite',
  'Notes libres et duree de la visite',
];

const step = ref(0);
const template = ref('');

const now = new Date();
const localIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const formData = reactive<InspectionFormData>({
  rucheId: props.initialRucheId ?? '',
  dateVisite: localIso,
  type: '',
  meteoTemp: undefined,
  meteoVent: '',
  meteoCiel: '',
  forceColonie: 3,
  couvain: 3,
  reserves: 3,
  comportement: '',
  reineVue: false,
  celluleRoyale: false,
  signeEssaimage: false,
  varroa: undefined,
  traitementApplique: '',
  maladieObservee: '',
  actionsRealisees: [],
  nourrissementType: '',
  nourrissementQuantite: undefined,
  notes: '',
  dureeMinutes: undefined,
});

const availableActions = [
  { value: 'ajout_hausse', label: 'Ajout hausse', desc: null },
  { value: 'retrait_hausse', label: 'Retrait hausse', desc: null },
  { value: 'nourrissement', label: 'Nourrissement', desc: 'Sirop, candi, pate' },
  { value: 'traitement', label: 'Traitement sanitaire', desc: null },
  { value: 'ajout_cadre', label: 'Ajout cadre', desc: null },
  { value: 'remplacement_reine', label: 'Remplacement reine', desc: null },
  { value: 'division', label: 'Division', desc: null },
  { value: 'reunification', label: 'Reunification', desc: null },
  { value: 'marquage_reine', label: 'Marquage reine', desc: null },
  { value: 'nettoyage_plateau', label: 'Nettoyage plateau', desc: null },
];

// Group ruches by rucher
const ruchersWithRuches = computed(() => {
  const map = new Map<string, { id: string; nom: string; ruches: typeof props.ruches }>();
  for (const ruche of props.ruches) {
    const rucherId = ruche.rucherId;
    if (!map.has(rucherId)) {
      const rucher = props.ruchers.find((r) => r.id === rucherId);
      map.set(rucherId, {
        id: rucherId,
        nom: rucher?.nom ?? 'Sans rucher',
        ruches: [],
      });
    }
    map.get(rucherId)!.ruches.push(ruche);
  }
  return [...map.values()];
});

// Timer
const timerRunning = ref(false);
const timerSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

function startTimer() {
  timerRunning.value = true;
  timerInterval = setInterval(() => {
    timerSeconds.value++;
  }, 1000);
}

function stopTimer() {
  timerRunning.value = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function applyTimer() {
  formData.dureeMinutes = Math.round(timerSeconds.value / 60);
}

function applyTemplate() {
  if (!template.value) return;
  formData.type = template.value;
}

function stepClass(i: number) {
  if (i < step.value) return 'bg-amber-500 text-white';
  if (i === step.value) return 'bg-amber-100 text-amber-700 ring-2 ring-amber-500';
  return 'bg-stone-100 text-stone-400';
}

function goToStep(i: number) {
  if (i <= step.value) step.value = i;
}

function nextStep() {
  if (step.value === 0 && !formData.rucheId) return;
  step.value++;
}

function handleSubmit() {
  emit('submit', { ...formData });
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>
