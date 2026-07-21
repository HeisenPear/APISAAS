<script setup lang="ts">
definePageMeta({ layout: 'default' });

const toast = useToast();
const { emit, on } = useDataBus();
const route = useRoute();
const router = useRouter();
const showModal = ref(false);
const editTarget = ref<Record<string, unknown> | null>(null);

// Filtre par lignée (arrivée depuis /elevage/lignees, clic sur une lignée)
const filtreLigneeId = ref((route.query.ligneeId as string) || undefined);

const { data, pending, refresh } = useFetch('/api/elevage/reines', {
  key: 'elevage-reines',
  query: computed(() => ({ limit: 50, page: 1, ligneeId: filtreLigneeId.value })),
  lazy: true,
});

function retirerFiltreLignee() {
  filtreLigneeId.value = undefined;
  router.replace({ query: {} });
}
on(['reine:created', 'reine:updated', 'reine:deleted'], () => refresh());
onMounted(() => refresh());

const { data: lignees } = useFetch('/api/elevage/lignees', {
  key: 'elevage-lignees-options',
  query: { limit: 100, page: 1 },
  lazy: true,
});

// Liste large pour le sélecteur "reine mère" (indépendante du filtre/pagination affichés)
const { data: toutesLesReines } = useFetch('/api/elevage/reines', {
  key: 'elevage-reines-options',
  query: { limit: 200, page: 1 },
  lazy: true,
});
on(['reine:created', 'reine:updated', 'reine:deleted'], () =>
  refreshNuxtData('elevage-reines-options'),
);

const reineMereOptions = computed(() =>
  (toutesLesReines.value?.data ?? [])
    .filter((r) => r.reine.id !== editTarget.value?.id)
    .map((r) => ({
      label: r.reine.identifiant || `Reine ${r.reine.id.slice(-4)}`,
      value: r.reine.id,
    })),
);

// Classement par index de sélection (recalculé serveur depuis les traits bruts)
const { data: classement, refresh: refreshClassement } = useFetch('/api/elevage/classement', {
  key: 'elevage-classement',
  lazy: true,
});
on(['reine:tested', 'reine:deleted'], () => refreshClassement());
onMounted(() => refreshClassement());

const indexByReine = computed(() => {
  const m = new Map<string, { index: number; completeness: number; rang: number }>();
  for (const r of classement.value?.data ?? [])
    m.set(r.reineId, { index: r.index, completeness: r.completeness, rang: r.rang });
  return m;
});
function idx(id: string) {
  return indexByReine.value.get(id) ?? null;
}

// Modale de test de performance
const testModalOpen = ref(false);
const testReine = ref<{ id: string; identifiant?: string | null } | null>(null);
function openTest(reine: Record<string, unknown>) {
  testReine.value = {
    id: reine.id as string,
    identifiant: reine.identifiant as string | null,
  };
  testModalOpen.value = true;
}
function onTestSaved() {
  emit('reine:tested');
  refreshClassement();
}

const form = reactive({
  rucheId: undefined as string | undefined,
  ligneeId: undefined as string | undefined,
  reineMereId: undefined as string | undefined,
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

// Création rapide d'une lignée sans quitter le formulaire de reine
const showQuickLignee = ref(false);
const quickLigneeNom = ref('');
const savingQuickLignee = ref(false);

async function createQuickLignee() {
  if (!quickLigneeNom.value.trim()) return;
  savingQuickLignee.value = true;
  try {
    const res = await $fetch<{ data: { id: string } }>('/api/elevage/lignees', {
      method: 'POST',
      body: {
        nom: quickLigneeNom.value.trim(),
        race: 'buckfast',
        dateCreation: new Date().toISOString(),
        estActive: true,
      },
    });
    emit('lignee:created');
    await refreshNuxtData('elevage-lignees-options');
    form.ligneeId = res.data.id;
    quickLigneeNom.value = '';
    showQuickLignee.value = false;
    toast.add({ title: 'Lignée créée', color: 'success' });
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la création'), color: 'error' });
  } finally {
    savingQuickLignee.value = false;
  }
}

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
  showQuickLignee.value = false;
  quickLigneeNom.value = '';
  Object.assign(form, {
    rucheId: undefined,
    ligneeId: undefined,
    reineMereId: undefined,
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
  showQuickLignee.value = false;
  quickLigneeNom.value = '';
  Object.assign(form, {
    rucheId: (reine.rucheId as string) || undefined,
    ligneeId: (reine.ligneeId as string) || undefined,
    reineMereId: (reine.reineMereId as string) || undefined,
    identifiant: reine.identifiant || '',
    couleurMarquage: reine.couleurMarquage || 'blanc',
    anneeNaissance: reine.anneeNaissance || new Date().getFullYear(),
    dateIntroduction: reine.dateIntroduction
      ? new Date(reine.dateIntroduction as string).toISOString().slice(0, 10)
      : '',
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
      dateIntroduction: form.dateIntroduction
        ? new Date(form.dateIntroduction).toISOString()
        : null,
    };

    if (editTarget.value) {
      await $fetch(`/api/elevage/reines/${editTarget.value.id}`, {
        method: 'PUT',
        body: payload,
      });
      toast.add({ title: 'Reine mise à jour', color: 'primary' });
      emit('reine:updated', { id: editTarget.value.id as string });
    } else {
      await $fetch('/api/elevage/reines', {
        method: 'POST',
        body: payload,
      });
      toast.add({ title: 'Reine créée', color: 'primary' });
      emit('reine:created');
    }

    showModal.value = false;
    refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la sauvegarde'), color: 'error' });
  } finally {
    saving.value = false;
  }
}

async function deleteReine(reine: Record<string, unknown>) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette reine ?')) return;

  try {
    await $fetch(`/api/elevage/reines/${reine.id}`, { method: 'DELETE' });
    toast.add({ title: 'Reine supprimée', color: 'primary' });
    emit('reine:deleted', { id: reine.id as string });
    refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la suppression'), color: 'error' });
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
          Reines
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">Gestion de vos reines d'élevage</p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate"> Nouvelle reine </UButton>
    </div>

    <!-- Filtre lignée actif -->
    <div
      v-if="filtreLigneeId"
      class="flex items-center gap-2 rounded-[10px] bg-[var(--honey-soft)] px-3 py-2 text-[12.5px]"
      style="color: var(--honey-deep)"
    >
      <UIcon name="i-lucide-filter" class="h-3.5 w-3.5" />
      Filtré sur une lignée
      <button type="button" class="ml-1 underline" @click="retirerFiltreLignee">Retirer</button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div
        v-for="i in 5"
        :key="i"
        class="h-16 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data?.data?.length"
      class="flex flex-col items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white py-16 text-center"
    >
      <UIcon name="i-lucide-crown" class="h-12 w-12 text-[var(--text-tertiary)]" />
      <div>
        <p class="text-lg font-medium text-[var(--text-primary)]">Aucune reine enregistrée</p>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Commencez par créer votre première reine
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate"> Créer une reine </UButton>
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
                <NuxtLink
                  :to="`/elevage/reines/${item.reine.id}`"
                  class="font-medium text-[var(--text-primary)] hover:underline"
                >
                  {{ item.reine.identifiant || `Reine ${item.reine.id.slice(-4)}` }}
                </NuxtLink>
                <span
                  v-if="item.ligneeNom"
                  :class="`bg-amber-100 text-amber-700`"
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                >
                  {{ item.ligneeNom }}
                </span>
              </div>

              <div
                class="mt-1 flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]"
              >
                <span v-if="item.reine.anneeNaissance">Année {{ item.reine.anneeNaissance }}</span>
                <span v-if="item.reine.dateIntroduction"
                  >Intro {{ formatDate(item.reine.dateIntroduction) }}</span
                >
                <span v-if="item.reine.origine" class="capitalize">{{
                  item.reine.origine.replace('_', ' ')
                }}</span>
              </div>

              <div class="mt-1.5 flex items-center gap-2 text-sm">
                <span class="text-[var(--text-tertiary)]">Index sélection</span>
                <ElevageIndexBadge
                  :index="idx(item.reine.id)?.index ?? null"
                  :completeness="idx(item.reine.id)?.completeness"
                  size="sm"
                />
                <span
                  v-if="idx(item.reine.id)"
                  class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]"
                >
                  #{{ idx(item.reine.id)!.rang }}
                </span>
              </div>

              <p
                v-if="item.reine.notes"
                class="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2"
              >
                {{ item.reine.notes }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-git-branch"
              size="sm"
              variant="ghost"
              :to="`/elevage/reines/${item.reine.id}`"
            >
              Arbre
            </UButton>
            <UButton
              icon="i-lucide-flask-conical"
              size="sm"
              variant="soft"
              color="primary"
              @click="openTest(item.reine)"
            >
              Évaluer
            </UButton>
            <UButton icon="i-lucide-edit" size="sm" variant="ghost" @click="openEdit(item.reine)" />
            <UButton
              icon="i-lucide-trash"
              size="sm"
              variant="ghost"
              color="error"
              @click="deleteReine(item.reine)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <UModal v-model:open="showModal" :title="editTarget ? 'Modifier la reine' : 'Nouvelle reine'">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Identifiant">
              <UInput v-model="form.identifiant" placeholder="Ex: Reine-001" />
            </UFormField>

            <UFormField>
              <template #label>
                <div class="flex items-center gap-1">
                  Couleur marquage
                  <UTooltip
                    text="Convention internationale : Blanc 2021/2026 · Jaune 2022/2027 · Rouge 2023/2028 · Vert 2024/2029 · Bleu 2025/2030"
                  >
                    <UIcon
                      name="i-lucide-help-circle"
                      class="h-3.5 w-3.5 cursor-help"
                      style="color: var(--text-tertiary)"
                    />
                  </UTooltip>
                </div>
              </template>
              <USelect
                v-model="form.couleurMarquage"
                :items="couleurOptions"
                value-key="value"
                label-key="label"
              />
            </UFormField>

            <UFormField label="Année naissance">
              <UInput
                v-model.number="form.anneeNaissance"
                type="number"
                :min="1990"
                :max="new Date().getFullYear() + 1"
              />
            </UFormField>

            <UFormField label="Date introduction">
              <UiMobileDatePicker v-model="form.dateIntroduction" mode="date" />
            </UFormField>

            <UFormField label="Origine">
              <USelect
                v-model="form.origine"
                :items="origineOptions"
                value-key="value"
                label-key="label"
              />
            </UFormField>

            <UFormField>
              <template #label>
                <div class="flex items-center justify-between">
                  <span>Lignée</span>
                  <button
                    type="button"
                    class="text-[11px] font-medium text-[var(--honey-deep)] hover:underline"
                    @click="showQuickLignee = !showQuickLignee"
                  >
                    {{ showQuickLignee ? 'Annuler' : '+ Nouvelle lignée' }}
                  </button>
                </div>
              </template>
              <div v-if="showQuickLignee" class="flex gap-2">
                <UInput
                  v-model="quickLigneeNom"
                  placeholder="Nom de la lignée (ex: Buckfast Frères Denis)"
                  class="flex-1"
                  @keyup.enter="createQuickLignee"
                />
                <UButton
                  size="sm"
                  color="primary"
                  :loading="savingQuickLignee"
                  :disabled="!quickLigneeNom.trim()"
                  @click="createQuickLignee"
                >
                  Créer
                </UButton>
              </div>
              <template v-else>
                <USelect
                  v-model="form.ligneeId"
                  :items="lignees?.data?.map((l) => ({ label: l.nom, value: l.id })) || []"
                  value-key="value"
                  label-key="label"
                  placeholder="Sélectionner une lignée"
                />
                <p
                  v-if="!lignees?.data?.length"
                  class="mt-1 text-[11.5px] text-[var(--text-tertiary)]"
                >
                  Aucune lignée pour l'instant — optionnel, ou créez-en une avec « + Nouvelle lignée
                  » ci-dessus.
                </p>
              </template>
            </UFormField>

            <UFormField label="Reine mère">
              <USelect
                v-model="form.reineMereId"
                :items="reineMereOptions"
                value-key="value"
                label-key="label"
                placeholder="Aucune (reine fondatrice ou achetée)"
              />
              <p
                v-if="!reineMereOptions.length"
                class="mt-1 text-[11.5px] text-[var(--text-tertiary)]"
              >
                Aucune autre reine enregistrée — choisissez « Aucune » pour une reine fondatrice.
                Ses futures filles pourront la référencer ici une fois créée.
              </p>
            </UFormField>

            <UFormField v-if="form.origine === 'achat'" label="Fournisseur">
              <UInput v-model="form.fournisseur" placeholder="Nom du fournisseur" />
            </UFormField>

            <UFormField v-if="form.estInsemine" label="Station fécondation">
              <UInput v-model="form.stationFecondation" placeholder="Nom de la station" />
            </UFormField>
          </div>

          <div class="flex items-center gap-3">
            <USwitch v-model="form.estInsemine" />
            <span class="text-sm text-[var(--text-secondary)]">Inséminée artificiellement</span>
          </div>

          <UFormField label="Notes">
            <UTextarea v-model="form.notes" :rows="3" placeholder="Notes sur la reine..." />
          </UFormField>
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

    <!-- Test de performance + index de sélection -->
    <ElevageTestModal v-model:open="testModalOpen" :reine="testReine" @saved="onTestSaved" />
  </div>
</template>
