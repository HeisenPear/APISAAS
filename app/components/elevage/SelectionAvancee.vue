<template>
  <div class="space-y-4">
    <div v-if="pending" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
      />
    </div>

    <template v-else-if="lignees.length">
      <!-- Note méthodologique -->
      <div class="flex items-start gap-2.5 rounded-[12px] bg-[var(--sage-soft)] px-4 py-3">
        <UIcon name="i-lucide-dna" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--sage-deep)]" />
        <p class="text-xs leading-relaxed text-[var(--text-secondary)]">
          <span v-if="standardise">
            Valeur génétique <b>standardisée</b> contre votre cheptel ({{
              criteresStandardises
            }}
            critère{{ criteresStandardises > 1 ? 's' : '' }} en z-score) — plus rigoureux que
            l'index brut pour comparer des reines évaluées dans des conditions différentes.
          </span>
          <span v-else>
            Index de sélection par lignée. Enregistrez plus de tests (≥ 3 par critère) pour
            débloquer la <b>standardisation</b> contre votre cheptel.
          </span>
        </p>
      </div>

      <!-- Classement des lignées -->
      <div class="space-y-2">
        <div
          v-for="(l, i) in lignees"
          :key="l.ligneeId ?? 'sans'"
          class="flex items-center gap-4 rounded-[14px] border bg-white px-5 py-4"
          :class="
            i === 0
              ? 'border-[var(--honey)]/50 ring-1 ring-[var(--honey)]/20'
              : 'border-[var(--border-default)]'
          "
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :style="`background:${i === 0 ? 'var(--honey-soft)' : 'var(--surface-muted)'};color:${i === 0 ? 'var(--honey-deep)' : 'var(--text-tertiary)'}`"
          >
            {{ i + 1 }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ l.nom }}</p>
            <p class="text-xs text-[var(--text-tertiary)]">
              <span v-if="l.race" class="capitalize">{{ l.race }} · </span>{{ l.nbReines }} reine{{
                l.nbReines > 1 ? 's' : ''
              }}
              · meilleure {{ l.meilleurIndex }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-lg font-bold tabular-nums" :style="`color:${tierColor(l.indexMoyen)}`">
              {{ l.indexMoyen }}
            </p>
            <p class="text-[10px] uppercase tracking-wide text-[var(--text-quaternary)]">
              index moyen
            </p>
          </div>
        </div>
      </div>

      <!-- Top reines vendables -->
      <div
        v-if="topReines.length"
        class="rounded-[14px] border border-[var(--border-default)] bg-white p-4"
      >
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
        >
          Vos meilleures reines (à reproduire / vendre)
        </p>
        <div class="space-y-1.5">
          <div v-for="r in topReines" :key="r.reineId" class="flex items-center gap-3 text-sm">
            <span class="w-5 text-center text-xs font-semibold text-[var(--text-tertiary)]">{{
              r.rang
            }}</span>
            <span class="min-w-0 flex-1 truncate text-[var(--text-primary)]">
              {{ r.identifiant || 'Reine' }}
              <span v-if="r.ligneeNom" class="text-[var(--text-tertiary)]"
                >· {{ r.ligneeNom }}</span
              >
            </span>
            <span
              v-if="r.tier"
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :style="`background:color-mix(in srgb,${r.tier.color} 14%,transparent);color:${r.tier.color}`"
            >
              {{ r.tier.label }}
            </span>
            <span
              class="w-9 text-right font-bold tabular-nums"
              :style="`color:${tierColor(r.index)}`"
              >{{ r.index }}</span
            >
          </div>
        </div>
      </div>
    </template>

    <UiEmptyState
      v-else
      icon="i-lucide-dna"
      title="Pas encore d'évaluations"
      description="Enregistrez des tests de performance sur vos reines pour révéler la valeur de vos lignées."
    />
  </div>
</template>

<script setup lang="ts">
import { indexTier } from '~/utils/selectionReines';

interface LigneeRow {
  ligneeId: string | null;
  nom: string;
  race: string | null;
  indexMoyen: number;
  meilleurIndex: number;
  nbReines: number;
}
interface ReineRow {
  rang: number;
  reineId: string;
  identifiant: string | null;
  ligneeNom: string | null;
  index: number;
  tier: { label: string; color: string } | null;
}

const { data: raw, pending } = useFetch('/api/elevage/selection-avancee', {
  key: 'elevage-selection-avancee',
  lazy: true,
});

const payload = computed(
  () =>
    (
      raw.value as {
        data: {
          reines: ReineRow[];
          lignees: LigneeRow[];
          standardise: boolean;
          criteresStandardises: number;
        };
      } | null
    )?.data ?? null,
);
const lignees = computed(() => payload.value?.lignees ?? []);
const topReines = computed(() => (payload.value?.reines ?? []).slice(0, 5));
const standardise = computed(() => payload.value?.standardise ?? false);
const criteresStandardises = computed(() => payload.value?.criteresStandardises ?? 0);

function tierColor(index: number) {
  return indexTier(index)?.color ?? 'var(--text-primary)';
}
</script>
