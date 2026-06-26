<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Surveillance frelon
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Localisez et suivez les nids autour de vos ruchers, jusqu'à leur destruction.
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="ouvrirCreation()">Signaler</UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="s in statCards"
        :key="s.label"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
      >
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          {{ s.label }}
        </p>
        <p class="mt-1 text-2xl font-semibold tabular-nums" :style="`color:${s.couleur}`">
          {{ s.valeur }}
        </p>
      </div>
    </div>

    <!-- Alertes de proximité -->
    <div v-if="menacesActives.length" class="space-y-2">
      <div
        v-for="m in menacesActives"
        :key="m.rucherId"
        class="flex items-center gap-3 rounded-[12px] border px-4 py-3"
        :style="
          m.niveau === 'eleve'
            ? 'background:#fef2f2;border-color:#fecaca'
            : 'background:var(--honey-soft);border-color:transparent'
        "
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="h-4 w-4 shrink-0"
          :style="`color:${m.niveau === 'eleve' ? '#dc2626' : 'var(--honey-deep)'}`"
        />
        <p class="text-sm text-[var(--text-secondary)]">
          <strong>{{ m.nom }}</strong> : {{ m.nidsProches }} nid{{
            m.nidsProches > 1 ? 's' : ''
          }}
          actif{{ m.nidsProches > 1 ? 's' : '' }} à proximité<span v-if="m.plusProcheKm !== null">
            (le plus proche à {{ m.plusProcheKm }} km)</span
          >.
          <span v-if="m.niveau === 'eleve'" class="font-semibold text-[#dc2626]"
            >Menace élevée.</span
          >
        </p>
      </div>
    </div>

    <!-- Carte -->
    <div class="space-y-2">
      <div class="h-[440px] overflow-hidden rounded-2xl border border-[var(--border-default)]">
        <FrelonCarteFrelon
          :nids="nidsPos"
          :ruchers="ruchersPos"
          :placement="placement"
          @point="onPoint"
          @select="ouvrirEditionParId"
        />
      </div>
      <p class="px-1 text-xs text-[var(--text-tertiary)]">
        💡 Cliquez sur la carte pour placer un signalement. Cercles = zone de surveillance (3 km)
        autour de vos ruchers.
      </p>
    </div>

    <!-- Liste -->
    <div>
      <p
        class="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
      >
        Signalements ({{ signalements.length }})
      </p>
      <div
        v-if="!signalements.length"
        class="rounded-[14px] border border-[var(--border-default)] bg-white py-12 text-center"
      >
        <UIcon name="i-lucide-shield-check" class="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
        <p class="mt-2 text-sm text-[var(--text-secondary)]">Aucun signalement pour le moment.</p>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="n in signalements"
          :key="n.id"
          class="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :style="`background:${couleurStatut(n.statut)}`"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-[var(--text-primary)]">
              {{ labelType(n.type) }}
              <span class="font-normal text-[var(--text-tertiary)]"
                >· {{ labelEspece(n.espece) }}</span
              >
            </p>
            <p class="text-xs text-[var(--text-tertiary)]">
              {{ formatDate(n.dateObservation) }}
              <span v-if="n.commune"> · {{ n.commune }}</span>
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :style="`background:color-mix(in srgb,${couleurStatut(n.statut)} 14%,transparent);color:${couleurStatut(n.statut)}`"
          >
            {{ labelStatut(n.statut) }}
          </span>
          <UButton
            v-if="n.statut !== 'detruit'"
            size="xs"
            color="success"
            variant="soft"
            icon="i-lucide-check"
            title="Marquer détruit"
            @click="marquerDetruit(n.id)"
          />
          <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="ouvrirEdition(n)" />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            @click="supprimer(n.id)"
          />
        </div>
      </div>
    </div>

    <!-- Modal formulaire -->
    <UModal v-model:open="modalOuverte">
      <template #content>
        <div class="p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">
            {{ form.id ? 'Modifier le signalement' : 'Nouveau signalement' }}
          </h2>
          <form class="space-y-3.5" @submit.prevent="enregistrer">
            <div
              v-if="!placement && !form.id"
              class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
            >
              Cliquez sur la carte pour positionner le nid, ou
              <button type="button" class="font-semibold underline" @click="maPosition">
                utilisez ma position</button
              >.
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500">Espèce</span>
                <select
                  v-model="form.espece"
                  class="h-9 w-full rounded-lg border border-stone-200 px-2 text-sm"
                >
                  <option v-for="o in FRELON_ESPECES" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500">Type</span>
                <select
                  v-model="form.type"
                  class="h-9 w-full rounded-lg border border-stone-200 px-2 text-sm"
                >
                  <option v-for="o in FRELON_TYPES" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500">Statut</span>
                <select
                  v-model="form.statut"
                  class="h-9 w-full rounded-lg border border-stone-200 px-2 text-sm"
                >
                  <option v-for="o in FRELON_STATUTS" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500"
                  >Date d'observation</span
                >
                <input
                  v-model="form.date"
                  type="date"
                  class="h-9 w-full rounded-lg border border-stone-200 px-2 text-sm"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500">Commune</span>
                <UInput v-model="form.commune" placeholder="Optionnel" />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-medium text-stone-500">Hauteur (m)</span>
                <UInput v-model.number="form.hauteurM" type="number" placeholder="Optionnel" />
              </label>
            </div>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Notes</span>
              <UTextarea v-model="form.notes" :rows="2" placeholder="Accès, repère, taille…" />
            </label>
            <div class="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <UButton variant="ghost" color="neutral" @click="modalOuverte = false"
                >Annuler</UButton
              >
              <UButton
                type="submit"
                color="primary"
                :loading="saving"
                :disabled="!form.id && !placement"
              >
                {{ form.id ? 'Enregistrer' : 'Signaler' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  FRELON_ESPECES,
  FRELON_TYPES,
  FRELON_STATUTS,
  couleurStatut,
  labelType,
  labelStatut,
  labelEspece,
  type FrelonEspece,
  type FrelonType,
  type FrelonStatut,
} from '~/config/frelon';
import { menacesParRucher, statsFrelon, type NidPos, type RucherPos } from '~/utils/frelon';

definePageMeta({ layout: 'default' });

interface Signalement {
  id: string;
  latitude: string;
  longitude: string;
  espece: FrelonEspece;
  type: FrelonType;
  statut: FrelonStatut;
  dateObservation: string;
  commune: string | null;
  hauteurM: string | null;
  notes: string | null;
}

const notifications = useNotifications();
const { data: rawSignalements, refresh } = await useFetch('/api/frelon', { lazy: true });
const { data: rawRuchers } = await useFetch('/api/ruchers', { lazy: true, query: { limit: 200 } });

const signalements = computed(
  () => (rawSignalements.value as { data: Signalement[] } | null)?.data ?? [],
);
const ruchersPos = computed<RucherPos[]>(() =>
  (
    (
      rawRuchers.value as {
        data: Array<{ id: string; nom: string; latitude: string | null; longitude: string | null }>;
      } | null
    )?.data ?? []
  )
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({ id: r.id, nom: r.nom, lat: Number(r.latitude), lng: Number(r.longitude) })),
);

const nidsPos = computed(() =>
  signalements.value.map((n) => ({
    id: n.id,
    lat: Number(n.latitude),
    lng: Number(n.longitude),
    statut: n.statut,
    type: n.type,
  })),
);

const stats = computed(() => statsFrelon(signalements.value));
const statCards = computed(() => [
  { label: 'Signalements', valeur: stats.value.total, couleur: 'var(--text-primary)' },
  { label: 'Actifs', valeur: stats.value.actifs, couleur: '#dc2626' },
  { label: 'Confirmés', valeur: stats.value.confirme, couleur: '#dc2626' },
  { label: 'Détruits', valeur: stats.value.detruit, couleur: '#16a34a' },
]);

const menacesActives = computed(() =>
  menacesParRucher(nidsPos.value as NidPos[], ruchersPos.value).filter((m) => m.niveau !== 'aucun'),
);

// ── Placement & formulaire ──
const placement = ref<{ lat: number; lng: number } | null>(null);
const modalOuverte = ref(false);
const saving = ref(false);
const today = () => new Date().toISOString().slice(0, 10);

const form = reactive<{
  id: string | null;
  espece: FrelonEspece;
  type: FrelonType;
  statut: FrelonStatut;
  date: string;
  commune: string;
  hauteurM: number | null;
  notes: string;
}>({
  id: null,
  espece: 'asiatique',
  type: 'nid_secondaire',
  statut: 'signale',
  date: today(),
  commune: '',
  hauteurM: null,
  notes: '',
});

function reset() {
  form.id = null;
  form.espece = 'asiatique';
  form.type = 'nid_secondaire';
  form.statut = 'signale';
  form.date = today();
  form.commune = '';
  form.hauteurM = null;
  form.notes = '';
}

function ouvrirCreation() {
  reset();
  modalOuverte.value = true;
}

function onPoint(coord: { lat: number; lng: number }) {
  placement.value = coord;
  if (!modalOuverte.value && !form.id) {
    reset();
    modalOuverte.value = true;
  }
}

function maPosition() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    placement.value = { lat: p.coords.latitude, lng: p.coords.longitude };
  });
}

function ouvrirEdition(n: Signalement) {
  form.id = n.id;
  form.espece = n.espece;
  form.type = n.type;
  form.statut = n.statut;
  form.date = n.dateObservation.slice(0, 10);
  form.commune = n.commune ?? '';
  form.hauteurM = n.hauteurM != null ? Number(n.hauteurM) : null;
  form.notes = n.notes ?? '';
  placement.value = { lat: Number(n.latitude), lng: Number(n.longitude) };
  modalOuverte.value = true;
}

function ouvrirEditionParId(id: string) {
  const n = signalements.value.find((s) => s.id === id);
  if (n) ouvrirEdition(n);
}

async function enregistrer() {
  saving.value = true;
  try {
    const payload = {
      espece: form.espece,
      type: form.type,
      statut: form.statut,
      dateObservation: form.date,
      commune: form.commune || null,
      hauteurM: form.hauteurM ?? null,
      notes: form.notes || null,
    };
    if (form.id) {
      await $fetch(`/api/frelon/${form.id}`, { method: 'PUT', body: payload });
    } else {
      if (!placement.value) return;
      await $fetch('/api/frelon', {
        method: 'POST',
        body: { ...payload, latitude: placement.value.lat, longitude: placement.value.lng },
      });
    }
    modalOuverte.value = false;
    placement.value = null;
    reset();
    await refresh();
    notifications.success('Signalement enregistré');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function marquerDetruit(id: string) {
  try {
    await $fetch(`/api/frelon/${id}`, { method: 'PUT', body: { statut: 'detruit' } });
    await refresh();
    notifications.success('Nid marqué comme détruit');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function supprimer(id: string) {
  if (!confirm('Supprimer ce signalement ?')) return;
  try {
    await $fetch(`/api/frelon/${id}`, { method: 'DELETE' });
    await refresh();
    notifications.success('Signalement supprimé');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
