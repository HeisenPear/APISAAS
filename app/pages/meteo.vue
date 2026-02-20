<template>
  <div>
    <UiPageHeader title="Météo" description="Conditions par rucher — prévisions 14 jours">
      <template #actions>
        <select
          v-model="selectedRucherId"
          class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option v-for="r in ruchersAvecGps" :key="r.id" :value="r.id">
            {{ r.nom }}
          </option>
        </select>
      </template>
    </UiPageHeader>

    <!-- Aucun rucher avec GPS -->
    <UiEmptyState
      v-if="ruchersAvecGps.length === 0"
      icon="i-lucide-map-pin-off"
      title="Aucun rucher géolocalisé"
      description="Ajoutez les coordonnées GPS de vos ruchers pour accéder à la météo."
      action-label="Gérer les ruchers"
      @action="navigateTo('/ruchers')"
    />

    <template v-else>
      <!-- Skeleton -->
      <div v-if="pending" class="space-y-6">
        <div class="h-56 animate-pulse rounded-2xl bg-stone-100" />
        <div class="h-24 animate-pulse rounded-2xl bg-stone-100" />
        <div class="grid grid-cols-7 gap-2">
          <div v-for="i in 7" :key="i" class="h-40 animate-pulse rounded-xl bg-stone-100" />
        </div>
      </div>

      <template v-else-if="meteo">
        <!-- ── Alertes apicoles ─────────────────────────────────────────────── -->
        <div v-if="meteo.alertes.length > 0" class="mb-4 space-y-2">
          <div
            v-for="alerte in meteo.alertes"
            :key="alerte"
            class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <UIcon name="i-lucide-triangle-alert" class="h-4 w-4 shrink-0" />
            {{ alerte }}
          </div>
        </div>

        <!-- ── Conditions actuelles ────────────────────────────────────────── -->
        <div
          class="mb-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-gradient-to-br from-sky-100 via-sky-50 to-white shadow-sm"
        >
          <div class="p-6">
            <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <!-- Temp principale -->
              <div class="flex items-center gap-5">
                <span class="text-7xl leading-none">{{ meteo.actuel.icon }}</span>
                <div>
                  <div class="flex items-end gap-2">
                    <p class="text-6xl font-bold tabular-nums text-stone-900">
                      {{ meteo.actuel.temperature }}°
                    </p>
                    <p class="mb-2 text-lg text-stone-400">
                      / {{ meteo.actuel.ressenti }}° ressenti
                    </p>
                  </div>
                  <p class="text-base text-stone-600">{{ meteo.actuel.label }}</p>
                  <p class="mt-0.5 text-sm text-stone-400">{{ meteo.rucherNom }}</p>
                </div>
              </div>

              <!-- Métriques détaillées -->
              <div class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-2">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                    <UIcon name="i-lucide-wind" class="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-stone-900">{{ meteo.actuel.vent }} km/h</p>
                    <p class="text-xs text-stone-400">
                      Vent · rafales {{ meteo.actuel.rafale }} km/h
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                    <UIcon name="i-lucide-droplets" class="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-stone-900">
                      {{ meteo.actuel.humidite }} %
                    </p>
                    <p class="text-xs text-stone-400">Humidité</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                    <UIcon name="i-lucide-cloud-rain" class="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-stone-900">{{ meteo.actuel.pluie }} mm</p>
                    <p class="text-xs text-stone-400">Précipitations</p>
                  </div>
                </div>
                <div v-if="meteo.previsions[0]" class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <UIcon name="i-lucide-sun" class="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-stone-900">
                      {{ meteo.previsions[0].sunrise }} – {{ meteo.previsions[0].sunset }}
                    </p>
                    <p class="text-xs text-stone-400">Lever · coucher</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Indicateur de visite -->
            <div
              class="mt-5 flex items-center gap-3 rounded-xl px-4 py-3"
              :class="
                meteo.actuel.conditionsOptimales
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              "
            >
              <UIcon
                :name="
                  meteo.actuel.conditionsOptimales
                    ? 'i-lucide-circle-check'
                    : 'i-lucide-circle-alert'
                "
                class="h-5 w-5 shrink-0"
              />
              <div class="flex-1">
                <p class="text-sm font-semibold">
                  {{
                    meteo.actuel.conditionsOptimales
                      ? 'Bonnes conditions pour une visite maintenant'
                      : 'Conditions défavorables pour visiter'
                  }}
                </p>
                <p class="mt-0.5 text-xs opacity-75">
                  Idéal : temp ≥ 15°C · vent &lt; 20 km/h · pas de pluie · pas d'orage
                </p>
              </div>
            </div>
          </div>

          <!-- ── Timeline horaire ── -->
          <div
            v-if="meteo.heures.length > 0"
            class="border-t border-sky-200/50 bg-white/60 px-6 py-4"
          >
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Prochaines heures
            </p>
            <div class="flex gap-3 overflow-x-auto pb-1">
              <div
                v-for="h in meteo.heures"
                :key="h.heure"
                class="flex min-w-[72px] flex-col items-center rounded-xl border border-stone-100 bg-white px-3 py-2.5 shadow-sm"
              >
                <p class="text-xs font-medium text-stone-500">{{ heureLabel(h.heure) }}</p>
                <p class="my-1 text-xl">{{ h.icon }}</p>
                <p class="text-sm font-bold text-stone-900">{{ h.temp }}°</p>
                <div
                  v-if="h.probPluie > 10"
                  class="mt-1 flex items-center gap-0.5 text-[10px] text-sky-600"
                >
                  <UIcon name="i-lucide-cloud-rain" class="h-2.5 w-2.5" />
                  {{ h.probPluie }}%
                </div>
                <div
                  v-if="h.vent >= 20"
                  class="mt-1 flex items-center gap-0.5 text-[10px] text-stone-400"
                >
                  <UIcon name="i-lucide-wind" class="h-2.5 w-2.5" />
                  {{ h.vent }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Prévisions 14 jours ─────────────────────────────────────────── -->
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Prévisions 14 jours
          </h2>
          <span class="text-xs text-stone-400">Score de visite apicole</span>
        </div>

        <div class="space-y-2">
          <div
            v-for="(jour, i) in meteo.previsions"
            :key="jour.date"
            class="flex items-center gap-3 rounded-2xl border p-3 transition-all sm:gap-4 sm:p-4"
            :class="
              i === 0
                ? 'border-amber-300 bg-amber-50/60'
                : jour.scoreVisite >= 70
                  ? 'border-emerald-200/70 bg-emerald-50/30'
                  : jour.alerteGel || jour.alerteOrage || jour.alerteVent
                    ? 'border-red-200/60 bg-red-50/20'
                    : 'border-stone-200/50 bg-white'
            "
          >
            <!-- Jour -->
            <div class="w-20 shrink-0">
              <p class="text-xs font-semibold text-stone-500">
                {{ i === 0 ? "Aujourd'hui" : jourLabel(jour.date) }}
              </p>
              <p class="text-xs text-stone-400">{{ jourMois(jour.date) }}</p>
            </div>

            <!-- Icône + conditions -->
            <div class="flex w-36 shrink-0 items-center gap-2">
              <span class="text-2xl">{{ jour.icon }}</span>
              <div>
                <p class="text-xs text-stone-600">{{ jour.label }}</p>
                <div class="mt-0.5 flex flex-wrap gap-1">
                  <span
                    v-if="jour.alerteGel"
                    class="flex items-center gap-0.5 rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700"
                  >
                    <UIcon name="i-lucide-snowflake" class="h-2.5 w-2.5" />
                    Gel
                  </span>
                  <span
                    v-if="jour.alerteOrage"
                    class="flex items-center gap-0.5 rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold text-red-700"
                  >
                    <UIcon name="i-lucide-zap" class="h-2.5 w-2.5" />
                    Orage
                  </span>
                  <span
                    v-if="jour.alerteVent"
                    class="flex items-center gap-0.5 rounded bg-orange-100 px-1 py-0.5 text-[9px] font-semibold text-orange-700"
                  >
                    <UIcon name="i-lucide-wind" class="h-2.5 w-2.5" />
                    Rafales
                  </span>
                </div>
              </div>
            </div>

            <!-- Températures -->
            <div class="flex shrink-0 items-center gap-1.5">
              <span class="text-sm font-bold text-stone-900">{{ jour.tempMax }}°</span>
              <span class="text-xs text-stone-400">/</span>
              <span class="text-xs text-stone-400">{{ jour.tempMin }}°</span>
            </div>

            <!-- Métriques compactes -->
            <div class="hidden flex-1 grid-cols-4 gap-2 sm:grid">
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <UIcon name="i-lucide-cloud-rain" class="h-3.5 w-3.5 text-sky-500" />
                <span :class="jour.pluieMm > 0 ? 'font-medium text-sky-700' : ''">
                  {{ jour.pluieMm > 0 ? `${jour.pluieMm}mm` : '—' }}
                  <span class="text-stone-400">({{ jour.probPluie }}%)</span>
                </span>
              </div>
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <UIcon name="i-lucide-wind" class="h-3.5 w-3.5" />
                {{ jour.ventMax }} <span class="text-stone-400">· {{ jour.rafaleMax }} km/h</span>
              </div>
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <UIcon name="i-lucide-sun" class="h-3.5 w-3.5 text-amber-500" />
                {{ jour.sunrise }} – {{ jour.sunset }}
              </div>
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <UIcon name="i-lucide-zap" class="h-3.5 w-3.5 text-yellow-500" />
                UV {{ jour.uvMax }}
              </div>
            </div>

            <!-- Score de visite -->
            <div class="ml-auto shrink-0 text-right">
              <div class="flex items-center gap-2">
                <!-- Barre de score -->
                <div class="hidden h-1.5 w-20 overflow-hidden rounded-full bg-stone-100 sm:block">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: `${jour.scoreVisite}%`,
                      backgroundColor: scoreColor(jour.scoreVisite),
                    }"
                  />
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold" :style="{ color: scoreColor(jour.scoreVisite) }">
                    {{ jour.scoreVisite }}/100
                  </p>
                  <p class="text-[10px]" :style="{ color: scoreColor(jour.scoreVisite) }">
                    {{ scoreLabel(jour.scoreVisite) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Légende -->
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-400">
          <span class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded border border-amber-300 bg-amber-50" /> Aujourd'hui
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded border border-emerald-200 bg-emerald-50" /> Score ≥ 70 —
            Idéal
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded border border-red-200 bg-red-50" /> Alerte active
          </span>
        </div>

        <p class="mt-6 text-right text-xs text-stone-300">
          Données Open-Meteo · Actualisées toutes les heures
        </p>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { ruchers } = useRuchers();

const ruchersAvecGps = computed(
  () => ruchers.value?.filter((r) => r.latitude != null && r.longitude != null) ?? [],
);

const selectedRucherId = ref<string | null>(null);

watch(
  ruchersAvecGps,
  (list) => {
    if (list.length > 0 && !selectedRucherId.value) {
      selectedRucherId.value = list[0]?.id ?? null;
    }
  },
  { immediate: true },
);

const { meteo, pending } = useMeteo(selectedRucherId);

function heureLabel(isoStr: string): string {
  return isoStr.slice(11, 16);
}

function jourLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' });
}

function jourMois(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function scoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'Défavorable';
}
</script>
