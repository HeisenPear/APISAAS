<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
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
          Météo apicole
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Conditions par rucher — prévisions 14 jours
        </p>
      </div>
      <!-- Rucher selector -->
      <select
        v-model="selectedRucherId"
        class="h-9 rounded-lg border border-[var(--border-default)] bg-white px-3 text-[13px] text-[var(--text-primary)] focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
      >
        <option v-for="r in ruchersAvecGps" :key="r.id" :value="r.id">
          {{ r.nom }}
        </option>
      </select>
    </div>

    <!-- Carte contextuelle Maya -->
    <IaMayaContextCard contexte="meteo" />

    <!-- Aucun rucher avec GPS -->
    <UiEmptyState
      v-if="ruchersAvecGps.length === 0"
      icon="i-lucide-map-pin-off"
      title="Dites-moi où sont vos ruches ☀️"
      description="Ajoutez les coordonnées GPS de vos ruchers et je vous apporte la météo locale et les meilleures fenêtres de visite."
      action-label="Gérer les ruchers"
      @action="navigateTo('/ruchers')"
    />

    <template v-else>
      <!-- Skeleton -->
      <div v-if="pending" class="space-y-6">
        <div class="h-56 animate-pulse rounded-[18px] bg-[var(--surface-muted)]" />
        <div class="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
          <div
            v-for="i in 7"
            :key="i"
            class="h-40 animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
          />
        </div>
      </div>

      <template v-else-if="meteo">
        <!-- ── Alertes apicoles ─────────────────────────────────────────────── -->
        <div v-if="meteo.alertes.length > 0" class="space-y-2">
          <div
            v-for="alerte in meteo.alertes"
            :key="alerte"
            class="flex items-center gap-3 rounded-[12px] border px-4 py-3 text-[13px] font-medium"
            style="
              border-color: var(--status-bad);
              background: rgba(181, 69, 69, 0.07);
              color: var(--status-bad);
            "
          >
            <UIcon name="i-lucide-triangle-alert" class="h-4 w-4 shrink-0" />
            {{ alerte }}
          </div>
        </div>

        <!-- ── Hero card: conditions actuelles ───────────────────────────── -->
        <div
          class="overflow-hidden rounded-[18px] p-8"
          style="background: linear-gradient(135deg, #1c1c1e, #2a2725)"
        >
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <!-- Left: main weather -->
            <div>
              <p
                class="text-[12px] uppercase tracking-[0.08em] font-medium mb-4"
                style="color: rgba(255, 255, 255, 0.55)"
              >
                {{ meteo.rucherNom }}
              </p>
              <div class="flex items-end gap-4">
                <span class="text-[76px] leading-none">{{ meteo.actuel.icon }}</span>
                <div>
                  <p class="text-[72px] font-light leading-none text-white tabular-nums">
                    {{ meteo.actuel.temperature }}°
                  </p>
                  <p class="mt-1 text-[15px]" style="color: rgba(255, 255, 255, 0.65)">
                    {{ meteo.actuel.label }}
                  </p>
                </div>
              </div>
              <!-- Chips -->
              <div class="mt-5 flex flex-wrap gap-2">
                <span
                  class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                  style="background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8)"
                >
                  <UIcon name="i-lucide-droplets" class="h-3.5 w-3.5" />
                  {{ meteo.actuel.humidite }}% humidité
                </span>
                <span
                  class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                  style="background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8)"
                >
                  <UIcon name="i-lucide-wind" class="h-3.5 w-3.5" />
                  {{ meteo.actuel.vent }} km/h
                </span>
                <span
                  class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                  style="background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8)"
                >
                  <UIcon name="i-lucide-cloud-rain" class="h-3.5 w-3.5" />
                  {{ meteo.actuel.pluie }} mm
                </span>
              </div>

              <!-- Indicateur de visite -->
              <div
                class="mt-5 flex items-center gap-3 rounded-[12px] px-4 py-3"
                :style="
                  meteo.actuel.conditionsOptimales
                    ? 'background: rgba(90,138,94,0.2); color: #7ad480'
                    : 'background: rgba(200,127,42,0.2); color: #f5a623'
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
                <div>
                  <p class="text-[13px] font-semibold">
                    {{
                      meteo.actuel.conditionsOptimales
                        ? 'Bonnes conditions pour visiter'
                        : 'Conditions défavorables'
                    }}
                  </p>
                  <p class="mt-0.5 text-[11.5px] opacity-75">
                    Idéal : temp ≥ 15°C · vent &lt; 20 km/h · pas de pluie
                  </p>
                </div>
              </div>
            </div>

            <!-- Right: butinage score -->
            <div class="border-l border-white/15 pl-8 hidden lg:block">
              <p
                class="text-[11px] uppercase tracking-[0.1em] font-semibold mb-3"
                style="color: rgba(255, 255, 255, 0.45)"
              >
                Indice de butinage
              </p>
              <p
                class="text-[56px] font-bold leading-none tabular-nums"
                style="color: var(--honey)"
              >
                {{ meteo.previsions[0]?.scoreVisite ?? '—' }}
              </p>
              <p class="mt-1 text-[13px]" style="color: rgba(255, 255, 255, 0.55)">/100</p>
              <!-- Score bar -->
              <div
                class="mt-4 h-2 overflow-hidden rounded-full"
                style="background: rgba(255, 255, 255, 0.12)"
              >
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${meteo.previsions[0]?.scoreVisite ?? 0}%`,
                    backgroundColor: scoreColor(meteo.previsions[0]?.scoreVisite ?? 0),
                  }"
                />
              </div>
              <p class="mt-2 text-[12px]" style="color: rgba(255, 255, 255, 0.45)">
                {{ scoreLabel(meteo.previsions[0]?.scoreVisite ?? 0) }}
              </p>
            </div>
          </div>

          <!-- Hourly timeline -->
          <div v-if="meteo.heures.length > 0" class="mt-6 pt-5 border-t border-white/10">
            <p
              class="mb-3 text-[11px] uppercase tracking-[0.08em] font-semibold"
              style="color: rgba(255, 255, 255, 0.4)"
            >
              Prochaines heures
            </p>
            <div class="scrollable-x flex gap-2 pb-1">
              <div
                v-for="h in meteo.heures"
                :key="h.heure"
                class="flex min-w-[64px] flex-col items-center rounded-[10px] px-2.5 py-2"
                style="background: rgba(255, 255, 255, 0.08)"
              >
                <p class="text-[11px] font-medium" style="color: rgba(255, 255, 255, 0.5)">
                  {{ heureLabel(h.heure) }}
                </p>
                <p class="my-1 text-[18px]">{{ h.icon }}</p>
                <p class="text-[13px] font-bold text-white">{{ h.temp }}°</p>
                <div
                  v-if="h.probPluie > 10"
                  class="mt-1 flex items-center gap-0.5 text-[10px]"
                  style="color: var(--status-info)"
                >
                  <UIcon name="i-lucide-cloud-rain" class="h-2.5 w-2.5" />
                  {{ h.probPluie }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Conditions de visite du jour sélectionné (radar + conseils) ──── -->
        <div
          v-if="jourDetail"
          ref="detailCard"
          class="scroll-mt-4 rounded-[16px] border border-[var(--border-default)] bg-white p-5"
        >
          <div class="flex items-center justify-between gap-3">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
            >
              Conditions de visite —
              {{ jourDetail.isToday ? "aujourd'hui" : jourTitre(jourDetail.date) }}
            </p>
            <span
              v-if="jourDetail.palier"
              class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              :style="{
                color: scoreColor(jourDetail.score),
                background: `${scoreColor(jourDetail.score)}1a`,
              }"
            >
              {{ jourDetail.score }}/100 · {{ jourDetail.palier.label }}
            </span>
          </div>
          <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">
            Cliquez sur un jour ci-dessous pour afficher le détail de ses conditions.
          </p>

          <div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MeteoRadar v-if="jourDetail.facteurs.length" :facteurs="jourDetail.facteurs" />

            <div class="flex flex-col justify-center gap-3">
              <div
                v-if="jourDetail.creneau"
                class="flex items-center gap-2 rounded-[10px] bg-[var(--honey-soft)] px-3 py-2"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="h-4 w-4 shrink-0"
                  style="color: var(--honey-deep)"
                />
                <span class="text-[13px] text-[var(--text-secondary)]">
                  Meilleur créneau :
                  <strong class="text-[var(--text-primary)]"
                    >{{ jourDetail.creneau.debut }}–{{ jourDetail.creneau.fin }}</strong
                  >
                </span>
              </div>
              <div
                v-else-if="!jourDetail.isToday"
                class="flex items-center gap-2 rounded-[10px] bg-[var(--surface-muted)] px-3 py-2"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="h-4 w-4 shrink-0"
                  style="color: var(--text-tertiary)"
                />
                <span class="text-[12px] text-[var(--text-tertiary)]">
                  Le meilleur créneau horaire s'affiche le jour même.
                </span>
              </div>

              <div class="space-y-1.5">
                <div
                  v-for="f in jourDetail.facteurs"
                  :key="f.cle"
                  class="flex items-center gap-3 text-[12px]"
                >
                  <span class="w-24 shrink-0 text-[var(--text-secondary)]">{{ f.label }}</span>
                  <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      class="h-full rounded-full"
                      :style="{ width: `${f.valeur}%`, backgroundColor: scoreColor(f.valeur) }"
                    />
                  </div>
                  <span class="w-16 shrink-0 text-right text-[var(--text-tertiary)]">{{
                    f.note
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="jourDetail.conseils.length"
            class="mt-4 space-y-1.5 border-t border-[var(--border-default)] pt-4"
          >
            <div
              v-for="(c, i) in jourDetail.conseils"
              :key="i"
              class="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]"
            >
              <UIcon
                name="i-lucide-lightbulb"
                class="mt-0.5 h-3.5 w-3.5 shrink-0"
                style="color: var(--honey-deep)"
              />
              <span>{{ c }}</span>
            </div>
          </div>
        </div>

        <!-- ── 7-day forecast ──────────────────────────────────────────────── -->
        <div>
          <div
            class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
            style="color: var(--honey-deep)"
          >
            01 — Prévisions
          </div>
          <h2
            class="text-[18px] font-semibold tracking-[-0.015em] mb-4"
            style="
              font-family:
                'SF Pro Display',
                -apple-system,
                system-ui,
                sans-serif;
            "
          >
            7 jours sur ce rucher
          </h2>
          <div class="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
            <div
              v-for="(jour, i) in meteo.previsions.slice(0, 7)"
              :key="jour.date"
              class="cursor-pointer rounded-[12px] border p-4 flex flex-col items-center gap-1.5 transition-all hover:-translate-y-0.5"
              :class="i === selectedDayIndex ? 'ring-2 ring-[var(--honey)]' : ''"
              :style="
                jour.alerteGel || jour.alerteOrage || jour.alerteVent
                  ? `border-color: var(--status-warn); background: rgba(200,127,42,0.05)`
                  : 'border-color: var(--border-default); background: white'
              "
              @click="selectDay(i)"
            >
              <p class="text-[11.5px] font-semibold text-[var(--text-secondary)] capitalize">
                {{ i === 0 ? 'Auj.' : jourLabel(jour.date) }}
              </p>
              <p class="text-[11px] text-[var(--text-tertiary)]">{{ jourMois(jour.date) }}</p>
              <span class="text-[28px] my-1">{{ jour.icon }}</span>
              <div class="flex items-center gap-1">
                <span class="text-[13px] font-bold text-[var(--text-primary)]"
                  >{{ jour.tempMax }}°</span
                >
                <span class="text-[11px] text-[var(--text-tertiary)]">/ {{ jour.tempMin }}°</span>
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                :style="`color: ${scoreColor(jour.scoreVisite)}; background: ${scoreColor(jour.scoreVisite)}22`"
              >
                {{ jour.scoreVisite }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── 14-day full list ─────────────────────────────────────────────── -->
        <div>
          <div
            class="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5"
            style="color: var(--honey-deep)"
          >
            02 — Détail 14 jours
          </div>
          <div class="space-y-2">
            <div
              v-for="(jour, i) in meteo.previsions"
              :key="jour.date"
              class="flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 transition-all hover:border-[var(--honey)] sm:gap-4 sm:p-4"
              :class="
                i === selectedDayIndex
                  ? 'border-[var(--honey)] bg-[var(--honey-soft)] ring-1 ring-[var(--honey)]'
                  : jour.scoreVisite >= 70
                    ? 'border-[var(--sage)]/30 bg-[var(--sage-soft)]/40'
                    : jour.alerteGel || jour.alerteOrage || jour.alerteVent
                      ? 'bg-white border-[var(--status-bad)]/30'
                      : 'border-[var(--border-default)] bg-white'
              "
              @click="selectDay(i)"
            >
              <!-- Jour -->
              <div class="w-20 shrink-0">
                <p class="text-[12px] font-semibold text-[var(--text-secondary)]">
                  {{ i === 0 ? "Aujourd'hui" : jourLabel(jour.date) }}
                </p>
                <p class="text-[11.5px] text-[var(--text-tertiary)]">{{ jourMois(jour.date) }}</p>
              </div>
              <!-- Icon + conditions -->
              <div class="flex w-36 shrink-0 items-center gap-2">
                <span class="text-[22px]">{{ jour.icon }}</span>
                <div>
                  <p class="text-[12px] text-[var(--text-secondary)]">{{ jour.label }}</p>
                  <div class="mt-0.5 flex flex-wrap gap-1">
                    <span
                      v-if="jour.alerteGel"
                      class="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold"
                      style="background: #dbeafe; color: #1d4ed8"
                    >
                      <UIcon name="i-lucide-snowflake" class="h-2.5 w-2.5" />Gel
                    </span>
                    <span
                      v-if="jour.alerteOrage"
                      class="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold"
                      style="background: #fee2e2; color: var(--status-bad)"
                    >
                      <UIcon name="i-lucide-zap" class="h-2.5 w-2.5" />Orage
                    </span>
                    <span
                      v-if="jour.alerteVent"
                      class="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold"
                      style="background: rgba(200, 127, 42, 0.12); color: var(--status-warn)"
                    >
                      <UIcon name="i-lucide-wind" class="h-2.5 w-2.5" />Rafales
                    </span>
                  </div>
                </div>
              </div>
              <!-- Temperatures -->
              <div class="flex shrink-0 items-center gap-1.5">
                <span class="text-[13px] font-bold text-[var(--text-primary)]"
                  >{{ jour.tempMax }}°</span
                >
                <span class="text-[11px] text-[var(--text-tertiary)]">/</span>
                <span class="text-[11px] text-[var(--text-tertiary)]">{{ jour.tempMin }}°</span>
              </div>
              <!-- Metrics -->
              <div class="hidden flex-1 grid-cols-4 gap-2 sm:grid">
                <div class="flex items-center gap-1 text-[11.5px] text-[var(--text-secondary)]">
                  <UIcon
                    name="i-lucide-cloud-rain"
                    class="h-3.5 w-3.5"
                    style="color: var(--status-info)"
                  />
                  <span :class="jour.pluieMm > 0 ? 'font-medium' : ''">
                    {{ jour.pluieMm > 0 ? `${jour.pluieMm}mm` : '—' }}
                    <span class="text-[var(--text-tertiary)]">({{ jour.probPluie }}%)</span>
                  </span>
                </div>
                <div class="flex items-center gap-1 text-[11.5px] text-[var(--text-secondary)]">
                  <UIcon name="i-lucide-wind" class="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  {{ jour.ventMax }}
                  <span class="text-[var(--text-tertiary)]">· {{ jour.rafaleMax }} km/h</span>
                </div>
                <div class="flex items-center gap-1 text-[11.5px] text-[var(--text-secondary)]">
                  <UIcon name="i-lucide-sun" class="h-3.5 w-3.5" style="color: var(--honey)" />
                  {{ jour.sunrise }} – {{ jour.sunset }}
                </div>
                <div class="flex items-center gap-1 text-[11.5px] text-[var(--text-secondary)]">
                  <UIcon name="i-lucide-zap" class="h-3.5 w-3.5 text-yellow-500" />
                  UV {{ jour.uvMax }}
                </div>
              </div>
              <!-- Score -->
              <div class="ml-auto shrink-0 text-right">
                <div class="flex items-center gap-2">
                  <div
                    class="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-muted)] sm:block"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :style="{
                        width: `${jour.scoreVisite}%`,
                        backgroundColor: scoreColor(jour.scoreVisite),
                      }"
                    />
                  </div>
                  <div class="text-right">
                    <p
                      class="text-[13px] font-bold"
                      :style="{ color: scoreColor(jour.scoreVisite) }"
                    >
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
        </div>

        <p class="text-right text-[11.5px] text-[var(--text-tertiary)]">
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

// ── Jour sélectionné (détail au clic sur n'importe quel jour) ────────────
const selectedDayIndex = ref(0);
const detailCard = ref<HTMLElement | null>(null);

// Repart sur aujourd'hui quand on change de rucher
watch(selectedRucherId, () => {
  selectedDayIndex.value = 0;
});

function selectDay(i: number) {
  selectedDayIndex.value = i;
  nextTick(() => detailCard.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
}

// Le détail (radar/facteurs/conseils) existe pour CHAQUE jour côté API.
// Le créneau horaire précis n'est calculable que pour aujourd'hui (index 0).
const jourDetail = computed(() => {
  if (!meteo.value) return null;
  const prev = meteo.value.previsions[selectedDayIndex.value];
  if (!prev) return null;
  const isToday = selectedDayIndex.value === 0;
  const a = meteo.value.aujourdhui;
  return {
    isToday,
    date: prev.date,
    score: isToday ? a.score : prev.scoreVisite,
    palier: isToday ? a.palier : prev.palier,
    facteurs: isToday ? a.facteurs : prev.facteurs,
    conseils: isToday ? a.conseils : prev.conseils,
    creneau: isToday ? a.creneau : null,
  };
});

function jourTitre(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

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
  if (score >= 70) return 'var(--status-good)';
  if (score >= 40) return 'var(--status-warn)';
  return 'var(--status-bad)';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  return 'Défavorable';
}
</script>
