<script setup lang="ts">
definePageMeta({ layout: 'default' });

interface Arret {
  rucherId: string;
  nom: string;
  commune: string | null;
  ordre: number;
  distanceKm: number;
  nbEnRetard: number;
  nbCritiques: number;
}
interface ArretSansCoords {
  rucherId: string;
  nom: string;
  commune: string | null;
  nbEnRetard: number;
  nbCritiques: number;
}
interface Tournee {
  arrets: Arret[];
  sansCoords: ArretSansCoords[];
  totalKm: number;
  lienMaps: string | null;
  nbRuchersAVisiter: number;
  nbRuchesAVisiter: number;
  seuilJours: number;
}

const gating = useGating();

const { data, pending } = useFetch<{ data: Tournee }>('/api/tournee', {
  lazy: true,
  immediate: gating.can('tourneeOptimisee'),
});
const t = computed(() => data.value?.data ?? null);
const rienAFaire = computed(
  () => !!t.value && t.value.arrets.length === 0 && t.value.sansCoords.length === 0,
);

const dateLabel = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
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
        Ma tournée
      </h1>
      <p class="mt-1 text-[14px] capitalize text-[var(--text-secondary)]">{{ dateLabel }}</p>
    </div>

    <UiFeatureGate feature="tourneeOptimisee" blur>
      <!-- Chargement -->
      <div v-if="pending" class="space-y-3">
        <div class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <!-- Tout est à jour -->
      <div
        v-else-if="rienAFaire"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-10 text-center"
      >
        <div
          class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style="background: var(--sage-soft)"
        >
          <UIcon name="i-lucide-check" class="h-6 w-6" style="color: var(--sage-deep)" />
        </div>
        <p class="text-[15px] font-semibold text-[var(--text-primary)]">Tout est à jour 🎉</p>
        <p class="mx-auto mt-1 max-w-md text-[14px] text-[var(--text-secondary)]">
          Aucun rucher n'a de ruche en retard de visite ou en santé critique. Profitez-en&nbsp;!
        </p>
      </div>

      <!-- Tournée -->
      <div v-else-if="t" class="space-y-4">
        <!-- Résumé + Maps -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-5"
        >
          <div class="flex items-center gap-6">
            <div>
              <p class="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                {{ t.nbRuchersAVisiter }}
              </p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">
                rucher{{ t.nbRuchersAVisiter > 1 ? 's' : '' }} · {{ t.nbRuchesAVisiter }} ruche{{
                  t.nbRuchesAVisiter > 1 ? 's' : ''
                }}
              </p>
            </div>
            <div v-if="t.arrets.length > 1" class="border-l border-[var(--border-default)] pl-6">
              <p class="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                ~{{ t.totalKm }} km
              </p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">à vol d'oiseau</p>
            </div>
          </div>
          <a
            v-if="t.lienMaps"
            :href="t.lienMaps"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5"
            style="background: var(--honey)"
          >
            <UIcon name="i-lucide-navigation" class="h-4 w-4" />
            Ouvrir l'itinéraire
          </a>
        </div>

        <!-- Étapes -->
        <ol class="space-y-3">
          <li v-for="a in t.arrets" :key="a.rucherId">
            <NuxtLink
              :to="`/ruchers/${a.rucherId}`"
              class="flex items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
                style="background: var(--surface-sidebar)"
                >{{ a.ordre }}</span
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                  {{ a.nom }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span v-if="a.commune" class="text-[12px] text-[var(--text-tertiary)]">{{
                    a.commune
                  }}</span>
                  <span
                    v-if="a.nbEnRetard > 0"
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style="background: var(--honey-soft); color: var(--honey-deep)"
                  >
                    {{ a.nbEnRetard }} en retard
                  </span>
                  <span
                    v-if="a.nbCritiques > 0"
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style="background: var(--clay-soft); color: var(--clay-deep)"
                  >
                    {{ a.nbCritiques }} santé critique
                  </span>
                </div>
              </div>
              <div v-if="a.ordre > 1" class="shrink-0 text-right">
                <p class="text-[13px] font-medium text-[var(--text-secondary)]">
                  +{{ a.distanceKm }} km
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-4 w-4 shrink-0 text-[var(--text-quaternary)]"
              />
            </NuxtLink>
          </li>
        </ol>

        <!-- Ruchers à visiter sans coordonnées -->
        <div
          v-if="t.sansCoords.length > 0"
          class="rounded-[14px] border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-4"
        >
          <p
            class="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-map-pin-off" class="h-4 w-4" />
            À visiter aussi — position GPS manquante
          </p>
          <NuxtLink
            v-for="s in t.sansCoords"
            :key="s.rucherId"
            :to="`/ruchers/${s.rucherId}`"
            class="flex items-center justify-between py-1.5 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>{{ s.nom }}</span>
            <span class="text-[12px] text-[var(--text-tertiary)]">
              {{ s.nbEnRetard > 0 ? `${s.nbEnRetard} en retard` : ''
              }}{{ s.nbEnRetard > 0 && s.nbCritiques > 0 ? ' · ' : ''
              }}{{ s.nbCritiques > 0 ? `${s.nbCritiques} critique` : '' }}
            </span>
          </NuxtLink>
          <p class="mt-1 text-[12px] text-[var(--text-quaternary)]">
            Ajoutez leurs coordonnées pour les intégrer à l'itinéraire optimisé.
          </p>
        </div>
      </div>

      <!-- Teaser (comptes sans la feature) -->
      <template #preview>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between rounded-[14px] border border-[var(--border-default)] bg-white p-5"
          >
            <div>
              <p class="text-[22px] font-semibold leading-none">3 ruchers · 6 ruches</p>
              <p class="mt-1 text-[12px] text-[var(--text-tertiary)]">~16 km à vol d'oiseau</p>
            </div>
            <span
              class="flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-semibold text-white"
              style="background: var(--honey)"
            >
              <UIcon name="i-lucide-navigation" class="h-4 w-4" /> Ouvrir l'itinéraire
            </span>
          </div>
          <div
            v-for="(d, i) in [
              { nom: 'Rucher des Tilleuls', km: 2.4, retard: 3, crit: 0 },
              { nom: 'Rucher du Verger', km: 5.1, retard: 0, crit: 1 },
              { nom: 'Rucher Haut-Bois', km: 8.7, retard: 2, crit: 0 },
            ]"
            :key="i"
            class="flex items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white p-4"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
              style="background: var(--surface-sidebar)"
              >{{ i + 1 }}</span
            >
            <div class="flex-1">
              <p class="text-[15px] font-semibold">{{ d.nom }}</p>
              <div class="mt-1 flex gap-2">
                <span
                  v-if="d.retard"
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style="background: var(--honey-soft); color: var(--honey-deep)"
                  >{{ d.retard }} en retard</span
                >
                <span
                  v-if="d.crit"
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style="background: var(--clay-soft); color: var(--clay-deep)"
                  >{{ d.crit }} santé critique</span
                >
              </div>
            </div>
            <span v-if="i > 0" class="text-[13px] font-medium text-[var(--text-secondary)]"
              >+{{ d.km }} km</span
            >
          </div>
        </div>
      </template>
    </UiFeatureGate>
  </div>
</template>
