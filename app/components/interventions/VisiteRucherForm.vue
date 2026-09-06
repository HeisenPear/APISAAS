<template>
  <div class="space-y-6">
    <!-- Date + Température -->
    <div class="flex items-end gap-3">
      <div class="flex-1">
        <label
          class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
          >Date de visite</label
        >
        <UiMobileDatePicker v-model="form.date" mode="datetime" />
      </div>
      <div class="w-32 shrink-0">
        <label
          class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
          >Temp.</label
        >
        <div class="relative">
          <UIcon
            name="i-lucide-thermometer"
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style="color: var(--text-tertiary)"
          />
          <input
            v-model.number="form.temperature"
            type="number"
            step="0.5"
            min="-20"
            max="50"
            placeholder="22°C"
            class="maya-input"
            style="padding-left: 32px"
          />
        </div>
      </div>
    </div>

    <!-- Ratings -->
    <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
      <p
        class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        01 — État général
      </p>
      <div class="divide-y" style="border-color: var(--border-default)">
        <div
          v-for="rating in ratings"
          :key="rating.key"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <span class="text-[13px] font-medium" style="color: var(--text-secondary)">{{
            rating.label
          }}</span>
          <div class="flex gap-1.5">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] font-semibold transition-all duration-150 active:scale-90"
              :class="dotClass(n, form[rating.key as keyof typeof form] as number)"
              @click="form[rating.key as keyof typeof form] = n as never"
            >
              {{ n }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions chips -->
    <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
      <p
        class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        02 — Actions effectuées
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="action in RUCHER_ACTIONS"
          :key="action.id"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 active:scale-95"
          :class="
            form.actions.includes(action.id)
              ? 'border-[var(--honey)] bg-[var(--honey-soft)] text-[var(--honey-deep)]'
              : 'border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
          "
          @click="toggleAction(action.id)"
        >
          <UIcon :name="action.icon" class="h-3.5 w-3.5" />
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
      <p
        class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        03 — Notes générales
      </p>
      <textarea
        v-model="form.notes"
        :rows="3"
        class="maya-textarea"
        placeholder="Observation générale du rucher, conditions de la visite…"
      />
    </div>

    <!-- Exceptions -->
    <div
      class="rounded-[14px] border bg-white overflow-hidden"
      style="border-color: var(--border-default)"
    >
      <button
        type="button"
        class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
        @click="showExceptions = !showExceptions"
      >
        <UIcon
          :name="showExceptions ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 shrink-0"
          style="color: var(--text-tertiary)"
        />
        <span class="text-[13px] font-medium" style="color: var(--honey-deep)">
          {{
            form.exceptions.length > 0
              ? `${form.exceptions.length} exception(s) notée(s) sur ruches spécifiques`
              : 'Ajouter des exceptions par ruche'
          }}
        </span>
        <span class="text-[12px]" style="color: var(--text-tertiary)">(optionnel)</span>
      </button>

      <div
        v-if="showExceptions"
        class="px-5 pb-5 border-t"
        style="border-color: var(--border-default)"
      >
        <p class="mt-4 text-[12.5px]" style="color: var(--text-tertiary)">
          Notez uniquement les ruches qui nécessitent une attention particulière. Les autres sont
          considérées "RAS".
        </p>

        <!-- Ajout exception -->
        <div class="mt-4 flex gap-2">
          <select
            v-model="newExcRucheId"
            class="flex-1 h-9 rounded-[8px] border px-3 text-[13px] bg-white"
            style="border-color: var(--border-default); color: var(--text-primary)"
          >
            <option value="">Sélectionner une ruche…</option>
            <option v-for="r in ruchesDisponibles" :key="r.id" :value="r.id">
              Ruche {{ r.numero }}
            </option>
          </select>
          <UButton
            size="sm"
            icon="i-lucide-plus"
            color="primary"
            :disabled="!newExcRucheId"
            @click="addException"
          >
            Ajouter
          </UButton>
        </div>

        <!-- Liste exceptions -->
        <div v-if="form.exceptions.length > 0" class="mt-4 space-y-3">
          <div
            v-for="(exc, i) in form.exceptions"
            :key="exc.rucheId"
            class="rounded-[12px] border p-4"
            style="border-color: var(--border-default); background: var(--surface-muted)"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-[13px] font-semibold" style="color: var(--text-primary)">
                Ruche {{ rucheName(exc.rucheId) }}
              </span>
              <button
                aria-label="Retirer cette exception"
                type="button"
                class="p-1 hover:text-red-500 transition-colors"
                style="color: var(--text-tertiary)"
                @click="removeException(i)"
              >
                <UIcon name="i-lucide-x" class="h-4 w-4" />
              </button>
            </div>
            <!-- Types exception chips -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              <button
                v-for="t in EXCEPTION_TYPES"
                :key="t.id"
                type="button"
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 active:scale-95"
                :class="
                  exc.types.includes(t.id)
                    ? t.activeClass
                    : 'bg-white border border-[var(--border-default)] text-[var(--text-tertiary)]'
                "
                @click="toggleExcType(i, t.id)"
              >
                {{ t.label }}
              </button>
            </div>
            <textarea v-model="exc.notes" :rows="2" class="maya-textarea" placeholder="Détail…" />
          </div>
        </div>

        <div
          v-if="form.exceptions.length > 0"
          class="mt-3 flex items-center gap-1.5 text-[12px]"
          style="color: var(--sage-deep)"
        >
          <UIcon name="i-lucide-info" class="h-3.5 w-3.5" style="color: var(--sage)" />
          {{ form.exceptions.length }} exception(s) sur {{ ruches.length }} ruches — les autres
          seront marquées "RAS"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface VisiteRucherPayload {
  date: string;
  temperature?: number;
  forceGenerale?: number;
  reservesGenerales?: number;
  couvainGeneral?: number;
  comportement?: number;
  actions: string[];
  notes?: string;
  exceptions: { rucheId: string; types: string[]; notes?: string }[];
}

const props = defineProps<{
  ruches: { id: string; numero: string | number }[];
}>();

const showExceptions = ref(false);
const newExcRucheId = ref('');

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

const form = reactive({
  date: defaultDate,
  temperature: undefined as number | undefined,
  forceGenerale: 0,
  reservesGenerales: 0,
  couvainGeneral: 0,
  comportement: 0,
  actions: [] as string[],
  notes: '',
  exceptions: [] as { rucheId: string; types: string[]; notes: string }[],
});

const ratings = [
  { key: 'forceGenerale', label: 'Force des colonies' },
  { key: 'reservesGenerales', label: 'Réserves' },
  { key: 'couvainGeneral', label: 'Couvain' },
  { key: 'comportement', label: 'Comportement' },
];

const RUCHER_ACTIONS = [
  { id: 'controle_visuel', label: 'Contrôle visuel', icon: 'i-lucide-eye' },
  { id: 'nourrissement', label: 'Nourrissement', icon: 'i-lucide-droplets' },
  { id: 'traitement_varroa', label: 'Traitement varroa', icon: 'i-lucide-shield' },
  { id: 'ajout_hausses', label: 'Ajout hausses', icon: 'i-lucide-layers' },
  { id: 'retrait_hausses', label: 'Retrait hausses', icon: 'i-lucide-layers' },
  { id: 'recolte', label: 'Récolte', icon: 'i-lucide-droplet' },
  { id: 'entretien', label: 'Entretien / désherbage', icon: 'i-lucide-scissors' },
  { id: 'remplacement_reine', label: 'Remplacement reine', icon: 'i-lucide-crown' },
];

const EXCEPTION_TYPES = [
  {
    id: 'faible',
    label: 'Colonie faible',
    activeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  {
    id: 'orpheline',
    label: 'Orpheline',
    activeClass: 'bg-red-100 text-red-700 border border-red-200',
  },
  {
    id: 'essaimage',
    label: 'Risque essaimage',
    activeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  {
    id: 'maladie',
    label: 'Problème sanitaire',
    activeClass: 'bg-red-100 text-red-700 border border-red-200',
  },
  {
    id: 'reserves_basses',
    label: 'Réserves basses',
    activeClass: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  {
    id: 'agressive',
    label: 'Agressive',
    activeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  {
    id: 'a_surveiller',
    label: 'À surveiller',
    activeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  {
    id: 'positive',
    label: '⭐ Exceptionnelle',
    activeClass: 'bg-[var(--sage-soft)] text-[var(--sage-deep)] border border-[var(--sage-soft)]',
  },
];

const ruchesDisponibles = computed(() =>
  props.ruches.filter((r) => !form.exceptions.some((e) => e.rucheId === r.id)),
);

function dotClass(n: number, current: number): string {
  if (n > current)
    return 'bg-[var(--surface-muted)] text-[var(--text-tertiary)] hover:bg-[var(--border-default)]';
  if (current <= 2) return 'bg-red-400 text-white';
  if (current === 3) return 'bg-amber-400 text-white';
  return 'bg-[var(--sage)] text-white';
}

function toggleAction(id: string) {
  const idx = form.actions.indexOf(id);
  if (idx === -1) form.actions.push(id);
  else form.actions.splice(idx, 1);
}

function addException() {
  if (!newExcRucheId.value) return;
  form.exceptions.push({ rucheId: newExcRucheId.value, types: [], notes: '' });
  newExcRucheId.value = '';
}

function removeException(i: number) {
  form.exceptions.splice(i, 1);
}

function toggleExcType(excIdx: number, typeId: string) {
  const exc = form.exceptions[excIdx];
  if (!exc) return;
  const idx = exc.types.indexOf(typeId);
  if (idx === -1) exc.types.push(typeId);
  else exc.types.splice(idx, 1);
}

function rucheName(rucheId: string): string | number {
  return props.ruches.find((r) => r.id === rucheId)?.numero ?? '?';
}

function buildPayload(): VisiteRucherPayload {
  return {
    date: new Date(form.date).toISOString(),
    temperature: form.temperature,
    forceGenerale: form.forceGenerale > 0 ? form.forceGenerale : undefined,
    reservesGenerales: form.reservesGenerales > 0 ? form.reservesGenerales : undefined,
    couvainGeneral: form.couvainGeneral > 0 ? form.couvainGeneral : undefined,
    comportement: form.comportement > 0 ? form.comportement : undefined,
    actions: form.actions,
    notes: form.notes || undefined,
    exceptions: form.exceptions
      .filter((e) => e.types.length > 0)
      .map((e) => ({ rucheId: e.rucheId, types: e.types, notes: e.notes || undefined })),
  };
}

defineExpose({ buildPayload });
</script>

<style scoped>
/* Grammaire de saisie unifiée (.maya-input/.maya-textarea, main.css). On garde
   juste le redimensionnement vertical des zones de texte de ce formulaire. */
.maya-textarea {
  resize: vertical;
}
</style>
