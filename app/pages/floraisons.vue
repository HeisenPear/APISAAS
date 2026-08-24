<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Carte des floraisons
        </h1>
        <p class="mt-0.5 text-sm text-[var(--text-secondary)]">
          Carte communautaire — ce qui fleurit vraiment, en ce moment, près de chez vous.
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

    <UiCarteCollabBarre
      v-model:vue="carte.vue.value"
      v-model:rayon-km="carte.rayonKm.value"
      :centre-label="carte.centreLabel.value"
      :etat-localisation="carte.etatLocalisation.value"
      :resume="resume"
      :chercher-communes="carte.chercherCommunes"
      @localiser="carte.localiser"
      @commune="carte.choisirCommune"
    />

    <!-- Filtres par espèce (emoji) -->
    <div v-if="especes.length > 1" class="flex gap-1.5 overflow-x-auto pb-0.5">
      <button
        v-for="e in especes"
        :key="e.nom"
        type="button"
        class="shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all active:scale-95"
        :class="
          especeActive === e.nom
            ? 'text-white shadow-sm'
            : 'border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--honey)]'
        "
        :style="especeActive === e.nom ? 'background: var(--honey)' : ''"
        @click="especeActive = especeActive === e.nom ? null : e.nom"
      >
        {{ e.emoji }} {{ e.nom }}
        <span class="opacity-60">{{ e.n }}</span>
      </button>
    </div>

    <div class="grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem]">
      <!-- ─── CARTE ─── -->
      <div
        class="relative isolate h-[58vh] overflow-hidden rounded-2xl border border-[var(--border-default)] lg:h-[calc(100vh-14rem)]"
        :class="carte.vue.value === 'liste' ? 'hidden lg:block' : ''"
      >
        <FloraisonsCarteFloraisons
          :observations="points"
          :placement="placement"
          :centre="carte.centre.value"
          :rayon-km="carte.rayonKm.value"
          :focus="focus"
          @point="onPoint"
          @select="selectionner"
        />

        <!-- Légende des stades -->
        <div
          class="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/95 px-3 py-2.5 text-[11px] shadow-md backdrop-blur"
        >
          <p class="mb-1.5 font-semibold text-[var(--text-secondary)]">Stade</p>
          <div class="flex flex-col gap-1">
            <div v-for="s in STADES" :key="s.value" class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="`background:${s.couleur}`" />
              <span class="text-[var(--text-tertiary)]">{{ s.label }}</span>
            </div>
          </div>
        </div>

        <!-- Actions flottantes -->
        <div class="absolute bottom-3 right-3 z-[1000] flex flex-col items-end gap-2">
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--text-secondary)] shadow-md transition-colors hover:text-[var(--honey-deep)]"
            title="Me localiser"
            @click="localiserEtCentrer"
          >
            <UIcon name="i-lucide-locate-fixed" class="h-5 w-5" />
          </button>
          <button
            class="flex items-center gap-1.5 rounded-full bg-[var(--honey)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
            @click="demarrerPlacement"
          >
            <UIcon name="i-lucide-plus" class="h-4 w-4" />
            Signaler
          </button>
        </div>

        <div
          v-if="placement && !modalOuverte"
          class="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium text-white shadow-md"
        >
          Point placé — complétez l’observation
        </div>
        <div
          v-else-if="attentePlacement"
          class="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-[var(--honey)] px-3 py-1.5 text-xs font-medium text-white shadow-md"
        >
          Touchez la carte à l’endroit de la floraison
        </div>
      </div>

      <!-- ─── PANNEAU ─── -->
      <div class="space-y-3 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-1">
        <FloraisonsObservationDetail
          v-if="selected"
          :observation="selected"
          :distance="distanceLabel(selected)"
          @supprime="apresSuppression"
          @ferme="selectedId = null"
        />

        <div :class="carte.vue.value === 'carte' ? 'hidden lg:block' : ''">
          <p
            class="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
          >
            {{ filtrees.length }} observation{{ filtrees.length > 1 ? 's' : '' }}
          </p>

          <div v-if="pending && !data" class="space-y-1.5" aria-busy="true">
            <div
              v-for="i in 4"
              :key="i"
              class="h-[58px] animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
            />
          </div>

          <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

          <div
            v-else-if="!filtrees.length"
            class="rounded-[14px] border border-dashed border-[var(--border-default)] bg-white px-4 py-10 text-center"
          >
            <UIcon name="i-lucide-flower-2" class="mx-auto h-7 w-7 text-[var(--text-tertiary)]" />
            <p class="mt-2 text-sm text-[var(--text-secondary)]">
              Aucune floraison signalée dans cette zone.
            </p>
            <button
              class="mt-2 text-sm font-semibold text-[var(--honey-deep)] hover:underline"
              @click="demarrerPlacement"
            >
              Signaler la première
            </button>
          </div>

          <div v-else class="space-y-1.5">
            <button
              v-for="o in filtrees"
              :key="o.id"
              class="flex w-full items-center gap-2.5 rounded-[12px] border bg-white px-3 py-2.5 text-left transition-colors"
              :class="
                selectedId === o.id
                  ? 'border-[var(--honey)] ring-1 ring-[var(--honey)]/20'
                  : 'border-[var(--border-default)] hover:bg-[var(--surface-muted)]'
              "
              @click="selectionner(o.id)"
            >
              <span class="text-lg leading-none">{{ emojiDe(o) }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-[var(--text-primary)]">
                  {{ o.espece }}
                  <span v-if="o.estMien" class="text-[10px] font-semibold text-[var(--honey-deep)]">
                    · vous</span
                  >
                </p>
                <p class="truncate text-xs text-[var(--text-tertiary)]">
                  {{ formatDate(o.dateObservation) }}
                  <span v-if="o.commune"> · {{ o.commune }}</span>
                  <span v-if="distanceLabel(o)" class="font-medium text-[var(--honey-deep)]">
                    · 📍 {{ distanceLabel(o) }}</span
                  >
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :style="`background:color-mix(in srgb,${couleurStade(o.stade)} 16%,transparent);color:${couleurStade(o.stade)}`"
              >
                {{ labelStade(o.stade) }}
              </span>
            </button>
          </div>
        </div>

        <p class="px-1 pb-1 text-[11px] leading-relaxed text-[var(--text-quaternary)]">
          🌸 Le calendrier théorique dit « l’acacia démarre vers le 10 mai ». Cette carte dit s’il a
          démarré, chez vous, aujourd’hui.
        </p>
      </div>
    </div>

    <FloraisonsObservationModal
      v-model:open="modalOuverte"
      :coord="placement"
      :commune="carte.centreLabel.value"
      @enregistre="apresEnregistrement"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  STADES,
  couleurStade,
  labelStade,
  emojiEspece,
  type FloraisonStade,
} from '~/config/floraisons';

definePageMeta({ title: 'Carte des floraisons' });

interface Observation {
  id: string;
  espece: string;
  latitude: string;
  longitude: string;
  commune: string | null;
  dateObservation: string;
  stade: FloraisonStade;
  intensite: 'faible' | 'moyenne' | 'forte' | null;
  notes: string | null;
  emoji: string | null;
  typeMiel: string | null;
  estMien: boolean;
}

const { data, pending, error, refresh } = await useFetch('/api/floraisons/observations', {
  key: 'floraisons-observations',
  lazy: true,
});

const observations = computed(() => (data.value as { data: Observation[] } | null)?.data ?? []);

const carte = useCarteCollab({ cle: 'floraisons', rayonDefaut: 50 });

const especeActive = ref<string | null>(null);
const selectedId = ref<string | null>(null);
const placement = ref<{ lat: number; lng: number } | null>(null);
const attentePlacement = ref(false);
const modalOuverte = ref(false);
const focus = ref<{ lat: number; lng: number } | null>(null);

function emojiDe(o: Observation): string {
  return emojiEspece(o.espece, o.emoji);
}

function positionDe(o: Observation) {
  return { lat: Number(o.latitude), lng: Number(o.longitude) };
}

/** Rayon d'abord (c'est la question « près de chez moi »), espèce ensuite. */
const dansRayon = computed(() => carte.filtrerParRayon(observations.value, positionDe));

const filtrees = computed(() =>
  especeActive.value
    ? dansRayon.value.filter((o) => o.espece === especeActive.value)
    : dansRayon.value,
);

const points = computed(() =>
  filtrees.value.map((o) => ({
    id: o.id,
    ...positionDe(o),
    espece: o.espece,
    emoji: emojiDe(o),
    stade: o.stade,
  })),
);

/** Espèces présentes dans le rayon, les plus signalées d'abord. */
const especes = computed(() => {
  const compte = new Map<string, { nom: string; emoji: string; n: number }>();
  for (const o of dansRayon.value) {
    const e = compte.get(o.espece);
    if (e) e.n += 1;
    else compte.set(o.espece, { nom: o.espece, emoji: emojiDe(o), n: 1 });
  }
  return [...compte.values()].sort((a, b) => b.n - a.n);
});

const selected = computed(() => filtrees.value.find((o) => o.id === selectedId.value) ?? null);

const statCards = computed(() => {
  const enPleine = dansRayon.value.filter((o) => o.stade === 'pleine').length;
  return [
    { label: 'Observations', valeur: dansRayon.value.length, couleur: 'var(--text-primary)' },
    { label: 'En pleine flo.', valeur: enPleine, couleur: 'var(--honey)' },
    { label: 'Espèces', valeur: especes.value.length, couleur: 'var(--clay)' },
  ];
});

const resume = computed(() => {
  const n = filtrees.value.length;
  const parts = [`${n} observation${n > 1 ? 's' : ''}`];
  const communes = new Set(
    filtrees.value.map((o) => o.commune).filter((c): c is string => Boolean(c)),
  );
  if (communes.size) parts.push(`${communes.size} commune${communes.size > 1 ? 's' : ''}`);
  if (carte.centre.value && carte.rayonKm.value !== null) {
    parts.push(`≤ ${carte.rayonKm.value} km`);
  }
  return parts.join(' · ');
});

function distanceLabel(o: Observation): string | null {
  const d = carte.distanceKm(positionDe(o));
  if (d === null) return null;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function selectionner(id: string) {
  selectedId.value = id;
  const o = filtrees.value.find((x) => x.id === id);
  if (o) focus.value = positionDe(o);
}

function demarrerPlacement() {
  attentePlacement.value = true;
  placement.value = null;
  carte.vue.value = 'carte';
}

function onPoint(coord: { lat: number; lng: number }) {
  if (!attentePlacement.value) return;
  placement.value = coord;
  attentePlacement.value = false;
  modalOuverte.value = true;
}

async function localiserEtCentrer() {
  await carte.localiser();
  if (carte.centre.value) {
    focus.value = { lat: carte.centre.value.lat, lng: carte.centre.value.lng };
  }
}

async function apresEnregistrement() {
  placement.value = null;
  await refresh();
}

async function apresSuppression() {
  selectedId.value = null;
  await refresh();
}
</script>
