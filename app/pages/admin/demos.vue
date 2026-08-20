<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Démos
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Demandes de démonstration des prospects
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="pending"
        @click="refresh()"
      >
        Rafraîchir
      </UButton>
    </div>

    <AdminTabs />

    <!-- Stats cards -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-[14px] border bg-white p-4"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          {{ card.label }}
        </p>
        <p class="text-[22px] font-bold tracking-[-0.02em]" :style="`color:${card.color}`">
          {{ card.value }}
        </p>
      </div>
    </div>

    <!-- Search + filtre statut -->
    <div
      class="flex items-center gap-3 rounded-[12px] border px-4 py-3"
      style="border-color: var(--border-default); background: var(--surface-muted)"
    >
      <UIcon name="i-lucide-search" class="h-4 w-4 shrink-0" style="color: var(--text-tertiary)" />
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher par nom, email, besoin…"
        class="flex-1 bg-transparent text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--honey)]/40 focus-visible:rounded-[6px]"
        style="color: var(--text-primary)"
      />
      <select
        v-model="filterStatut"
        class="h-8 rounded-[8px] border bg-white px-2 text-xs"
        style="border-color: var(--border-default); color: var(--text-primary)"
      >
        <option value="">Tous les statuts</option>
        <option v-for="s in STATUTS" :key="s" :value="s">{{ statutLabel(s) }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="pending && demandes.length === 0" class="flex items-center justify-center py-16">
      <UIcon
        name="i-lucide-loader-2"
        class="h-6 w-6 animate-spin"
        style="color: var(--text-tertiary)"
      />
    </div>

    <!-- Liste -->
    <div v-else class="space-y-3">
      <div
        v-for="d in filtered"
        :key="d.id"
        class="rounded-[14px] border bg-white p-4 sm:p-5"
        style="border-color: var(--border-default)"
      >
        <!-- Ligne 1 : identité + statut + date -->
        <div class="flex flex-wrap items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
            style="background: var(--honey-soft); color: var(--honey-deep)"
          >
            {{ initiales(d) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold text-[15px]" style="color: var(--text-primary)">
                {{ d.prenom }} {{ d.nom }}
              </p>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                :class="statutBadgeClass(d.statut)"
              >
                {{ statutLabel(d.statut) }}
              </span>
              <span
                v-if="rdvLabel(d)"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background: var(--honey-soft); color: var(--honey-deep)"
              >
                <UIcon name="i-lucide-calendar-check" class="h-3 w-3" />{{ rdvLabel(d) }}
              </span>
            </div>
            <p
              class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]"
              style="color: var(--text-tertiary)"
            >
              <a :href="`mailto:${d.email}`" class="flex items-center gap-1 hover:underline">
                <UIcon name="i-lucide-mail" class="h-3.5 w-3.5" />{{ d.email }}
              </a>
              <a :href="`tel:${d.telephone}`" class="flex items-center gap-1 hover:underline">
                <UIcon name="i-lucide-phone" class="h-3.5 w-3.5" />{{ d.telephone }}
              </a>
            </p>
          </div>
          <span class="shrink-0 text-[12px]" style="color: var(--text-quaternary)">
            {{ formatDate(d.createdAt) }}
          </span>
        </div>

        <!-- Objectif & besoins -->
        <div
          class="mt-3 whitespace-pre-line rounded-[10px] px-3.5 py-3 text-[13.5px] leading-relaxed"
          style="background: var(--surface-muted); color: var(--text-secondary)"
        >
          {{ d.objectif }}
        </div>

        <!-- Notes internes -->
        <div class="mt-3">
          <label
            class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]"
            style="color: var(--text-tertiary)"
          >
            Notes internes
          </label>
          <textarea
            v-model="noteDrafts[d.id]"
            rows="2"
            placeholder="Compte-rendu d'appel, contexte, suite à donner…"
            class="w-full resize-y rounded-[10px] border bg-white px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--honey)]/40 focus-visible:rounded-[6px]"
            style="border-color: var(--border-default); color: var(--text-primary)"
            @focus="ensureDraft(d)"
          />
          <div v-if="(noteDrafts[d.id] ?? '') !== (d.notes ?? '')" class="mt-1.5 flex justify-end">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              :loading="savingId === d.id"
              @click="saveNotes(d)"
            >
              Enregistrer la note
            </UButton>
          </div>
        </div>

        <!-- Actions : statut + suppression -->
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"
          style="border-color: var(--border-default)"
        >
          <div class="flex items-center gap-2">
            <span class="text-[12px]" style="color: var(--text-tertiary)">Statut</span>
            <select
              :value="d.statut"
              class="h-8 rounded-[8px] border bg-white px-2 text-[12.5px]"
              style="border-color: var(--border-default); color: var(--text-primary)"
              :disabled="savingId === d.id"
              @change="setStatut(d, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="s in STATUTS" :key="s" :value="s">{{ statutLabel(s) }}</option>
            </select>
          </div>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-red-50"
            style="color: var(--status-bad)"
            :class="deletingId === d.id ? 'pointer-events-none opacity-50' : ''"
            @click="confirmDelete(d)"
          >
            <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <UiErrorState v-if="error" :error="error" :retry="refresh" />

      <div
        v-else-if="filtered.length === 0"
        class="rounded-[14px] border bg-white py-16 text-center"
        style="border-color: var(--border-default)"
      >
        <UIcon
          name="i-lucide-calendar-check"
          class="mx-auto h-10 w-10"
          style="color: var(--text-quaternary)"
        />
        <p class="mt-3 text-[15px] font-semibold" style="color: var(--text-primary)">
          {{
            search || filterStatut
              ? 'Aucune demande ne correspond'
              : 'Aucune demande de démo pour l’instant'
          }}
        </p>
        <p class="mt-1 text-[13px]" style="color: var(--text-tertiary)">
          Les demandes envoyées depuis
          <NuxtLink to="/demo" class="underline" style="color: var(--honey-deep)"
            >la page de réservation</NuxtLink
          >
          apparaîtront ici.
        </p>
      </div>
    </div>

    <!-- Modal suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]"
            style="background: rgba(181, 69, 69, 0.1)"
          >
            <UIcon name="i-lucide-trash-2" class="h-6 w-6" style="color: var(--status-bad)" />
          </div>
          <h3 class="mb-1 text-[17px] font-bold" style="color: var(--text-primary)">
            Supprimer cette demande ?
          </h3>
          <p class="mb-6 text-sm" style="color: var(--text-secondary)">
            <strong>{{ toDelete?.prenom }} {{ toDelete?.nom }}</strong> — {{ toDelete?.email }}.
            Cette action est irréversible.
          </p>
          <div class="flex gap-3">
            <UButton
              variant="outline"
              color="neutral"
              class="flex-1"
              @click="showDeleteModal = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              class="flex-1"
              :loading="deletingId !== null"
              @click="executeDelete"
            >
              Supprimer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'admin' });

type Statut = 'nouveau' | 'contacte' | 'planifie' | 'realise' | 'annule';

interface DemandeDemo {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  objectif: string;
  creneauPeriode: string | null;
  creneauJour: string | null;
  creneauMoment: string | null;
  statut: Statut;
  notes: string | null;
  rdvAt: string | null;
  source: string | null;
  createdAt: string;
}
interface DemoStats {
  total: number;
  nouveau: number;
  contacte: number;
  planifie: number;
  realise: number;
  annule: number;
}

const STATUTS: Statut[] = ['nouveau', 'contacte', 'planifie', 'realise', 'annule'];

const search = ref('');
const filterStatut = ref('');
const savingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const showDeleteModal = ref(false);
const toDelete = ref<DemandeDemo | null>(null);
const noteDrafts = reactive<Record<string, string>>({});
const toast = useToast();

const { data, pending, error, refresh } = useFetch<{ data: DemandeDemo[]; stats: DemoStats }>(
  '/api/admin/demos',
  { key: 'admin-demos', lazy: true },
);

const demandes = computed(() => data.value?.data ?? []);
const stats = computed(() => data.value?.stats ?? null);

const statCards = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: 'Total', value: s.total, color: 'var(--text-primary)' },
    { label: 'Nouveau', value: s.nouveau, color: 'var(--honey)' },
    { label: 'Contacté', value: s.contacte, color: '#2563eb' },
    { label: 'Planifié', value: s.planifie, color: '#7c3aed' },
    { label: 'Réalisé', value: s.realise, color: 'var(--sage-deep)' },
    { label: 'Annulé', value: s.annule, color: 'var(--text-tertiary)' },
  ];
});

const filtered = computed(() => {
  let list = demandes.value;
  if (filterStatut.value) list = list.filter((d) => d.statut === filterStatut.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (d) =>
        d.prenom.toLowerCase().includes(q) ||
        d.nom.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.objectif.toLowerCase().includes(q),
    );
  }
  return list;
});

function ensureDraft(d: DemandeDemo) {
  if (noteDrafts[d.id] === undefined) noteDrafts[d.id] = d.notes ?? '';
}
// Pré-remplit les brouillons de notes au chargement / rafraîchissement.
watch(
  demandes,
  (list) => {
    for (const d of list) if (noteDrafts[d.id] === undefined) noteDrafts[d.id] = d.notes ?? '';
  },
  { immediate: true },
);

const MOMENTS: Record<string, string> = { matin: 'Matin', apres_midi: 'Après-midi', soir: 'Soir' };
const PERIODES: Record<string, string> = {
  cette_semaine: 'cette semaine',
  semaine_prochaine: 'semaine prochaine',
  flexible: 'flexible',
};
/** Créneau réservé (rdvAt) en priorité ; sinon ancienne préférence (legacy). */
function rdvLabel(d: DemandeDemo): string | null {
  if (d.rdvAt) return formatSlotLong(d.rdvAt);
  const parts: string[] = [];
  if (d.creneauJour) parts.push(d.creneauJour.charAt(0).toUpperCase() + d.creneauJour.slice(1));
  if (d.creneauMoment) parts.push((MOMENTS[d.creneauMoment] ?? d.creneauMoment).toLowerCase());
  if (d.creneauPeriode) parts.push(`· ${PERIODES[d.creneauPeriode] ?? d.creneauPeriode}`);
  return parts.length ? parts.join(' ') : null;
}

const STATUT_LABELS: Record<Statut, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  planifie: 'Planifié',
  realise: 'Réalisé',
  annule: 'Annulé',
};
function statutLabel(s: string): string {
  return STATUT_LABELS[s as Statut] ?? s;
}
function statutBadgeClass(s: Statut): string {
  const map: Record<Statut, string> = {
    nouveau: 'bg-amber-100 text-amber-800',
    contacte: 'bg-blue-50 text-blue-700',
    planifie: 'bg-violet-50 text-violet-700',
    realise: 'bg-amber-50 text-amber-700',
    annule: 'bg-stone-100 text-stone-500',
  };
  return map[s] ?? 'bg-stone-100 text-stone-500';
}

function initiales(d: DemandeDemo): string {
  return (((d.prenom ?? '')[0] ?? '') + ((d.nom ?? '')[0] ?? '')).toUpperCase() || '?';
}
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function setStatut(d: DemandeDemo, statut: string) {
  if (statut === d.statut) return;
  savingId.value = d.id;
  try {
    await $fetch(`/api/admin/demos/${d.id}`, { method: 'PATCH', body: { statut } });
    toast.add({ title: `Statut : ${statutLabel(statut)}`, color: 'success' });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la mise à jour'), color: 'error' });
  } finally {
    savingId.value = null;
  }
}

async function saveNotes(d: DemandeDemo) {
  savingId.value = d.id;
  try {
    await $fetch(`/api/admin/demos/${d.id}`, {
      method: 'PATCH',
      body: { notes: noteDrafts[d.id] ?? '' },
    });
    toast.add({ title: 'Note enregistrée', color: 'success' });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de l’enregistrement'), color: 'error' });
  } finally {
    savingId.value = null;
  }
}

function confirmDelete(d: DemandeDemo) {
  toDelete.value = d;
  showDeleteModal.value = true;
}
async function executeDelete() {
  if (!toDelete.value) return;
  deletingId.value = toDelete.value.id;
  try {
    await $fetch(`/api/admin/demos/${toDelete.value.id}`, { method: 'DELETE' });
    showDeleteModal.value = false;
    toast.add({ title: 'Demande supprimée', color: 'success' });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la suppression'), color: 'error' });
  } finally {
    deletingId.value = null;
    toDelete.value = null;
  }
}
</script>
