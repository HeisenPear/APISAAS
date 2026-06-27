<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Carte des frelons
        </h1>
        <p class="mt-0.5 text-sm text-[var(--text-secondary)]">
          Carte communautaire — signalez, confirmez et suivez les nids, ensemble.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 text-center">
        <div
          v-for="s in statCards"
          :key="s.label"
          class="rounded-[12px] border border-[var(--border-default)] bg-white px-3 py-1.5"
        >
          <p class="text-lg font-semibold leading-none tabular-nums" :style="`color:${s.couleur}`">
            {{ s.valeur }}
          </p>
          <p class="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            {{ s.label }}
          </p>
        </div>
      </div>
    </div>

    <!-- Two-pane : carte (héros) + panneau -->
    <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <!-- ─── CARTE ─── -->
      <div
        class="relative h-[58vh] overflow-hidden rounded-2xl border border-[var(--border-default)] lg:h-[calc(100vh-12rem)]"
      >
        <FrelonCarteFrelon
          :nids="nidsPos"
          :ruchers="ruchersPos"
          :placement="placement"
          :focus="focus"
          @point="onPoint"
          @select="selectionner"
        />

        <!-- Filtres flottants -->
        <div
          class="pointer-events-none absolute left-3 right-16 top-3 z-[1000] flex flex-wrap gap-1.5"
        >
          <button
            v-for="f in filtres"
            :key="f.key"
            class="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-colors"
            :class="
              filtre === f.key
                ? 'bg-[var(--text-primary)] text-white'
                : 'bg-white/90 text-[var(--text-secondary)] hover:bg-white'
            "
            @click="filtre = f.key"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- Légende flottante -->
        <div
          class="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/95 px-3 py-2.5 text-[11px] shadow-md backdrop-blur"
        >
          <p class="mb-1.5 font-semibold text-[var(--text-secondary)]">Légende</p>
          <div class="flex flex-col gap-1">
            <div v-for="st in legendeStatuts" :key="st.value" class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="`background:${st.couleur}`" />
              <span class="text-[var(--text-tertiary)]">{{ st.label }}</span>
            </div>
          </div>
          <div
            class="mt-1.5 flex items-center gap-1.5 border-t border-[var(--border-default)] pt-1.5"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]" />
            <span class="h-3 w-3 rounded-full bg-[var(--text-tertiary)]" />
            <span class="text-[var(--text-tertiary)]">peu → infestation</span>
          </div>
        </div>

        <!-- Actions flottantes -->
        <div class="absolute bottom-3 right-3 z-[1000] flex flex-col items-end gap-2">
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--text-secondary)] shadow-md transition-colors hover:text-[var(--honey-deep)]"
            title="Me localiser"
            @click="localiser"
          >
            <UIcon name="i-lucide-locate-fixed" class="h-5 w-5" />
          </button>
          <button
            class="flex items-center gap-1.5 rounded-full bg-[var(--honey)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
            @click="ouvrirCreation()"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4" />
            Signaler
          </button>
        </div>

        <!-- Indice de placement -->
        <div
          v-if="placement && !modalOuverte"
          class="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-white shadow-md"
        >
          Point placé — complétez le signalement
        </div>
      </div>

      <!-- ─── PANNEAU ─── -->
      <div class="space-y-3 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
        <!-- Alertes de proximité graduées -->
        <div v-if="menacesActives.length" class="space-y-2">
          <div
            v-for="m in menacesActives"
            :key="m.rucherId"
            class="flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5"
            :style="`background:color-mix(in srgb,${niveauColor(m.niveau)} 9%,white);border-color:color-mix(in srgb,${niveauColor(m.niveau)} 30%,transparent)`"
          >
            <span
              class="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              :style="`background:${niveauColor(m.niveau)}`"
            >
              {{ niveauLabel(m.niveau) }}
            </span>
            <p class="text-xs leading-relaxed text-[var(--text-secondary)]">
              <strong>{{ m.nom }}</strong> — {{ m.nidsProches }} nid{{
                m.nidsProches > 1 ? 's' : ''
              }}
              actif{{ m.nidsProches > 1 ? 's' : ''
              }}<span v-if="m.plusProcheKm !== null"
                >, le plus proche à {{ m.plusProcheKm }} km</span
              >.
            </p>
          </div>
        </div>

        <!-- Détail sélectionné -->
        <div
          v-if="selected"
          class="rounded-[16px] border-2 bg-white p-4"
          :style="`border-color:color-mix(in srgb,${couleurStatut(selected.statut)} 40%,transparent)`"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :style="`background:color-mix(in srgb,${couleurStatut(selected.statut)} 14%,transparent);color:${couleurStatut(selected.statut)}`"
                >
                  {{ labelStatut(selected.statut) }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :style="`background:color-mix(in srgb,${couleurPression(selected.pression)} 14%,transparent);color:${couleurPression(selected.pression)}`"
                >
                  {{ labelPression(selected.pression) }}
                </span>
              </div>
              <p class="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
                {{ labelType(selected.type) }}
              </p>
              <p class="text-xs text-[var(--text-tertiary)]">
                {{ labelEspece(selected.espece) }} · {{ formatDate(selected.dateObservation) }}
                <span v-if="selected.commune"> · {{ selected.commune }}</span>
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-center gap-1">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                :style="`background:${fiabiliteColor(selected.scoreFiabilite)}`"
              >
                {{ selected.scoreFiabilite }}
              </div>
              <span class="text-[9px] uppercase tracking-wide text-[var(--text-quaternary)]"
                >fiabilité</span
              >
            </div>
          </div>

          <p v-if="selected.notes" class="mt-2 text-sm text-[var(--text-secondary)]">
            {{ selected.notes }}
          </p>

          <p class="mt-2 text-xs text-[var(--text-tertiary)]">
            👍 {{ selected.confirmations }} · 👎 {{ selected.infirmations }} · ✓
            {{ selected.destructions }}
            <span v-if="!selected.estMien"> · signalé par la communauté</span>
          </p>

          <!-- Actions -->
          <div class="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border-default)] pt-3">
            <template v-if="selected.estMien">
              <UButton
                size="xs"
                variant="soft"
                icon="i-lucide-pencil"
                @click="ouvrirEdition(selected)"
                >Modifier</UButton
              >
              <UButton
                v-if="selected.statut !== 'detruit'"
                size="xs"
                color="success"
                variant="soft"
                icon="i-lucide-check"
                @click="marquerDetruit(selected.id)"
                >Détruit</UButton
              >
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="supprimer(selected.id)"
                >Supprimer</UButton
              >
            </template>
            <template v-else>
              <UButton
                v-for="v in FRELON_VOTES"
                :key="v.value"
                size="xs"
                :variant="selected.monVote === v.value ? 'solid' : 'soft'"
                :color="voteColor(v.value)"
                @click="voter(selected.id, v.value)"
              >
                {{ v.label }}
              </UButton>
            </template>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              class="ml-auto"
              @click="selectedId = null"
            />
          </div>
        </div>

        <!-- Liste -->
        <div>
          <p
            class="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            {{ signalementsFiltres.length }} signalement{{
              signalementsFiltres.length > 1 ? 's' : ''
            }}
          </p>
          <div
            v-if="!signalementsFiltres.length"
            class="rounded-[14px] border border-dashed border-[var(--border-default)] bg-white px-4 py-10 text-center"
          >
            <UIcon
              name="i-lucide-map-pin-off"
              class="mx-auto h-7 w-7 text-[var(--text-tertiary)]"
            />
            <p class="mt-2 text-sm text-[var(--text-secondary)]">Aucun signalement ici.</p>
            <button
              class="mt-2 text-sm font-semibold text-[var(--honey-deep)] hover:underline"
              @click="ouvrirCreation()"
            >
              Signaler le premier nid
            </button>
          </div>
          <div v-else class="space-y-1.5">
            <button
              v-for="n in signalementsFiltres"
              :key="n.id"
              class="flex w-full items-center gap-2.5 rounded-[12px] border bg-white px-3 py-2.5 text-left transition-colors"
              :class="
                selectedId === n.id
                  ? 'border-[var(--honey)] ring-1 ring-[var(--honey)]/20'
                  : 'border-[var(--border-default)] hover:bg-[var(--surface-muted)]'
              "
              @click="selectionner(n.id)"
            >
              <span
                class="shrink-0 rounded-full"
                :style="`width:${pastilleTaille(n.pression)};height:${pastilleTaille(n.pression)};background:${couleurStatut(n.statut)}`"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-primary)]">
                  {{ labelType(n.type) }}
                  <span class="font-normal text-[var(--text-tertiary)]"
                    >· {{ labelPression(n.pression) }}</span
                  >
                  <span
                    v-if="n.estMien"
                    class="ml-1 text-[10px] font-semibold text-[var(--honey-deep)]"
                    >· vous</span
                  >
                </p>
                <p class="truncate text-xs text-[var(--text-tertiary)]">
                  {{ formatDate(n.dateObservation)
                  }}<span v-if="n.commune"> · {{ n.commune }}</span> · 👍 {{ n.confirmations }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :style="`background:color-mix(in srgb,${couleurStatut(n.statut)} 14%,transparent);color:${couleurStatut(n.statut)}`"
              >
                {{ labelStatut(n.statut) }}
              </span>
            </button>
          </div>
        </div>

        <p class="px-1 pb-1 text-[11px] leading-relaxed text-[var(--text-quaternary)]">
          🛡️ Validé par la communauté : chaque signalement est confirmé (ou infirmé) par d'autres
          apiculteurs. Le score de fiabilité reflète ce consensus.
        </p>
      </div>
    </div>

    <!-- Modal formulaire -->
    <UModal v-model:open="modalOuverte">
      <template #content>
        <div class="p-6">
          <h2 class="mb-1 text-lg font-semibold text-stone-900">
            {{ form.id ? 'Modifier le signalement' : 'Signaler un frelon' }}
          </h2>
          <p class="mb-4 text-xs text-stone-500">
            {{
              form.id
                ? 'Mettez à jour les informations.'
                : 'Aidez la communauté à cartographier la menace.'
            }}
          </p>
          <form class="space-y-3.5" @submit.prevent="enregistrer">
            <div
              v-if="!placement && !form.id"
              class="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
            >
              <UIcon name="i-lucide-mouse-pointer-click" class="h-4 w-4 shrink-0" />
              <span>
                Touchez la carte pour positionner le nid, ou
                <button type="button" class="font-semibold underline" @click="maPosition">
                  utilisez ma position</button
                >.
              </span>
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
            </div>
            <div>
              <span class="mb-1 block text-xs font-medium text-stone-500">Quantité de frelons</span>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  v-for="o in FRELON_PRESSIONS"
                  :key="o.value"
                  type="button"
                  class="rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors"
                  :style="
                    form.pression === o.value
                      ? `border-color:${o.couleur};background:color-mix(in srgb,${o.couleur} 12%,white);color:${o.couleur}`
                      : 'border-color:var(--border-default);color:var(--text-secondary)'
                  "
                  @click="form.pression = o.value"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
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
                <span class="mb-1 block text-xs font-medium text-stone-500">Hauteur (m)</span>
                <UInput v-model.number="form.hauteurM" type="number" placeholder="Optionnel" />
              </label>
            </div>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Commune</span>
              <UInput v-model="form.commune" placeholder="Optionnel" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-stone-500">Notes</span>
              <UTextarea v-model="form.notes" :rows="2" placeholder="Accès, repère, taille…" />
            </label>
            <div class="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <UButton variant="ghost" color="neutral" @click="modalOuverte = false"
                >Annuler</UButton
              >
              <UButton
                type="submit"
                color="primary"
                :loading="saving"
                :disabled="!form.id && !placement"
              >
                {{ form.id ? 'Enregistrer' : 'Publier le signalement' }}
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
  FRELON_PRESSIONS,
  FRELON_VOTES,
  FRELON_STATUTS,
  NIVEAUX_MENACE,
  couleurStatut,
  couleurPression,
  labelType,
  labelStatut,
  labelEspece,
  labelPression,
  type FrelonEspece,
  type FrelonType,
  type FrelonStatut,
  type FrelonPression,
  type FrelonVote,
  type NiveauMenace,
} from '~/config/frelon';
import { menacesParRucher, statsFrelon, type NidPos, type RucherPos } from '~/utils/frelon';

definePageMeta({ layout: 'default' });

interface Signalement {
  id: string;
  latitude: string;
  longitude: string;
  espece: FrelonEspece;
  type: FrelonType;
  pression: FrelonPression;
  statut: FrelonStatut;
  dateObservation: string;
  commune: string | null;
  hauteurM: string | null;
  notes: string | null;
  confirmations: number;
  infirmations: number;
  destructions: number;
  scoreFiabilite: number;
  estMien: boolean;
  monVote: FrelonVote | null;
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

// Filtres
const filtres = [
  { key: 'tous' as const, label: 'Tous' },
  { key: 'a_verifier' as const, label: 'À vérifier' },
  { key: 'confirme' as const, label: 'Confirmés' },
  { key: 'miens' as const, label: 'Les miens' },
];
const filtre = ref<'tous' | 'a_verifier' | 'confirme' | 'miens'>('tous');

const signalementsFiltres = computed(() => {
  const all = signalements.value;
  if (filtre.value === 'miens') return all.filter((n) => n.estMien);
  if (filtre.value === 'a_verifier') return all.filter((n) => n.statut === 'a_verifier');
  if (filtre.value === 'confirme') return all.filter((n) => n.statut === 'confirme');
  return all;
});

const nidsPos = computed(() =>
  signalementsFiltres.value.map((n) => ({
    id: n.id,
    lat: Number(n.latitude),
    lng: Number(n.longitude),
    statut: n.statut,
    type: n.type,
    pression: n.pression,
  })),
);

// Menaces calculées sur TOUS les signalements actifs (indépendamment du filtre).
const nidsActifsAll = computed<NidPos[]>(() =>
  signalements.value.map((n) => ({
    id: n.id,
    lat: Number(n.latitude),
    lng: Number(n.longitude),
    statut: n.statut,
    pression: n.pression,
  })),
);

const stats = computed(() => statsFrelon(signalements.value));
const statCards = computed(() => [
  { label: 'Total', valeur: stats.value.total, couleur: 'var(--text-primary)' },
  { label: 'Actifs', valeur: stats.value.actifs, couleur: '#dc2626' },
  { label: 'Confirmés', valeur: stats.value.confirme, couleur: '#dc2626' },
  { label: 'Détruits', valeur: stats.value.detruit, couleur: '#16a34a' },
]);

const menacesActives = computed(() =>
  menacesParRucher(nidsActifsAll.value, ruchersPos.value).filter((m) => m.niveau !== 'aucun'),
);

const legendeStatuts = FRELON_STATUTS.filter((s) => s.value !== 'rejete');
const niveauColor = (n: NiveauMenace) => NIVEAUX_MENACE[n].couleur;
const niveauLabel = (n: NiveauMenace) => NIVEAUX_MENACE[n].label;
const pastilleTaille = (p: FrelonPression) =>
  ({ faible: '8px', modere: '10px', fort: '12px', infestation: '14px' })[p];
function fiabiliteColor(score: number) {
  return score >= 66 ? '#16a34a' : score >= 40 ? '#f59e0b' : '#dc2626';
}
function voteColor(v: FrelonVote): 'error' | 'neutral' | 'success' {
  return v === 'confirme' ? 'error' : v === 'detruit' ? 'success' : 'neutral';
}

// Sélection + recentrage carte
const selectedId = ref<string | null>(null);
const selected = computed(() => signalements.value.find((n) => n.id === selectedId.value) ?? null);
const focus = ref<{ lat: number; lng: number } | null>(null);
function selectionner(id: string) {
  selectedId.value = id;
  const n = signalements.value.find((s) => s.id === id);
  if (n) focus.value = { lat: Number(n.latitude), lng: Number(n.longitude) };
}
function localiser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    focus.value = { lat: p.coords.latitude, lng: p.coords.longitude };
  });
}

// Placement & formulaire
const placement = ref<{ lat: number; lng: number } | null>(null);
const modalOuverte = ref(false);
const saving = ref(false);
const today = () => new Date().toISOString().slice(0, 10);

const form = reactive<{
  id: string | null;
  espece: FrelonEspece;
  type: FrelonType;
  pression: FrelonPression;
  date: string;
  commune: string;
  hauteurM: number | null;
  notes: string;
}>({
  id: null,
  espece: 'asiatique',
  type: 'nid_secondaire',
  pression: 'modere',
  date: today(),
  commune: '',
  hauteurM: null,
  notes: '',
});

function reset() {
  form.id = null;
  form.espece = 'asiatique';
  form.type = 'nid_secondaire';
  form.pression = 'modere';
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
    focus.value = { lat: p.coords.latitude, lng: p.coords.longitude };
  });
}

function ouvrirEdition(n: Signalement) {
  form.id = n.id;
  form.espece = n.espece;
  form.type = n.type;
  form.pression = n.pression;
  form.date = n.dateObservation.slice(0, 10);
  form.commune = n.commune ?? '';
  form.hauteurM = n.hauteurM != null ? Number(n.hauteurM) : null;
  form.notes = n.notes ?? '';
  placement.value = { lat: Number(n.latitude), lng: Number(n.longitude) };
  modalOuverte.value = true;
}

async function enregistrer() {
  saving.value = true;
  try {
    const payload = {
      espece: form.espece,
      type: form.type,
      pression: form.pression,
      dateObservation: form.date,
      commune: form.commune || null,
      hauteurM: form.hauteurM ?? null,
      notes: form.notes || null,
    };
    if (form.id) {
      await $fetch(`/api/frelon/${form.id}`, { method: 'PUT', body: payload });
      notifications.success('Signalement mis à jour');
    } else {
      if (!placement.value) return;
      const res = await $fetch<{ deduplique: boolean }>('/api/frelon', {
        method: 'POST',
        body: { ...payload, latitude: placement.value.lat, longitude: placement.value.lng },
      });
      notifications.success(
        res.deduplique
          ? 'Un nid était déjà signalé ici — votre confirmation a été enregistrée.'
          : 'Signalement publié sur la carte communautaire',
      );
    }
    modalOuverte.value = false;
    placement.value = null;
    reset();
    await refresh();
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function voter(id: string, vote: FrelonVote) {
  try {
    await $fetch(`/api/frelon/${id}/vote`, { method: 'POST', body: { vote } });
    await refresh();
    notifications.success('Vote enregistré — merci pour la communauté !');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
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
    if (selectedId.value === id) selectedId.value = null;
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
