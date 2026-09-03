<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
interface Mortalite {
  id: string;
  nombreColonies: number;
  dateConstatee: string;
  type: string;
  rucherNom?: string | null;
  causeSuspectee?: string | null;
  declarationTraces?: boolean;
  declarationAssurance?: boolean;
}

interface RucherOption {
  id: string;
  nom: string;
}

const notifications = useNotifications();
const { data, pending, error, refresh } = useFetch('/api/mortalites', {
  key: 'mortalites-list',
  lazy: true,
});
const mortalites = computed<Mortalite[]>(
  () => (data.value as { data: Mortalite[] } | null)?.data ?? [],
);

const { data: ruchersData } = useFetch('/api/ruchers', {
  key: 'ruchers-for-mortalites',
  lazy: true,
});
const ruchers = computed<RucherOption[]>(
  () => (ruchersData.value as { data: RucherOption[] } | null)?.data ?? [],
);

/**
 * « Aucun rucher » n'est PAS « pas encore chargé » : la requête est `lazy`,
 * `data` vaut null pendant l'aller-retour. Sans cette distinction, le message
 * clignote chez tous ceux qui ont bel et bien des ruchers.
 */
const aucunRucher = computed(() => ruchersData.value != null && ruchers.value.length === 0);

// Total du cheptel — pour rapporter les pertes à un taux, pas juste un compte brut.
const { data: rucheStatsData } = useFetch('/api/ruches/stats', {
  key: 'ruche-stats-for-mortalites',
  lazy: true,
});

/**
 * ⚠️ CETTE LISTE VENAIT D'UN `useFetch` QUE RIEN NE RAFRAÎCHISSAIT. Maya crée
 * un rucher ou une ruche à la voix, et la liste des ruchers de cette page continuait d'afficher l'ancien jeu jusqu'au
 * rechargement de la page — l'apiculteur cherche ce qu'il vient de créer, ne le
 * trouve pas, et le recrée.
 */
const { on: surEvenementDonnees } = useDataBus();
surEvenementDonnees(
  [
    'rucher:created',
    'rucher:updated',
    'rucher:deleted',
    'ruche:created',
    'ruche:updated',
    'ruche:deleted',
  ],
  () => {
    void refreshNuxtData(['ruchers-for-mortalites', 'ruche-stats-for-mortalites']);
  },
);
const totalRuches = computed(
  () =>
    (rucheStatsData.value as { data?: { totalRuches?: number } } | null)?.data?.totalRuches ?? 0,
);

// ─── Statistiques (taux de perte, causes, tendance saisonnière) ──────────────
const mortalitesAnneeCourante = computed(() => {
  const anneeCourante = new Date().getFullYear();
  return mortalites.value.filter((m) => new Date(m.dateConstatee).getFullYear() === anneeCourante);
});
const coloniesParduesAnnee = computed(() =>
  mortalitesAnneeCourante.value.reduce((sum, m) => sum + m.nombreColonies, 0),
);
const tauxPerteAnnuel = computed(() => {
  if (!totalRuches.value) return null;
  return Math.round((coloniesParduesAnnee.value / totalRuches.value) * 100);
});

const repartitionCauses = computed(() => {
  const parCause = new Map<string, number>();
  for (const m of mortalites.value) {
    const cle = m.causeSuspectee ? causeLabel(m.causeSuspectee) : 'Non renseignée';
    parCause.set(cle, (parCause.get(cle) ?? 0) + m.nombreColonies);
  }
  return [...parCause.entries()]
    .map(([cause, colonies]) => ({ cause, colonies }))
    .sort((a, b) => b.colonies - a.colonies);
});

const TYPE_LABELS: Record<string, string> = {
  hiver: 'Hiver',
  printemps: 'Printemps',
  ete: 'Été',
  automne: 'Automne',
  aiguë: 'Aiguë',
};
const tendanceSaisonniere = computed(() => {
  const parType = new Map<string, number>();
  for (const m of mortalites.value) {
    parType.set(m.type, (parType.get(m.type) ?? 0) + m.nombreColonies);
  }
  return [...parType.entries()]
    .map(([type, colonies]) => ({ type: TYPE_LABELS[type] ?? type, colonies }))
    .sort((a, b) => b.colonies - a.colonies);
});

// Valeurs alignées sur l'enum DB `cause_mortalite` (varroa|famine|pesticides|
// maladie|pillage|froid|inconnue|autre) — permet l'agrégation par cause.
const CAUSES = [
  { value: 'varroa', label: 'Varroa' },
  { value: 'famine', label: 'Famine' },
  { value: 'pesticides', label: 'Pesticides' },
  { value: 'maladie', label: 'Maladie' },
  { value: 'pillage', label: 'Pillage' },
  { value: 'froid', label: 'Froid' },
  { value: 'inconnue', label: 'Inconnue' },
  { value: 'autre', label: 'Autre' },
];
const causeLabel = (v: string) => CAUSES.find((c) => c.value === v.toLowerCase())?.label ?? v;
const TYPES = [
  { value: 'hiver', label: 'Mortalité hivernale' },
  { value: 'printemps', label: 'Mortalité printanière' },
  { value: 'ete', label: 'Mortalité estivale' },
  { value: 'automne', label: 'Mortalité automnale' },
  { value: 'aiguë', label: 'Mortalité aiguë (rapide)' },
];

const form = reactive({
  rucherId: '',
  dateConstatee: new Date().toISOString().slice(0, 10),
  type: 'hiver',
  nombreColonies: 1,
  causeSuspectee: '',
  declarationTraces: false,
  declarationAssurance: false,
  notes: '',
});

const saving = ref(false);

async function handleSave() {
  saving.value = true;
  try {
    await $fetch('/api/mortalites', {
      method: 'POST',
      body: {
        ...form,
        dateConstatee: new Date(form.dateConstatee).toISOString(),
        rucherId: form.rucherId || undefined,
      },
    });
    notifications.success('Mortalité enregistrée');
    showModal.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}

const inputClass =
  'w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20';
const labelClass = 'mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]';
</script>

<template>
  <div>
    <UiPageHeader
      title="Mortalités"
      description="Registre des pertes de colonies (obligatoire pour le registre d'élevage)"
    >
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          label="Enregistrer une mortalité"
          color="primary"
          data-tutorial="mortalites-nouvelle"
          @click="showModal = true"
        />
      </template>
    </UiPageHeader>

    <!-- Statistiques de pertes — taux, causes, tendance saisonnière -->
    <div
      v-if="!pending && mortalites.length"
      data-tutorial="mortalites-stats"
      class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
        <p
          class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Taux de perte (année en cours)
        </p>
        <p class="mt-1.5 text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
          {{ tauxPerteAnnuel !== null ? `${tauxPerteAnnuel}%` : '—' }}
        </p>
        <p class="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
          {{ coloniesParduesAnnee }} colonie{{ coloniesParduesAnnee > 1 ? 's' : '' }} /
          {{ totalRuches }} au cheptel
        </p>
      </div>
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
        <p
          class="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Causes principales
        </p>
        <div class="space-y-1">
          <div
            v-for="c in repartitionCauses.slice(0, 3)"
            :key="c.cause"
            class="flex items-center justify-between text-[12.5px]"
          >
            <span class="text-[var(--text-secondary)]">{{ c.cause }}</span>
            <span class="font-semibold tabular-nums text-[var(--text-primary)]">{{
              c.colonies
            }}</span>
          </div>
        </div>
      </div>
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
        <p
          class="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Tendance saisonnière
        </p>
        <div class="space-y-1">
          <div
            v-for="t in tendanceSaisonniere.slice(0, 3)"
            :key="t.type"
            class="flex items-center justify-between text-[12.5px]"
          >
            <span class="text-[var(--text-secondary)]">{{ t.type }}</span>
            <span class="font-semibold tabular-nums text-[var(--text-primary)]">{{
              t.colonies
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
      />
    </div>

    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <UiEmptyState
      v-else-if="!mortalites.length"
      icon="i-lucide-heart-off"
      title="Aucune perte déclarée — tant mieux 🌿"
      description="Si une colonie venait à s'éteindre, déclarez-la ici : votre registre d'élevage restera toujours à jour."
      action-label="Enregistrer une mortalité"
      @action="showModal = true"
    />

    <div v-else class="space-y-3">
      <div
        v-for="mort in mortalites"
        :key="mort.id"
        class="rounded-[12px] border border-[var(--border-default)] bg-white p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-red-50"
            >
              <UIcon name="i-lucide-heart-off" class="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p class="text-[14px] font-semibold text-[var(--text-primary)]">
                {{ mort.nombreColonies }} colonie{{ mort.nombreColonies > 1 ? 's' : '' }} perdue{{
                  mort.nombreColonies > 1 ? 's' : ''
                }}
              </p>
              <p class="text-[12px] text-[var(--text-tertiary)]">
                {{ new Date(mort.dateConstatee).toLocaleDateString('fr-FR') }}
                <span v-if="mort.rucherNom"> · {{ mort.rucherNom }}</span>
                <span v-if="mort.causeSuspectee"> · {{ causeLabel(mort.causeSuspectee) }}</span>
              </p>
            </div>
          </div>
          <div class="flex shrink-0 gap-1">
            <UBadge
              v-if="mort.declarationTraces"
              label="TRACES"
              color="warning"
              variant="subtle"
              size="xs"
            />
            <UBadge
              v-if="mort.declarationAssurance"
              label="Assurance"
              color="info"
              variant="subtle"
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-[17px] font-semibold text-[var(--text-primary)]">
            Enregistrer une mortalité
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :class="labelClass">Date constatée *</label>
              <UiMobileDatePicker v-model="form.dateConstatee" mode="date" />
            </div>
            <div>
              <label :class="labelClass">Nb colonies *</label>
              <input v-model="form.nombreColonies" type="number" :min="1" :class="inputClass" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label :class="labelClass">Type</label>
              <select v-model="form.type" :class="inputClass">
                <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label :class="labelClass">Rucher</label>
              <select v-model="form.rucherId" :class="inputClass">
                <option value="">Non renseigné</option>
                <option v-for="r in ruchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
              </select>
              <p v-if="aucunRucher" class="mt-1.5 text-xs text-[var(--text-tertiary)]">
                Aucun rucher enregistré —
                <NuxtLink
                  to="/ruchers/nouveau"
                  class="font-medium text-[var(--honey-deep)] hover:underline"
                >
                  en créer un
                </NuxtLink>
                permet de localiser la perte dans vos déclarations.
              </p>
            </div>
          </div>
          <div>
            <label :class="labelClass">Cause suspectée</label>
            <select v-model="form.causeSuspectee" :class="inputClass">
              <option value="">Non renseignée</option>
              <option v-for="c in CAUSES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="form.declarationTraces" type="checkbox" class="rounded" />
              <span class="text-[13px] text-[var(--text-secondary)]"
                >Déclaration TRACES (mortalités suspectes)</span
              >
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="form.declarationAssurance" type="checkbox" class="rounded" />
              <span class="text-[13px] text-[var(--text-secondary)]">Déclaration assurance</span>
            </label>
          </div>
          <div>
            <label :class="labelClass">Notes</label>
            <textarea v-model="form.notes" rows="2" :class="inputClass + ' resize-none'" />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
            <UButton label="Enregistrer" color="primary" :loading="saving" @click="handleSave" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
