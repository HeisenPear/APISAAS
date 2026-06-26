<script setup lang="ts">
import { suggererFloraisons, type Floraison } from '~/utils/floraisons';
import {
  calculerZonesDepartements,
  couleurMiel,
  type DeptBreakdown,
} from '~/utils/zonesMelliferes';
import { scoreFloraisons, scoreEmplacement } from '~/utils/scoreEmplacement';

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

// Zones mellifères par département (couleur = miel dominant).
// Si `zonesParMois`, on ne garde que les miels en fleur au mois sélectionné.
const zonesParMois = ref(false);
const zonesData = computed(() =>
  calculerZonesDepartements(floraisons.value, zonesParMois.value ? mois.value : undefined),
);

// Département sélectionné (clic sur une zone) → répartition des miels.
const zoneSel = ref<{ code: string; nom: string; breakdown: DeptBreakdown } | null>(null);
function onZone(z: { code: string; nom: string; breakdown: DeptBreakdown }) {
  point.value = null;
  if (z.code !== zoneSel.value?.code) topSpots.value = [];
  zoneSel.value = z;
}

// Top des meilleurs spots de butinage du département (scan occupation du sol).
interface TopSpot {
  nom: string;
  lat: number;
  lng: number;
  potentiel: number;
  dominant: string;
}
const topSpots = ref<TopSpot[]>([]);
const topLoading = ref(false);
async function chercherTopSpots(dept: string) {
  topLoading.value = true;
  topSpots.value = [];
  try {
    const r = await $fetch<{ data: { spots: TopSpot[] } }>('/api/transhumance/top-butinage', {
      query: { dept },
    });
    topSpots.value = r.data.spots;
  } catch {
    // silencieux
  } finally {
    topLoading.value = false;
  }
}
function allerAuSpot(s: TopSpot) {
  mapCenter.value = [s.lat, s.lng];
  onPoint({ lat: s.lat, lng: s.lng });
}

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
interface ButinageRessource {
  label: string;
  pct: number;
  mellifere: boolean;
  categorie: string;
}
interface ButinageResult {
  rayonKm: number;
  nbEchantillons: number;
  potentiel: number;
  potentielLabel: 'faible' | 'moyen' | 'bon' | 'excellent';
  ressources: ButinageRessource[];
  mielsProbables: { typeMiel: string; pct: number }[];
}

const point = ref<AnalysePoint | null>(null);
const analysing = ref(false);
const saving = ref(false);
const savedId = ref<string | null>(null);
const butinage = ref<ButinageResult | null>(null);
const butinageLoading = ref(false);
const meteoScore = ref<number | null>(null);

// Score d'emplacement global (terrain + miellées + météo du moment).
const scoreEmpl = computed(() =>
  point.value
    ? scoreEmplacement({
        butinage: butinage.value?.potentiel ?? null,
        floraisons: scoreFloraisons(suggestionsPoint.value),
        meteo: meteoScore.value,
      })
    : null,
);
const SCORE_COULEUR: Record<string, string> = {
  faible: 'var(--clay-deep)',
  moyen: 'var(--honey-deep)',
  bon: 'var(--sage-deep)',
  excellent: 'var(--sage-deep)',
};

const POTENTIEL_COULEUR: Record<string, string> = {
  faible: 'var(--clay-deep)',
  moyen: 'var(--honey-deep)',
  bon: 'var(--sage-deep)',
  excellent: 'var(--sage-deep)',
};

async function onPoint(p: { lat: number; lng: number }) {
  zoneSel.value = null;
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

  // Rayon de butinage : plus lent (échantillonnage IGN) → en tâche de fond.
  butinage.value = null;
  butinageLoading.value = true;
  $fetch<{ data: ButinageResult }>('/api/transhumance/butinage', {
    query: { lat: p.lat, lng: p.lng },
  })
    .then((r) => (butinage.value = r.data))
    .catch(() => {})
    .finally(() => (butinageLoading.value = false));

  // Météo du moment (pour le score d'emplacement) — en tâche de fond.
  meteoScore.value = null;
  $fetch<{ data: { score: number | null } }>('/api/transhumance/meteo-point', {
    query: { lat: p.lat, lng: p.lng },
  })
    .then((r) => (meteoScore.value = r.data.score))
    .catch(() => {});

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
      <button
        type="button"
        class="flex h-10 items-center gap-2 rounded-[10px] border px-3 text-[13px] font-medium transition-colors"
        :style="
          zonesParMois
            ? 'border-color: var(--honey); background: var(--honey-soft); color: var(--honey-deep)'
            : 'border-color: var(--border-default); background: white; color: var(--text-secondary)'
        "
        @click="zonesParMois = !zonesParMois"
      >
        <UIcon :name="zonesParMois ? 'i-lucide-check-square' : 'i-lucide-square'" class="h-4 w-4" />
        Zones du mois
      </button>
    </div>

    <!-- Légende des miels (clé de lecture de la carte) -->
    <div class="rounded-[12px] border border-[var(--border-default)] bg-white px-4 py-2.5">
      <TranshumanceLegendeMiel :floraisons="floraisons" />
    </div>

    <!-- Carte + panneau -->
    <div class="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div
        class="h-[52vh] overflow-hidden rounded-[14px] border border-[var(--border-default)] lg:h-[72vh]"
      >
        <TranshumanceCarteTranshumance
          :ruchers="ruchers"
          :emplacements="emplacements"
          :zones-miel="zonesData.zones"
          :max-richesse="zonesData.maxRichesse"
          :top-spots="topSpots"
          :center="mapCenter"
          @point="onPoint"
          @zone="onZone"
        />
      </div>

      <div class="space-y-3 lg:h-[72vh] lg:overflow-y-auto lg:pr-1">
        <!-- Répartition des miels d'un département cliqué -->
        <div
          v-if="zoneSel"
          class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-[15px] font-semibold text-[var(--text-primary)]">
              {{ zoneSel.nom }}
              <span class="text-[var(--text-tertiary)]">· {{ zoneSel.code }}</span>
            </p>
            <button
              type="button"
              class="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              @click="zoneSel = null"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>
          <p class="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            Répartition mellifère estimée de la zone
          </p>
          <div class="mt-3 space-y-2.5">
            <div v-for="t in zoneSel.breakdown.types" :key="t.typeMiel">
              <div class="flex items-center justify-between text-[13px]">
                <span class="capitalize text-[var(--text-primary)]"
                  >{{ t.emoji }} {{ t.typeMiel }}</span
                >
                <span class="font-semibold text-[var(--text-secondary)]">{{ t.pct }}%</span>
              </div>
              <div
                class="mt-1 h-2 overflow-hidden rounded-full"
                style="background: var(--surface-muted)"
              >
                <div
                  class="h-full rounded-full"
                  :style="{ width: t.pct + '%', background: t.couleur }"
                />
              </div>
            </div>
          </div>

          <!-- Meilleurs spots de butinage du département -->
          <div class="mt-4 border-t border-[var(--border-default)] pt-3">
            <button
              v-if="!topSpots.length && !topLoading"
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
              style="background: var(--surface-sidebar)"
              @click="chercherTopSpots(zoneSel.code)"
            >
              <UIcon name="i-lucide-radar" class="h-4 w-4" />
              Trouver les meilleurs spots de butinage
            </button>
            <p
              v-else-if="topLoading"
              class="flex items-center gap-2 py-1 text-[13px] text-[var(--text-secondary)]"
            >
              <UIcon name="i-lucide-loader-circle" class="h-4 w-4 animate-spin" />
              Triangulation du territoire en cours… (~15 s)
            </p>
            <div v-else>
              <p
                class="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]"
              >
                Meilleurs spots de butinage
              </p>
              <ol class="space-y-1.5">
                <li v-for="(s, i) in topSpots" :key="i">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2.5 rounded-[10px] border border-[var(--border-default)] bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    @click="allerAuSpot(s)"
                  >
                    <span
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style="background: var(--honey)"
                      >{{ i + 1 }}</span
                    >
                    <span class="min-w-0 flex-1">
                      <span
                        class="block truncate text-[13px] font-medium text-[var(--text-primary)]"
                        >{{ s.nom }}</span
                      >
                      <span class="block truncate text-[11px] text-[var(--text-tertiary)]">{{
                        s.dominant
                      }}</span>
                    </span>
                    <span
                      class="shrink-0 text-[14px] font-bold"
                      :style="{
                        color:
                          s.potentiel >= 55
                            ? 'var(--sage-deep)'
                            : s.potentiel >= 35
                              ? 'var(--honey-deep)'
                              : 'var(--clay-deep)',
                      }"
                      >{{ s.potentiel }}</span
                    >
                  </button>
                </li>
              </ol>
              <p class="mt-1.5 text-[11px] text-[var(--text-quaternary)]">
                Cliquez un spot pour son analyse détaillée.
              </p>
            </div>
          </div>
        </div>

        <!-- Analyse d'un point cliqué -->
        <div
          v-else-if="point"
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
            <!-- Score d'emplacement global -->
            <div
              v-if="scoreEmpl"
              class="mt-3 rounded-[12px] border border-[var(--border-default)] bg-white p-3"
            >
              <div class="flex items-end justify-between">
                <div>
                  <p
                    class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                  >
                    Score d'emplacement
                  </p>
                  <p
                    class="text-[13px] font-semibold capitalize"
                    :style="{ color: SCORE_COULEUR[scoreEmpl.label] }"
                  >
                    {{ scoreEmpl.label }}
                  </p>
                </div>
                <p
                  class="text-[26px] font-bold leading-none"
                  :style="{ color: SCORE_COULEUR[scoreEmpl.label] }"
                >
                  {{ scoreEmpl.global
                  }}<span class="text-[13px] font-medium text-[var(--text-tertiary)]">/100</span>
                </p>
              </div>
              <div class="mt-2 space-y-1">
                <div
                  v-for="axe in [
                    { label: 'Terrain', v: scoreEmpl.butinage },
                    { label: 'Miellées', v: scoreEmpl.floraisons },
                    { label: 'Météo', v: scoreEmpl.meteo },
                  ]"
                  :key="axe.label"
                  class="flex items-center gap-2 text-[11px]"
                >
                  <span class="w-14 text-[var(--text-tertiary)]">{{ axe.label }}</span>
                  <div
                    class="h-1.5 flex-1 overflow-hidden rounded-full"
                    style="background: var(--surface-muted)"
                  >
                    <div
                      class="h-full rounded-full"
                      style="background: var(--honey)"
                      :style="{ width: (axe.v ?? 0) + '%' }"
                    />
                  </div>
                  <span class="w-7 text-right text-[var(--text-secondary)]">{{
                    axe.v == null ? '…' : axe.v
                  }}</span>
                </div>
              </div>
            </div>

            <p
              class="mt-4 mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]"
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

            <!-- Rayon de butinage (occupation du sol réelle ~3 km) -->
            <div
              class="mt-4 border-t border-[color-mix(in_srgb,var(--honey)_25%,transparent)] pt-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <p
                  class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--honey-deep)]"
                >
                  Rayon de butinage · 3 km
                </p>
                <span
                  v-if="butinage"
                  class="rounded-full px-2 py-0.5 text-[11px] font-bold capitalize text-white"
                  :style="{ background: POTENTIEL_COULEUR[butinage.potentielLabel] }"
                >
                  {{ butinage.potentielLabel }} · {{ butinage.potentiel }}/100
                </span>
              </div>
              <p v-if="butinageLoading" class="text-[13px] text-[var(--text-secondary)]">
                Analyse de l'occupation du sol…
              </p>
              <div v-else-if="butinage && butinage.ressources.length" class="space-y-1.5">
                <div v-for="r in butinage.ressources" :key="r.label">
                  <div class="flex items-center justify-between text-[12.5px]">
                    <span
                      :class="
                        r.mellifere
                          ? 'font-medium text-[var(--text-primary)]'
                          : 'text-[var(--text-tertiary)]'
                      "
                    >
                      {{ r.mellifere ? '🌼' : '·' }} {{ r.label }}
                    </span>
                    <span class="font-semibold text-[var(--text-secondary)]">{{ r.pct }}%</span>
                  </div>
                  <div
                    class="mt-0.5 h-1.5 overflow-hidden rounded-full"
                    style="background: var(--surface-muted)"
                  >
                    <div
                      class="h-full rounded-full"
                      :style="{
                        width: r.pct + '%',
                        background: r.mellifere ? 'var(--honey)' : 'var(--text-quaternary)',
                      }"
                    />
                  </div>
                </div>
                <p class="pt-1 text-[11px] text-[var(--text-quaternary)]">
                  Occupation du sol réelle échantillonnée : RPG (cultures), BD Forêt (essences) et
                  CORINE Land Cover — IGN.
                </p>
              </div>

              <!-- Miels probables, déduits de l'occupation du sol réelle -->
              <div v-if="butinage && butinage.mielsProbables.length" class="mt-3">
                <p class="mb-1.5 text-[12px] font-medium text-[var(--text-secondary)]">
                  Miels probables ici
                  <span class="text-[var(--text-tertiary)]">(d'après le terrain)</span>
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="m in butinage.mielsProbables"
                    :key="m.typeMiel"
                    class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium capitalize"
                    :style="{
                      background: 'color-mix(in srgb, ' + couleurMiel(m.typeMiel) + ' 16%, white)',
                      color: 'var(--text-primary)',
                    }"
                  >
                    <span
                      class="h-2.5 w-2.5 rounded-full"
                      :style="{ background: couleurMiel(m.typeMiel) }"
                    />
                    {{ m.typeMiel }} · {{ m.pct }}%
                  </span>
                </div>
              </div>
            </div>

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
        <div v-else class="space-y-4">
          <!-- Guide : comment lire la carte (au premier coup d'œil) -->
          <div class="rounded-[12px] border border-[var(--border-default)] bg-white p-4">
            <p class="mb-2.5 text-[13px] font-semibold text-[var(--text-primary)]">
              Comment lire la carte
            </p>
            <ul class="space-y-2 text-[12.5px] leading-snug text-[var(--text-secondary)]">
              <li class="flex gap-2">
                <UIcon
                  name="i-lucide-palette"
                  class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
                />
                <span
                  >Chaque <b>département est coloré</b> par son miel dominant (voir légende).</span
                >
              </li>
              <li class="flex gap-2">
                <UIcon
                  name="i-lucide-mouse-pointer-click"
                  class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
                />
                <span><b>Cliquez une zone</b> → répartition des miels + meilleurs spots.</span>
              </li>
              <li class="flex gap-2">
                <UIcon
                  name="i-lucide-crosshair"
                  class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
                />
                <span
                  ><b>Cliquez un lieu</b> → score d'emplacement, floraisons et rayon de
                  butinage.</span
                >
              </li>
              <li class="flex gap-2">
                <UIcon
                  name="i-lucide-zoom-in"
                  class="mt-0.5 h-4 w-4 shrink-0 text-[var(--honey-deep)]"
                />
                <span><b>Zoomez</b> → détail commune par commune.</span>
              </li>
            </ul>
          </div>

          <!-- Suggestions de saison -->
          <div>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
