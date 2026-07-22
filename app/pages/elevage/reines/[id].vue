<script setup lang="ts">
definePageMeta({ layout: 'default' });

const route = useRoute();
const id = route.params.id as string;

const { data, pending } = useFetch(`/api/elevage/reines/${id}`, {
  key: `elevage-reine-${id}`,
});
const { data: genealogie, pending: pendingGenealogie } = useFetch(
  `/api/elevage/reines/${id}/genealogie`,
  { key: `elevage-genealogie-${id}` },
);
const { data: classement } = useFetch('/api/elevage/classement', {
  key: 'elevage-classement',
});

const reine = computed(() => data.value?.data?.reine);
const rangEtIndex = computed(() =>
  classement.value?.data?.find((r: { reineId: string }) => r.reineId === id),
);

const marquageColors: Record<string, string> = {
  blanc: 'bg-white border-2 border-stone-300',
  jaune: 'bg-yellow-400',
  rouge: 'bg-red-500',
  vert: 'bg-amber-500',
  bleu: 'bg-blue-500',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="space-y-5">
    <NuxtLink
      to="/elevage/reines"
      class="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Reines
    </NuxtLink>

    <div v-if="pending" class="space-y-5">
      <div class="h-10 w-64 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />
      <div class="h-40 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <UiEmptyState
      v-else-if="!reine"
      icon="i-lucide-crown"
      title="Reine introuvable"
      description="Cette reine n'existe pas ou a été supprimée."
      action-label="Retour aux reines"
      @action="navigateTo('/elevage/reines')"
    />

    <template v-else>
      <div class="flex items-center gap-3">
        <span
          :class="marquageColors[reine.couleurMarquage || 'blanc']"
          class="h-4 w-4 shrink-0 rounded-full"
        />
        <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {{ reine.identifiant || `Reine ${reine.id.slice(-4)}` }}
        </h1>
        <span
          v-if="data?.data?.ligneeNom"
          class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
        >
          {{ data.data.ligneeNom }}
        </span>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Index de sélection
          </p>
          <ElevageIndexBadge
            :index="rangEtIndex?.index ?? null"
            :completeness="rangEtIndex?.completeness"
          />
        </div>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Rang
          </p>
          <p class="text-[18px] font-semibold text-[var(--text-primary)]">
            {{ rangEtIndex ? `#${rangEtIndex.rang}` : '—' }}
          </p>
        </div>
        <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-4">
          <p
            class="mb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Naissance
          </p>
          <p class="text-[18px] font-semibold text-[var(--text-primary)]">
            {{ reine.anneeNaissance ?? '—' }}
          </p>
        </div>
      </div>

      <!-- Arbre généalogique -->
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
        <h2 class="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">
          Arbre généalogique
        </h2>
        <div
          v-if="pendingGenealogie"
          class="h-24 animate-pulse rounded-[12px] bg-[var(--surface-muted)]"
        />
        <ElevageArbreGenealogique
          v-else-if="genealogie?.data"
          :generations="genealogie.data.generations"
          :focus-id="id"
        />
      </div>

      <!-- Historique des tests -->
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
        <h2 class="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">
          Tests de performance
        </h2>
        <div v-if="!data?.data?.tests?.length" class="text-sm text-[var(--text-tertiary)]">
          Aucun test enregistré pour cette reine.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="test in data.data.tests"
            :key="test.id"
            class="flex items-center justify-between rounded-[10px] border border-[var(--border-default)] px-3 py-2 text-[13px]"
          >
            <span class="text-[var(--text-secondary)]">Saison {{ test.saison }}</span>
            <span class="text-[var(--text-tertiary)]">{{ formatDate(test.dateEvaluation) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
