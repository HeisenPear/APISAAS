<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const { emit, on } = useDataBus();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);

const { data, pending, error, refresh } = useFetch('/api/elevage/lignees', {
  key: 'elevage-lignees',
  query: { limit: 50, page: 1 },
  lazy: true,
});
on(['lignee:created', 'lignee:updated', 'lignee:deleted'], () => refresh());
onMounted(() => refresh());

const form = reactive({
  nom: '',
  race: 'buckfast' as string,
  origine: '',
  dateCreation: dateDuJour(),
  notes: '',
  estActive: true,
});

const saving = ref(false);

const raceOptions = [
  { label: 'Buckfast', value: 'buckfast' },
  { label: 'Carnica', value: 'carnica' },
  { label: 'Abeille noire', value: 'noire' },
  { label: 'Italienne', value: 'italienne' },
  { label: 'Caucasienne', value: 'caucasienne' },
  { label: 'Hybride', value: 'hybride' },
];

const raceColors: Record<string, string> = {
  buckfast: 'bg-amber-100 text-amber-700',
  carnica: 'bg-blue-100 text-blue-700',
  noire: 'bg-stone-200 text-stone-700',
  italienne: 'bg-yellow-100 text-yellow-700',
  caucasienne: 'bg-purple-100 text-purple-700',
  hybride: 'bg-amber-100 text-amber-700',
};

function openCreate() {
  editTarget.value = null;
  Object.assign(form, {
    nom: '',
    race: 'buckfast',
    origine: '',
    dateCreation: dateDuJour(),
    notes: '',
    estActive: true,
  });
  showModal.value = true;
}

function openEdit(l: Record<string, unknown>) {
  editTarget.value = l;
  Object.assign(form, {
    nom: l.nom,
    race: l.race,
    origine: (l.origine as string) || '',
    dateCreation: (l.dateCreation as string)?.slice(0, 10) || '',
    notes: (l.notes as string) || '',
    estActive: l.estActive,
  });
  showModal.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload = { ...form, dateCreation: new Date(form.dateCreation).toISOString() };
    if (editTarget.value) {
      await $fetch(`/api/elevage/lignees/${editTarget.value.id as string}`, {
        method: 'PUT',
        body: payload,
      });
      toast.add({ title: 'Lignée modifiée', color: 'success' });
      emit('lignee:updated', { id: editTarget.value.id as string });
    } else {
      await $fetch('/api/elevage/lignees', { method: 'POST', body: payload });
      toast.add({ title: 'Lignée créée', color: 'success' });
      emit('lignee:created');
    }
    showModal.value = false;
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function deleteLignee(l: Record<string, unknown>) {
  try {
    await $fetch(`/api/elevage/lignees/${l.id as string}`, { method: 'DELETE' });
    toast.add({ title: 'Lignée supprimée', color: 'success' });
    emit('lignee:deleted', { id: l.id as string });
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur suppression'), color: 'error' });
  }
}
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
          Lignées
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Gérez vos lignées de reines sélectionnées
        </p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openCreate">Nouvelle lignée</UButton>
    </div>

    <!-- Nav tabs -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <NuxtLink
        to="/elevage"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Reines
      </NuxtLink>
      <span
        class="rounded-[8px] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm"
      >
        Lignées
      </span>
      <NuxtLink
        to="/elevage/greffage"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Greffage
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="i in 6"
        :key="i"
        class="h-36 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Empty -->
    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <div
      v-else-if="!data?.data?.length"
      class="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white py-20 text-center"
    >
      <UIcon name="i-lucide-dna" class="h-12 w-12 text-[var(--text-tertiary)]" />
      <p class="font-medium text-[var(--text-primary)]">
        Construisez votre patrimoine génétique 🧬
      </p>
      <UButton color="primary" variant="soft" @click="openCreate">Créer une lignée</UButton>
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="l in data.data"
        :key="l.id"
        class="bg-white border border-[var(--border-default)] rounded-[14px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between mb-3">
          <h3
            class="font-semibold text-[var(--text-primary)]"
            style="
              font-family:
                'SF Pro Display',
                -apple-system,
                BlinkMacSystemFont,
                sans-serif;
            "
          >
            {{ l.nom }}
          </h3>
          <span
            class="ml-2 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            :class="raceColors[l.race] || 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'"
          >
            {{ raceOptions.find((r) => r.value === l.race)?.label || l.race }}
          </span>
        </div>

        <p v-if="l.origine" class="text-sm text-[var(--text-secondary)] mb-2">{{ l.origine }}</p>
        <p v-if="l.notes" class="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">
          {{ l.notes }}
        </p>

        <div class="text-[11px] text-[var(--text-tertiary)] mb-4">
          Créée le {{ new Date(l.dateCreation).toLocaleDateString('fr-FR') }}
        </div>

        <div class="flex items-center justify-between border-t border-[var(--border-faint)] pt-3">
          <NuxtLink
            :to="`/elevage/reines?ligneeId=${l.id}`"
            class="text-xs font-medium text-[var(--honey-deep)] hover:underline"
          >
            Voir les reines →
          </NuxtLink>
          <div class="flex gap-1">
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              title="Modifier"
              @click="openEdit(l)"
            >
              <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-500"
              title="Supprimer"
              @click="deleteLignee(l)"
            >
              <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editTarget ? 'Modifier la lignée' : 'Nouvelle lignée'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nom *">
            <UInput v-model="form.nom" placeholder="Ex: Buckfast Frères Denis" />
          </UFormField>
          <UFormField label="Race *">
            <USelect v-model="form.race" :items="raceOptions" value-key="value" label-key="label" />
          </UFormField>
          <UFormField label="Origine">
            <UInput v-model="form.origine" placeholder="Ex: Éleveur Dupont, Aveyron" />
          </UFormField>
          <UFormField label="Date de création *">
            <UiMobileDatePicker v-model="form.dateCreation" mode="date" />
          </UFormField>
          <UFormField label="Notes">
            <UTextarea
              v-model="form.notes"
              :rows="3"
              placeholder="Caractéristiques, observations..."
            />
          </UFormField>
          <div class="flex items-center gap-3">
            <USwitch v-model="form.estActive" />
            <span class="text-sm text-stone-700">Lignée active</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="showModal = false">Annuler</UButton>
          <UButton color="primary" :loading="saving" @click="save">
            {{ editTarget ? 'Enregistrer' : 'Créer' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
