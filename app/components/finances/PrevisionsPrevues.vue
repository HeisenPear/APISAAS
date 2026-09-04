<script setup lang="ts">
interface Prevision {
  id: string;
  libelle: string;
  montant: string;
  type: 'depense' | 'investissement' | 'recette';
  recurrence: 'ponctuel' | 'mensuel' | 'annuel';
  datePrevue: string;
  notes: string | null;
}

// Émis après toute mutation → le parent rafraîchit la projection.
const emit = defineEmits<{ changed: [] }>();

const notifications = useNotifications();

const { data, pending, refresh } = useFetch<{ data: Prevision[] }>(
  '/api/finances/tresorerie/previsions',
  { key: 'previsions-tresorerie', default: () => ({ data: [] as Prevision[] }) },
);
const items = computed(() => data.value?.data ?? []);

const TYPES = [
  { value: 'depense', label: 'Dépense' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'recette', label: 'Recette' },
];
const RECURRENCES = [
  { value: 'ponctuel', label: 'Ponctuel' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'annuel', label: 'Annuel' },
];
const TYPE_LABEL: Record<string, string> = {
  depense: 'Dépense',
  investissement: 'Investissement',
  recette: 'Recette',
};
const RECURRENCE_LABEL: Record<string, string> = {
  ponctuel: 'Une fois',
  mensuel: 'Tous les mois',
  annuel: 'Chaque année',
};

// ── Formulaire (ajout / édition) ─────────────────────────────
const formOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const form = ref({
  libelle: '',
  montant: null as number | null,
  type: 'depense' as Prevision['type'],
  recurrence: 'ponctuel' as Prevision['recurrence'],
  date: dateDuJour(),
});

function resetForm() {
  form.value = {
    libelle: '',
    montant: null,
    type: 'depense',
    recurrence: 'ponctuel',
    date: dateDuJour(),
  };
  editingId.value = null;
}

function openAdd() {
  resetForm();
  formOpen.value = true;
}

function openEdit(p: Prevision) {
  editingId.value = p.id;
  form.value = {
    libelle: p.libelle,
    montant: Number(p.montant),
    type: p.type,
    recurrence: p.recurrence,
    date: p.datePrevue.slice(0, 10),
  };
  formOpen.value = true;
}

function cancel() {
  formOpen.value = false;
  resetForm();
}

const canSubmit = computed(
  () => form.value.libelle.trim().length > 0 && (form.value.montant ?? 0) > 0 && !!form.value.date,
);

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  try {
    const body = {
      libelle: form.value.libelle.trim(),
      montant: form.value.montant,
      type: form.value.type,
      recurrence: form.value.recurrence,
      datePrevue: form.value.date,
    };
    if (editingId.value) {
      await $fetch(`/api/finances/tresorerie/previsions/${editingId.value}`, {
        method: 'PATCH',
        body,
      });
      notifications.success('Poste mis à jour');
    } else {
      await $fetch('/api/finances/tresorerie/previsions', { method: 'POST', body });
      notifications.success('Poste ajouté');
    }
    formOpen.value = false;
    resetForm();
    await refresh();
    emit('changed');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    saving.value = false;
  }
}

const deletingId = ref<string | null>(null);
async function remove(p: Prevision) {
  if (deletingId.value) return;
  deletingId.value = p.id;
  try {
    await $fetch(`/api/finances/tresorerie/previsions/${p.id}`, { method: 'DELETE' });
    await refresh();
    emit('changed');
    notifications.success('Poste supprimé');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e));
  } finally {
    deletingId.value = null;
  }
}

function eur(v: number): string {
  return `${Math.round(v).toLocaleString('fr-FR')} €`;
}
function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        Dépenses & investissements prévus
      </p>
      <UButton
        v-if="!formOpen"
        icon="i-lucide-plus"
        size="xs"
        color="primary"
        variant="soft"
        @click="openAdd"
      >
        Ajouter
      </UButton>
    </div>

    <!-- Formulaire ajout / édition -->
    <div
      v-if="formOpen"
      class="space-y-3 rounded-[12px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
    >
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Libellé" class="sm:col-span-2">
          <UInput v-model="form.libelle" placeholder="Ex : nouvelle miellerie, ruches, camion…" />
        </UFormField>
        <UFormField label="Montant">
          <UInput v-model.number="form.montant" type="number" :step="10" placeholder="0">
            <template #trailing><span class="text-[var(--text-tertiary)]">€</span></template>
          </UInput>
        </UFormField>
        <UFormField label="Type">
          <USelect v-model="form.type" :items="TYPES" value-key="value" label-key="label" />
        </UFormField>
        <UFormField label="Échéance">
          <UInput v-model="form.date" type="date" />
        </UFormField>
        <UFormField label="Récurrence">
          <USelect
            v-model="form.recurrence"
            :items="RECURRENCES"
            value-key="value"
            label-key="label"
          />
        </UFormField>
      </div>
      <div class="flex items-center justify-end gap-2">
        <UButton color="neutral" variant="ghost" size="sm" @click="cancel">Annuler</UButton>
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-check"
          :loading="saving"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ editingId ? 'Enregistrer' : 'Ajouter' }}
        </UButton>
      </div>
    </div>

    <!-- Liste -->
    <div v-if="pending" class="space-y-2">
      <div
        v-for="i in 2"
        :key="i"
        class="h-12 animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
      />
    </div>

    <div
      v-else-if="!items.length && !formOpen"
      class="flex flex-col items-center gap-1 rounded-[12px] border border-dashed border-[var(--border-default)] bg-white py-6 text-center"
    >
      <UIcon name="i-lucide-receipt-text" class="h-5 w-5 text-[var(--text-tertiary)]" />
      <p class="text-[13px] text-[var(--text-secondary)]">
        Aucun poste prévu. Ajoutez vos dépenses et investissements à venir pour affiner la
        projection.
      </p>
    </div>

    <div
      v-else-if="items.length"
      class="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white"
    >
      <div
        v-for="p in items"
        :key="p.id"
        class="flex items-center justify-between gap-3 border-b border-[var(--border-faint)] px-4 py-3 last:border-0"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-[var(--text-primary)]">{{ p.libelle }}</p>
          <p
            class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-tertiary)]"
          >
            <span>{{ TYPE_LABEL[p.type] }}</span>
            <span>·</span>
            <span>{{ dateCourte(p.datePrevue) }}</span>
            <span>·</span>
            <span>{{ RECURRENCE_LABEL[p.recurrence] }}</span>
          </p>
        </div>
        <span
          class="shrink-0 text-sm font-semibold tabular-nums"
          :style="{ color: p.type === 'recette' ? 'var(--sage-deep)' : 'var(--clay-deep)' }"
        >
          {{ p.type === 'recette' ? '+' : '−' }}{{ eur(Number(p.montant)) }}
        </span>
        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            class="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
            title="Modifier"
            @click="openEdit(p)"
          >
            <UIcon name="i-lucide-pencil" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-600"
            title="Supprimer"
            :class="deletingId === p.id ? 'opacity-50 pointer-events-none' : ''"
            @click="remove(p)"
          >
            <UIcon
              :name="deletingId === p.id ? 'i-lucide-loader-2' : 'i-lucide-trash-2'"
              class="h-4 w-4"
              :class="deletingId === p.id ? 'animate-spin' : ''"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
