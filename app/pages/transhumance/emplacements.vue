<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const { emit, on } = useDataBus();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);
const deleteTarget = ref<Record<string, unknown> | null>(null);
const showDeleteModal = ref(false);

// Analyse mellifère (parcelles RPG autour de l'emplacement)
const showAnalyse = ref(false);
const analyseTarget = ref<{
  id: string;
  nom: string;
  latitude: string | number;
  longitude: string | number;
} | null>(null);

function openAnalyse(emp: Record<string, unknown>) {
  analyseTarget.value = {
    id: emp.id as string,
    nom: emp.nom as string,
    latitude: emp.latitude as string,
    longitude: emp.longitude as string,
  };
  showAnalyse.value = true;
}

const { data, pending, refresh } = useFetch('/api/transhumance/emplacements', {
  key: 'transhumance-emplacements',
  query: { limit: 50, page: 1 },
  lazy: true,
});
on(['emplacement:created', 'emplacement:updated', 'emplacement:deleted'], () => refresh());
onMounted(() => refresh());

const form = reactive({
  nom: '',
  latitude: '',
  longitude: '',
  commune: '',
  codePostal: '',
  capaciteMaxRuches: '',
  mielleesPrincipales: [] as string[],
  proprietaireTerrain: '',
  proprietaireTelephone: '',
  accordSigne: false,
  loyerAnnuelEuros: '',
  accesDifficulte: '' as '' | 'facile' | 'moyen' | 'difficile',
  notes: '',
  estActif: true,
});

const saving = ref(false);

function openCreate() {
  editTarget.value = null;
  Object.assign(form, {
    nom: '',
    latitude: '',
    longitude: '',
    commune: '',
    codePostal: '',
    capaciteMaxRuches: '',
    mielleesPrincipales: [],
    proprietaireTerrain: '',
    proprietaireTelephone: '',
    accordSigne: false,
    loyerAnnuelEuros: '',
    accesDifficulte: '',
    notes: '',
    estActif: true,
  });
  showModal.value = true;
}

function openEdit(emp: Record<string, unknown>) {
  editTarget.value = emp;
  Object.assign(form, {
    nom: emp.nom,
    latitude: emp.latitude,
    longitude: emp.longitude,
    commune: (emp.commune as string) || '',
    codePostal: (emp.codePostal as string) || '',
    capaciteMaxRuches: emp.capaciteMaxRuches || '',
    mielleesPrincipales: (emp.mielleesPrincipales as string[]) || [],
    proprietaireTerrain: (emp.proprietaireTerrain as string) || '',
    proprietaireTelephone: (emp.proprietaireTelephone as string) || '',
    accordSigne: emp.accordSigne,
    loyerAnnuelEuros: emp.loyerAnnuelEuros || '',
    accesDifficulte: (emp.accesDifficulte as string) || '',
    notes: (emp.notes as string) || '',
    estActif: emp.estActif,
  });
  showModal.value = true;
}

async function saveEmplacement() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      capaciteMaxRuches: form.capaciteMaxRuches ? Number(form.capaciteMaxRuches) : undefined,
      loyerAnnuelEuros: form.loyerAnnuelEuros ? Number(form.loyerAnnuelEuros) : undefined,
      accesDifficulte: form.accesDifficulte || undefined,
    };
    if (editTarget.value) {
      await $fetch(`/api/transhumance/emplacements/${editTarget.value.id as string}`, {
        method: 'PUT',
        body: payload,
      });
      toast.add({ title: 'Emplacement modifié', color: 'success' });
      emit('emplacement:updated', { id: editTarget.value.id as string });
    } else {
      await $fetch('/api/transhumance/emplacements', { method: 'POST', body: payload });
      toast.add({ title: 'Emplacement créé', color: 'success' });
      emit('emplacement:created');
    }
    showModal.value = false;
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function deleteEmplacement() {
  if (!deleteTarget.value) return;
  try {
    await $fetch(`/api/transhumance/emplacements/${deleteTarget.value.id as string}`, {
      method: 'DELETE',
    });
    toast.add({ title: 'Emplacement supprimé', color: 'success' });
    emit('emplacement:deleted', { id: deleteTarget.value.id as string });
    showDeleteModal.value = false;
    deleteTarget.value = null;
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur suppression'), color: 'error' });
  }
}

const accesOptions = [
  { label: 'Facile', value: 'facile' },
  { label: 'Moyen', value: 'moyen' },
  { label: 'Difficile', value: 'difficile' },
];
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          Emplacements
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Gérez vos emplacements de transhumance
        </p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openCreate">
        Nouvel emplacement
      </UButton>
    </div>

    <!-- Pill nav -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <NuxtLink
        to="/transhumance"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Plans
      </NuxtLink>
      <span
        class="rounded-[8px] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm"
      >
        Emplacements
      </span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="h-40 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data?.data?.length"
      class="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white py-20 text-center"
    >
      <UIcon name="i-lucide-map-pin-plus" class="h-12 w-12 text-[var(--text-tertiary)]" />
      <p class="font-medium text-[var(--text-primary)]">Repérez vos futurs spots 📍</p>
      <p class="text-sm text-[var(--text-secondary)]">
        Ajoutez vos emplacements de miellée — colza, lavande, châtaignier — pour préparer
        sereinement vos transhumances.
      </p>
      <UButton color="primary" variant="soft" @click="openCreate">Créer un emplacement</UButton>
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="emp in data.data"
        :key="emp.id"
        class="bg-white border border-[var(--border-default)] rounded-[14px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-[var(--text-primary)] truncate">{{ emp.nom }}</h3>
            <p v-if="emp.commune" class="text-sm text-[var(--text-secondary)]">
              {{ emp.commune }}<span v-if="emp.codePostal"> · {{ emp.codePostal }}</span>
            </p>
          </div>
          <span
            class="ml-2 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            :class="
              emp.estActif
                ? 'bg-[var(--sage-soft)] text-[var(--sage-deep)]'
                : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
            "
          >
            {{ emp.estActif ? 'Actif' : 'Inactif' }}
          </span>
        </div>

        <ul class="space-y-1.5 mb-4">
          <li
            v-if="emp.capaciteMaxRuches"
            class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-hexagon" class="h-3.5 w-3.5 text-[var(--honey)]" />
            {{ emp.capaciteMaxRuches }} ruches max
          </li>
          <li
            v-if="emp.accordSigne"
            class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-check-circle" class="h-3.5 w-3.5 text-[var(--sage)]" />
            Accord signé
          </li>
          <li
            v-if="emp.accesDifficulte"
            class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-route" class="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Accès {{ emp.accesDifficulte }}
          </li>
          <li
            v-if="emp.mielleesPrincipales?.length"
            class="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
          >
            <UIcon
              name="i-lucide-flower-2"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--honey)]"
            />
            <span>{{ emp.mielleesPrincipales.join(', ') }}</span>
          </li>
        </ul>

        <div class="flex items-center justify-between border-t border-[var(--border-faint)] pt-3">
          <div class="flex items-center gap-3">
            <NuxtLink
              :to="`/transhumance/plans/nouveau?emplacementId=${emp.id}`"
              class="text-xs font-medium text-[var(--honey-deep)] hover:underline"
            >
              Planifier →
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-medium text-[var(--sage-deep)] hover:underline"
              title="Analyser le potentiel mellifère (parcelles agricoles RPG)"
              @click="openAnalyse(emp)"
            >
              <UIcon name="i-lucide-flower-2" class="h-3.5 w-3.5" />
              Mellifère
            </button>
          </div>
          <div class="flex gap-1">
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              title="Modifier"
              @click="openEdit(emp)"
            >
              <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-500"
              title="Supprimer"
              @click="
                () => {
                  deleteTarget = emp;
                  showDeleteModal = true;
                }
              "
            >
              <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Analyse mellifère (RPG) -->
    <TranshumanceAnalyseMellifere v-model="showAnalyse" :emplacement="analyseTarget" />

    <!-- Create/Edit Modal -->
    <UModal
      v-model:open="showModal"
      :title="editTarget ? 'Modifier l\'emplacement' : 'Nouvel emplacement'"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nom *">
            <UInput v-model="form.nom" placeholder="Ex: Acacias de la forêt de Brocéliande" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Latitude *">
              <UInput
                v-model="form.latitude"
                type="number"
                step="0.0000001"
                placeholder="48.8566"
              />
            </UFormField>
            <UFormField label="Longitude *">
              <UInput
                v-model="form.longitude"
                type="number"
                step="0.0000001"
                placeholder="2.3522"
              />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Commune">
              <UInput v-model="form.commune" placeholder="Nom de la commune" />
            </UFormField>
            <UFormField label="Code postal">
              <UInput v-model="form.codePostal" placeholder="35000" />
            </UFormField>
          </div>
          <UFormField label="Capacité max (ruches)">
            <UInput v-model="form.capaciteMaxRuches" type="number" min="1" placeholder="20" />
          </UFormField>
          <UFormField label="Propriétaire terrain">
            <UInput v-model="form.proprietaireTerrain" placeholder="Nom du propriétaire" />
          </UFormField>
          <UFormField label="Téléphone propriétaire">
            <UInput v-model="form.proprietaireTelephone" placeholder="06 12 34 56 78" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Loyer annuel (€)">
              <UInput v-model="form.loyerAnnuelEuros" type="number" min="0" placeholder="0" />
            </UFormField>
            <UFormField label="Accès">
              <USelect
                v-model="form.accesDifficulte"
                :items="accesOptions"
                value-key="value"
                label-key="label"
                placeholder="Sélectionner"
              />
            </UFormField>
          </div>
          <UFormField label="Notes">
            <UTextarea
              v-model="form.notes"
              placeholder="Informations complémentaires..."
              :rows="3"
            />
          </UFormField>
          <div class="flex items-center gap-3">
            <USwitch v-model="form.accordSigne" />
            <span class="text-sm text-stone-700">Accord du propriétaire signé</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showModal = false">Annuler</UButton>
          <UButton color="primary" :loading="saving" @click="saveEmplacement">
            {{ editTarget ? 'Enregistrer' : 'Créer' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal" title="Supprimer l'emplacement">
      <template #body>
        <p class="text-stone-600">
          Supprimer <strong>{{ deleteTarget?.nom }}</strong> ? Cette action est irréversible.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false"
            >Annuler</UButton
          >
          <UButton color="error" @click="deleteEmplacement">Supprimer</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
