<script setup lang="ts">
import { suggererFloraisons, type Floraison } from '~/utils/floraisons';

definePageMeta({ layout: 'default' });

interface MapPoint {
  id: string;
  nom: string;
  latitude: string | number | null;
  longitude: string | number | null;
}
interface AnalysePoint {
  lat: number;
  lng: number;
  commune: string | null;
  codePostal: string | null;
  departement: string | null;
  altitude: number | null;
}

const { data: florData } = useFetch<{ data: Floraison[] }>('/api/transhumance/floraisons', {
  key: 'florref',
  lazy: true,
});
const { data: ruchData } = useFetch<{ data: MapPoint[] }>('/api/ruchers', {
  key: 'carte-ruchers',
  query: { limit: 200 },
  lazy: true,
});
const { data: empData } = useFetch<{ data: MapPoint[] }>('/api/transhumance/emplacements', {
  key: 'carte-emplacements',
  query: { limit: 200 },
  lazy: true,
});

const floraisons = computed(() => florData.value?.data ?? []);
const ruchers = computed(() => ruchData.value?.data ?? []);
const emplacements = computed(() => empData.value?.data ?? []);

const MOIS_NOMS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const mois = ref(new Date().getMonth() + 1);
const typeMielFiltre = ref('');
const userLat = ref<number | null>(null);
const mapCenter = ref<[number, number] | undefined>(undefined);

const typesMiel = computed(
  () => [...new Set(floraisons.value.map((f) => f.typeMiel).filter(Boolean))].sort() as string[],
);

// Latitude par défaut = centroïde des ruchers (pour des suggestions sans géoloc).
watch(
  ruchers,
  (rs) => {
    if (userLat.value != null || rs.length === 0) return;
    const lats = rs.map((r) => Number(r.latitude)).filter((n) => !Number.isNaN(n));
    if (lats.length) userLat.value = lats.reduce((a, b) => a + b, 0) / lats.length;
  },
  { immediate: true },
);

const suggestions = computed(() =>
  suggererFloraisons(floraisons.value, {
    mois: mois.value,
    latitude: userLat.value ?? undefined,
    typeMiel: typeMielFiltre.value || undefined,
  }),
);

const geoloc = ref<'idle' | 'pending' | 'error'>('idle');
function maPosition() {
  if (!import.meta.client || !navigator.geolocation) return;
  geoloc.value = 'pending';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat.value = pos.coords.latitude;
      mapCenter.value = [pos.coords.latitude, pos.coords.longitude];
      geoloc.value = 'idle';
    },
    () => (geoloc.value = 'error'),
  );
}

// ── Analyse d'un point cliqué sur la carte ──
const point = ref<AnalysePoint | null>(null);
const analysing = ref(false);
const saving = ref(false);
const savedId = ref<string | null>(null);

async function onPoint(p: { lat: number; lng: number }) {
  analysing.value = true;
  savedId.value = null;
  point.value = {
    lat: p.lat,
    lng: p.lng,
    commune: null,
    codePostal: null,
    departement: null,
    altitude: null,
  };
  try {
    const res = await $fetch<{ data: AnalysePoint }>('/api/transhumance/analyser-point', {
      query: { lat: p.lat, lng: p.lng },
    });
    point.value = res.data;
  } catch {
    // On garde au moins les coordonnées brutes.
  } finally {
    analysing.value = false;
  }
}

const suggestionsPoint = computed(() => {
  if (!point.value) return [];
  return suggererFloraisons(floraisons.value, {
    mois: mois.value,
    latitude: point.value.lat,
    altitude: point.value.altitude ?? undefined,
  });
});

async function enregistrer() {
  if (!point.value) return;
  saving.value = true;
  try {
    const miellees = suggestionsPoint.value
      .map((f) => f.typeMiel)
      .filter(Boolean)
      .slice(0, 6) as string[];
    const res = await $fetch<{ data: { id: string } }>('/api/transhumance/emplacements', {
      method: 'POST',
      body: {
        nom: point.value.commune ? `Candidat — ${point.value.commune}` : 'Emplacement repéré',
        latitude: point.value.lat,
        longitude: point.value.lng,
        commune: point.value.commune ?? undefined,
        codePostal: point.value.codePostal ?? undefined,
        altitudeMetres: point.value.altitude ?? undefined,
        mielleesPrincipales: miellees.length ? miellees : undefined,
        notes: 'Repéré depuis la carte de transhumance',
      },
    });
    savedId.value = res.data.id;
  } catch (e) {
    saving.value = false;
    throw e;
  }
  saving.value = false;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              system-ui,
              sans-serif;
          "
        >
          Carte de transhumance
        </h1>
        <p class="mt-1 text-[14px] text-[var(--text-secondary)]">
          Repérez les ressources mellifères autour d'un lieu — cultures, forêts et floraisons.
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[var(--surface-muted)]"
        @click="maPosition"
      >
        <UIcon
          :name="geoloc === 'pending' ? 'i-lucide-loader-circle' : 'i-lucide-locate-fixed'"
          :class="['h-4 w-4', geoloc === 'pending' && 'animate-spin']"
          style="color: var(--honey-deep)"
        />
        Ma position
      </button>
    </div>

    <!-- Filtres -->
    <div class="flex flex-wrap items-center gap-3">
      <select
        v-model.number="mois"
        class="h-10 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-[14px]"
      >
        <option v-for="(n, i) in MOIS_NOMS" :key="i" :value="i + 1">{{ n }}</option>
      </select>
      <select
        v-model="typeMielFiltre"
        class="h-10 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-[14px] capitalize"
      >
        <option value="">Tous les miels</option>
        <option v-for="t in typesMiel" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Carte + panneau -->
    <div class="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div
        class="h-[52vh] overflow-hidden rounded-[14px] border border-[var(--border-default)] lg:h-[72vh]"
      >
        <TranshumanceCarteTranshumance
          :ruchers="ruchers"
          :emplacements="emplacements"
          :center="mapCenter"
          @point="onPoint"
        />
      </div>

      <div class="space-y-3 lg:h-[72vh] lg:overflow-y-auto lg:pr-1">
        <!-- Analyse d'un point cliqué -->
        <div
          v-if="point"
          class="rounded-[14px] border p-4"
          style="
            border-color: color-mix(in srgb, var(--honey) 35%, transparent);
            background: var(--honey-soft);
          "
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-[15px] font-semibold text-[var(--text-primary)]">
                {{ point.commune ?? 'Point sélectionné' }}
              </p>
              <p class="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                {{ point.lat.toFixed(4) }}, {{ point.lng.toFixed(4) }}
                <template v-if="point.altitude != null"> · {{ point.altitude }} m</template>
              </p>
            </div>
            <button
              type="button"
              class="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              @click="point = null"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>

          <p v-if="analysing" class="mt-3 text-[13px] text-[var(--text-secondary)]">Analyse…</p>
          <template v-else>
            <p
              class="mt-3 mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]"
            >
              Mellifères compatibles ici
            </p>
            <div v-if="suggestionsPoint.length" class="space-y-2">
              <TranshumanceFloraisonCard
                v-for="f in suggestionsPoint.slice(0, 5)"
                :key="f.id"
                :floraison="f"
              />
            </div>
            <p v-else class="text-[13px] text-[var(--text-secondary)]">
              Aucune miellée connue compatible avec ce lieu en {{ MOIS_NOMS[mois - 1] }}.
            </p>

            <div
              v-if="savedId"
              class="mt-3 flex items-center gap-2 text-[13px] font-medium"
              style="color: var(--sage-deep)"
            >
              <UIcon name="i-lucide-check-circle" class="h-4 w-4" />
              Emplacement enregistré.
              <NuxtLink to="/transhumance/emplacements" class="underline">Voir / éditer</NuxtLink>
            </div>
            <button
              v-else
              type="button"
              :disabled="saving"
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style="background: var(--honey)"
              @click="enregistrer"
            >
              <UIcon
                :name="saving ? 'i-lucide-loader-circle' : 'i-lucide-map-pin-plus'"
                :class="['h-4 w-4', saving && 'animate-spin']"
              />
              Enregistrer comme emplacement
            </button>
          </template>
        </div>

        <!-- Suggestions globales (zone de l'utilisateur) -->
        <div v-else>
          <p
            class="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]"
          >
            En {{ MOIS_NOMS[mois - 1] }} dans votre zone
          </p>
          <div v-if="suggestions.length" class="space-y-2">
            <TranshumanceFloraisonCard v-for="f in suggestions" :key="f.id" :floraison="f" />
          </div>
          <p
            v-else
            class="rounded-[12px] border border-[var(--border-default)] bg-white p-4 text-[13px] text-[var(--text-secondary)]"
          >
            Aucune miellée connue pour ce mois et cette zone. Essayez un autre mois ou
            <button class="underline" @click="typeMielFiltre = ''">retirez le filtre</button>.
          </p>
          <p class="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
            <UIcon name="i-lucide-mouse-pointer-click" class="h-3.5 w-3.5" />
            Cliquez sur la carte pour analyser un lieu précis.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
