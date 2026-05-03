<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);

const { data, pending, refresh } = await useFetch('/api/elevage/reines', {
  key: 'elevage-reines',
  query: { limit: 50, page: 1 },
});

const { data: lignees } = await useFetch('/api/elevage/lignees', {
  key: 'elevage-lignees-options',
  query: { limit: 100, page: 1 },
});

const form = reactive({
  rucheId: null as string | null,
  ligneeId: null as string | null,
  reineMereId: null as string | null,
  identifiant: '',
  couleurMarquage: 'blanc' as string,
  anneeNaissance: new Date().getFullYear(),
  dateIntroduction: new Date().toISOString().slice(0, 10),
  origine: 'elevage_propre' as string,
  fournisseur: '',
  estInsemine: false,
  stationFecondation: '',
  notes: '',
});

const saving = ref(false);

const couleurOptions = [
  { label: 'Blanc', value: 'blanc' },
  { label: 'Jaune', value: 'jaune' },
  { label: 'Rouge', value: 'rouge' },
  { label: 'Vert', value: 'vert' },
  { label: 'Bleu', value: 'bleu' },
];

const origineOptions = [
  { label: 'Élevage propre', value: 'elevage_propre' },
  { label: 'Achat', value: 'achat' },
  { label: 'Capture essaim', value: 'capture_essaim' },
];

const marquageColors: Record<string, string> = {
  blanc: 'bg-white border-2 border-stone-200',
  jaune: 'bg-yellow-400',
  rouge: 'bg-red-500',
  vert: 'bg-green-500',
  bleu: 'bg-blue-500',
};

function openCreate() {
  editTarget.value = null;
  Object.assign(form, {
    rucheId: null,
    ligneeId: null,
    reineMereId: null,
    identifiant: '',
    couleurMarquage: 'blanc',
    anneeNaissance: new Date().getFullYear(),
    dateIntroduction: new Date().toISOString().slice(0, 10),
    origine: 'elevage_propre',
    fournisseur: '',
    estInsemine: false,
    stationFecondation: '',
    notes: '',
  });
  showModal.value = true;
}

function openEdit(reine: Record<string, unknown>) {
  editTarget.value = reine;
  Object.assign(form, {
    rucheId: reine.rucheId || null,
    ligneeId: reine.ligneeId || null,
    reineMereId: reine.reineMereId || null,
    identifiant: reine.identifiant || '',
    couleurMarquage: reine.couleurMarquage || 'blanc',
    anneeNaissance: reine.anneeNaissance || new Date().getFullYear(),
    dateIntroduction: reine.dateIntroduction ? new Date(reine.dateIntroduction as string).toISOString().slice(0, 10) : '',
    origine: reine.origine || 'elevage_propre',
    fournisseur: reine.fournisseur || '',
    estInsemine: reine.estInsemine || false,
    stationFecondation: reine.stationFecondation || '',
    notes: reine.notes || '',
  });
  showModal.value = true;
}

async function save() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      dateIntroduction: form.dateIntroduction ? new Date(form.dateIntroduction).toISOString() : null,
    };

    if (editTarget.value) {
      await $fetch(`/api/elevage/reines/${editTarget.value.id}`, {
        method: 'PUT',
        body: payload,
      });
      toast.add({ title: 'Reine mise à jour', color: 'primary' });
    } else {
      await $fetch('/api/elevage/reines', {
        method: 'POST',
        body: payload,
      });
      toast.add({ title: 'Reine créée', color: 'primary' });
    }

    showModal.value = false;
    refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la sauvegarde'), color: 'red' });
  } finally {
    saving.value = false;
  }
}

async function deleteReine(reine: Record<string, unknown>) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette reine ?')) return;

  try {
    await $fetch(`/api/elevage/reines/${reine.id}`, { method: 'DELETE' });
    toast.add({ title: 'Reine supprimée', color: 'primary' });
    refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la suppression'), color: 'red' });
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]" style="font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif">
          Reines
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Gestion de vos reines d'élevage
        </p>
      </div>
      <UButton @click="openCreate" icon="i-lucide-plus" color="primary">
        Nouvelle reine
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data?.data?.length"
      class="flex flex-col items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white py-16 text-center"
    >
      <UIcon name="i-lucide-crown" class="h-12 w-12 text-[var(--text-tertiary)]" />
      <div>
        <p class="text-lg font-medium text-[var(--text-primary)]">Aucune reine enregistrée</p>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">Commencez par créer votre première reine</p>
      </div>
      <UButton @click="openCreate" icon="i-lucide-plus" color="primary">
        Créer une reine
      </UButton>
    </div>

    <!-- Table -->
    <div v-else class="space-y-4">
      <div
        v-for="item in data.data"
        :key="item.reine.id"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <!-- Marquage color -->
            <div class="mt-1">
              <div
                :class="marquageColors[item.reine.couleurMarquage || 'blanc']"
                class="h-4 w-4 rounded-full border border-stone-300"
              />
            </div>

            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-[var(--text-primary)]">
                  {{ item.reine.identifiant || `Reine ${item.reine.id.slice(-4)}` }}
                </h3>
                <span
                  v-if="item.ligneeNom"
                  :class="`bg-amber-100 text-amber-700`"
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                >
                  {{ item.ligneeNom }}
                </span>
              </div>

              <div class="mt-1 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                <span v-if="item.reine.anneeNaissance">Année {{ item.reine.anneeNaissance }}</span>
                <span v-if="item.reine.dateIntroduction">Intro {{ formatDate(item.reine.dateIntroduction) }}</span>
                <span v-if="item.reine.origine" class="capitalize">{{ item.reine.origine.replace('_', ' ') }}</span>
              </div>

              <p v-if="item.reine.notes" class="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                {{ item.reine.notes }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton @click="openEdit(item.reine)" icon="i-lucide-edit" size="sm" variant="ghost" />
            <UButton @click="deleteReine(item.reine)" icon="i-lucide-trash" size="sm" variant="ghost" color="red" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <UModal v-model="showModal">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ editTarget ? 'Modifier la reine' : 'Nouvelle reine' }}
        </h2>

        <form @submit.prevent="save" class="mt-6 space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormGroup label="Identifiant">
              <UInput v-model="form.identifiant" placeholder="Ex: Reine-001" />
            </UFormGroup>

            <UFormGroup label="Couleur marquage">
              <USelect v-model="form.couleurMarquage" :options="couleurOptions" />
            </UFormGroup>

            <UFormGroup label="Année naissance">
              <UInput v-model.number="form.anneeNaissance" type="number" :min="1990" :max="new Date().getFullYear() + 1" />
            </UFormGroup>

            <UFormGroup label="Date introduction">
              <UInput v-model="form.dateIntroduction" type="date" />
            </UFormGroup>

            <UFormGroup label="Origine">
              <USelect v-model="form.origine" :options="origineOptions" />
            </UFormGroup>

            <UFormGroup label="Lignée">
              <USelect
                v-model="form.ligneeId"
                :options="lignees?.data?.map(l => ({ label: l.nom, value: l.id })) || []"
                placeholder="Sélectionner une lignée"
                clear-search-on-close
              />
            </UFormGroup>

            <UFormGroup v-if="form.origine === 'achat'" label="Fournisseur">
              <UInput v-model="form.fournisseur" placeholder="Nom du fournisseur" />
            </UFormGroup>

            <UFormGroup label="Inséminée">
              <UCheckbox v-model="form.estInsemine" />
            </UFormGroup>

            <UFormGroup v-if="form.estInsemine" label="Station fécondation">
              <UInput v-model="form.stationFecondation" placeholder="Nom de la station" />
            </UFormGroup>
          </div>

          <UFormGroup label="Notes">
            <UTextarea v-model="form.notes" :rows="3" placeholder="Notes sur la reine..." />
          </UFormGroup>

          <div class="flex justify-end gap-3 pt-4">
            <UButton @click="showModal = false" variant="ghost">
              Annuler
            </UButton>
            <UButton type="submit" :loading="saving" color="primary">
              {{ editTarget ? 'Enregistrer' : 'Créer' }}
            </UButton>
          </div>
        </form>
      </div>
    </UModal>
  </div>
</template>