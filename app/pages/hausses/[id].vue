<script setup lang="ts">
import type { Hausse } from '~/composables/useHausses';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = route.params.id as string;
const toast = useToast();
const { emit } = useDataBus();

interface HausseDetail extends Hausse {
  rucheNumero: string | null;
}

const { data, pending, refresh } = useFetch<{ data: HausseDetail }>(`/api/hausses/${id}`, {
  key: `hausse-${id}`,
});
const hausse = computed(() => data.value?.data);

const { ruches: toutesLesRuches } = useRuches();

// QR — même approche client-side que la fiche ruche (pas de round-trip serveur).
const hausseUrl = computed(() => {
  if (import.meta.server || !hausse.value) return '';
  return `${window.location.origin}/hausses/${id}?scan=1`;
});
const { qrDataUrl, generating: qrGenerating } = useQrCode(hausseUrl);

function printLabel() {
  window.print();
}

// Atterrissage post-scan : mise en avant du bloc statut
const statutRef = ref<HTMLElement | null>(null);
const scanHighlight = ref(false);

function highlightStatutFromScan() {
  if (route.query.scan !== '1') return;
  scanHighlight.value = true;
  nextTick(() => {
    statutRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  setTimeout(() => {
    scanHighlight.value = false;
  }, 4000);
}

function tryHighlightFromScan() {
  if (!hausse.value) return false;
  highlightStatutFromScan();
  return true;
}

onMounted(() => {
  if (!tryHighlightFromScan()) {
    const stop = watch(hausse, () => {
      if (tryHighlightFromScan()) stop();
    });
  }
});

const STATUTS = [
  {
    value: 'disponible',
    label: 'Disponible',
    icon: 'i-lucide-package',
    color: 'bg-[var(--sage-soft)] text-[var(--sage-deep)]',
  },
  {
    value: 'en_service',
    label: 'En service',
    icon: 'i-lucide-check-circle',
    color: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]',
  },
  {
    value: 'en_stock',
    label: 'En stock',
    icon: 'i-lucide-warehouse',
    color: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
  },
  {
    value: 'hors_service',
    label: 'Hors service',
    icon: 'i-lucide-ban',
    color: 'bg-red-50 text-red-600',
  },
];

const updating = ref(false);
async function changerStatut(statut: string) {
  if (!hausse.value) return;
  updating.value = true;
  try {
    await $fetch(`/api/hausses/${id}`, { method: 'PUT', body: { statut } });
    emit('hausse:updated', { id });
    await refresh();
    toast.add({ title: 'Statut mis à jour', color: 'success' });
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    updating.value = false;
  }
}

const showRucheModal = ref(false);
const rucheChoisie = ref<string | undefined>(undefined);
function openRucheModal() {
  rucheChoisie.value = hausse.value?.rucheId ?? undefined;
  showRucheModal.value = true;
}
async function lierRuche() {
  updating.value = true;
  try {
    await $fetch(`/api/hausses/${id}`, {
      method: 'PUT',
      body: { rucheId: rucheChoisie.value ?? null },
    });
    emit('hausse:updated', { id });
    await refresh();
    showRucheModal.value = false;
    toast.add({ title: 'Hausse mise à jour', color: 'success' });
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    updating.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Supprimer cette hausse ?')) return;
  try {
    await $fetch(`/api/hausses/${id}`, { method: 'DELETE' });
    emit('hausse:deleted', { id });
    toast.add({ title: 'Hausse supprimée', color: 'success' });
    navigateTo('/hausses');
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  }
}
</script>

<template>
  <div class="space-y-5">
    <NuxtLink
      to="/hausses"
      class="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] print:hidden"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Hausses
    </NuxtLink>

    <div v-if="pending" class="space-y-5 print:hidden">
      <div class="h-10 w-64 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />
      <div class="h-40 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <UiEmptyState
      v-else-if="!hausse"
      icon="i-lucide-box"
      title="Hausse introuvable"
      description="Cette hausse n'existe pas ou a été supprimée."
      action-label="Retour aux hausses"
      @action="navigateTo('/hausses')"
    />

    <template v-else>
      <div class="flex items-center justify-between print:hidden">
        <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {{ hausse.numero }}
        </h1>
        <UButton icon="i-lucide-trash-2" variant="ghost" color="error" @click="handleDelete">
          Supprimer
        </UButton>
      </div>

      <!-- Statut — actions rapides (c'est le cœur du scan : changer l'état en 1 tap) -->
      <div
        ref="statutRef"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 transition-shadow duration-300 print:hidden"
        :class="{ 'ring-2 ring-[var(--honey)] ring-offset-2': scanHighlight }"
      >
        <h2
          class="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
        >
          Statut
        </h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in STATUTS"
            :key="s.value"
            type="button"
            :disabled="updating"
            class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all"
            :class="
              hausse.statut === s.value
                ? s.color
                : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)] hover:bg-[var(--border-default)]'
            "
            @click="changerStatut(s.value)"
          >
            <UIcon :name="s.icon" class="h-3.5 w-3.5" />
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Ruche liée -->
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 print:hidden">
        <div class="flex items-center justify-between">
          <div>
            <h2
              class="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
            >
              Ruche liée
            </h2>
            <p class="mt-1 text-[14px] text-[var(--text-primary)]">
              {{ hausse.rucheNumero ?? 'Aucune — hausse en stock' }}
            </p>
          </div>
          <UButton variant="outline" color="neutral" size="sm" @click="openRucheModal">
            Modifier
          </UButton>
        </div>
      </div>

      <!-- Détails matériel -->
      <div class="grid grid-cols-2 gap-3 print:hidden sm:grid-cols-3">
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Type
          </p>
          <p class="text-[15px] font-semibold text-[var(--text-primary)]">{{ hausse.type }}</p>
        </div>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Cadres
          </p>
          <p class="text-[15px] font-semibold text-[var(--text-primary)]">
            {{ hausse.nombreCadres ?? '—' }}
          </p>
        </div>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Année
          </p>
          <p class="text-[15px] font-semibold text-[var(--text-primary)]">
            {{ hausse.anneeAcquisition ?? '—' }}
          </p>
        </div>
      </div>

      <!-- QR + impression -->
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5 print:hidden">
        <h2
          class="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
        >
          QR Code
        </h2>
        <div class="flex flex-col items-center gap-3">
          <div v-if="qrGenerating" class="flex h-[180px] w-[180px] items-center justify-center">
            <div
              class="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--honey)]"
            />
          </div>
          <img
            v-else-if="qrDataUrl"
            :src="qrDataUrl"
            :alt="`QR ${hausse.numero}`"
            class="h-[180px] w-[180px] rounded-[8px]"
          />
          <UButton
            icon="i-lucide-printer"
            variant="outline"
            color="neutral"
            size="sm"
            block
            @click="printLabel"
          >
            Imprimer l'étiquette
          </UButton>
        </div>
      </div>

      <!-- Étiquette imprimable -->
      <div
        v-if="qrDataUrl"
        class="hidden print:flex print:h-screen print:items-center print:justify-center"
      >
        <div class="flex flex-col items-center gap-4 p-8">
          <img :src="qrDataUrl" :alt="`QR ${hausse.numero}`" class="h-[250px] w-[250px]" />
          <p class="text-2xl font-bold">{{ hausse.numero }}</p>
        </div>
      </div>

      <UModal v-model:open="showRucheModal" title="Lier à une ruche">
        <template #body>
          <UFormField label="Ruche">
            <USelect
              v-model="rucheChoisie"
              :items="toutesLesRuches.map((r) => ({ label: r.numero, value: r.id }))"
              value-key="value"
              label-key="label"
              placeholder="Aucune (hausse en stock)"
            />
          </UFormField>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="showRucheModal = false"
              >Annuler</UButton
            >
            <UButton color="primary" :loading="updating" @click="lierRuche">Enregistrer</UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
