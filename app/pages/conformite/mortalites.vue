<script setup lang="ts">
definePageMeta({ layout: 'default' });

const showModal = ref(false);
interface Mortalite {
  id: string;
  nombreColonies: number;
  dateConstatee: string;
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
const { data, pending, refresh } = useFetch('/api/mortalites', {
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

const CAUSES = [
  'Varroa',
  'Famine',
  'Pesticides',
  'Maladie',
  'Pillage',
  'Froid',
  'Inconnue',
  'Autre',
];
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
          @click="showModal = true"
        />
      </template>
    </UiPageHeader>

    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
      />
    </div>

    <UiEmptyState
      v-else-if="!mortalites.length"
      icon="i-lucide-heart-off"
      title="Aucune mortalité enregistrée"
      description="Déclarez les pertes de colonies pour tenir votre registre d'élevage à jour"
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
                <span v-if="mort.causeSuspectee"> · {{ mort.causeSuspectee }}</span>
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
            </div>
          </div>
          <div>
            <label :class="labelClass">Cause suspectée</label>
            <select v-model="form.causeSuspectee" :class="inputClass">
              <option value="">Non renseignée</option>
              <option v-for="c in CAUSES" :key="c" :value="c">{{ c }}</option>
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
