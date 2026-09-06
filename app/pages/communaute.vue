<script setup lang="ts">
definePageMeta({ layout: 'default' });

interface Benchmarks {
  available: boolean;
  reason?: 'no_departement' | 'not_enough_peers';
  departement?: string;
  nbApiculteurs?: number;
  annee?: number;
  production?: { vous: number; moyenne: number; unite: string };
  mortalite?: { vous: number; moyenne: number; unite: string };
}

const gating = useGating();

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — cf. `app/utils/appelApi.ts`.
 * Résoudre le chemin contre l'union des 213 routes fait déplier à TypeScript le
 * type de retour réel de chaque handler ; le type est donné, donc vérifié.
 * `useFetch` n'avait pas de clé : celle-ci est stable et descriptive.
 */
const { data, pending, error, refresh } = useAsyncData<{ data: Benchmarks }>(
  'communaute-benchmarks',
  () => appelApi<{ data: Benchmarks }>('/api/communaute/benchmarks'),
  {
    lazy: true,
    immediate: gating.can('communauteBase'),
  },
);
const b = computed(() => data.value?.data ?? null);
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
        Communauté
      </h1>
      <p class="mt-1 text-[14px] text-[var(--text-secondary)]">
        Vos performances comparées aux apiculteurs de votre département — anonymisé.
      </p>
    </div>

    <UiFeatureGate feature="communauteBase" blur>
      <!-- Chargement -->
      <div v-if="pending && !data" class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="i in 2"
          :key="i"
          class="h-36 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <!-- États indisponibles -->
      <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

      <div
        v-else-if="!b || !b.available"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-10 text-center"
      >
        <UIcon
          name="i-lucide-users-round"
          class="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]"
        />
        <p
          v-if="b?.reason === 'not_enough_peers'"
          class="mx-auto max-w-md text-[14px] text-[var(--text-secondary)]"
        >
          Pas encore assez d'apiculteurs dans le {{ b.departement }} pour un comparatif anonyme (il
          en faut au moins 3). Revenez quand la communauté grandit&nbsp;!
        </p>
        <p v-else class="mx-auto max-w-md text-[14px] text-[var(--text-secondary)]">
          Renseignez le <strong>département</strong> de vos ruchers pour débloquer les comparatifs
          régionaux.
        </p>
      </div>

      <!-- Benchmarks -->
      <div v-else class="space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
          <UIcon name="i-lucide-shield-check" class="h-4 w-4 shrink-0 text-[var(--sage-deep)]" />
          Comparé à
          <strong class="text-[var(--text-secondary)]">{{ b.nbApiculteurs }} apiculteurs</strong>
          du {{ b.departement }} · saison {{ b.annee }} · données anonymisées
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <CommunauteBenchmarkBar
            label="Production de miel"
            :vous="b.production?.vous ?? 0"
            :moyenne="b.production?.moyenne ?? 0"
            :unite="b.production?.unite ?? 'kg/ruche'"
            higher-is-better
          />
          <CommunauteBenchmarkBar
            label="Taux de mortalité"
            :vous="b.mortalite?.vous ?? 0"
            :moyenne="b.mortalite?.moyenne ?? 0"
            :unite="b.mortalite?.unite ?? '%'"
            :higher-is-better="false"
          />
        </div>
        <p class="text-[12px] text-[var(--text-quaternary)]">
          Les moyennes sont calculées sur l'ensemble des ruchers du département, sans jamais exposer
          de donnée individuelle.
        </p>
      </div>

      <!-- Teaser (comptes sans la feature) -->
      <template #preview>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)]">
            <UIcon name="i-lucide-shield-check" class="h-4 w-4 shrink-0" />
            Comparé à <strong>12 apiculteurs</strong> de votre département · données anonymisées
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <CommunauteBenchmarkBar
              label="Production de miel"
              :vous="24"
              :moyenne="19"
              unite="kg/ruche"
              higher-is-better
            />
            <CommunauteBenchmarkBar
              label="Taux de mortalité"
              :vous="8"
              :moyenne="14"
              unite="%"
              :higher-is-better="false"
            />
          </div>
        </div>
      </template>
    </UiFeatureGate>
  </div>
</template>
