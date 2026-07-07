<template>
  <div class="space-y-3">
    <div v-if="!ruchers.length" class="py-8 text-center text-sm text-[var(--text-tertiary)]">
      Enregistrez des récoltes pour comparer la rentabilité de vos ruchers.
    </div>

    <div
      v-for="(r, i) in ruchers"
      :key="r.rucherId"
      class="rounded-[14px] border bg-white p-4 transition-colors"
      :class="
        i === 0 && r.productionKg > 0
          ? 'border-[var(--honey)]/50 ring-1 ring-[var(--honey)]/20'
          : 'border-[var(--border-default)]'
      "
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span
              v-if="i === 0 && r.productionKg > 0"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--honey-deep)]"
            >
              Top
            </span>
            <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ r.nom }}</p>
          </div>
          <p class="mt-0.5 text-[11px] text-[var(--text-tertiary)]">
            {{ r.nbRuches }} ruche{{ r.nbRuches > 1 ? 's' : '' }}
          </p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            {{ r.kgParRuche }}
            <span class="text-xs font-normal text-[var(--text-tertiary)]">kg/ruche</span>
          </p>
          <p class="text-[11px] text-[var(--text-tertiary)]">{{ r.productionKg }} kg au total</p>
        </div>
      </div>

      <!-- Barre de productivité (kg/ruche relatif au meilleur) -->
      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: `${maxKgRuche > 0 ? Math.max(3, (r.kgParRuche / maxKgRuche) * 100) : 0}%`,
            background: i === 0 ? 'linear-gradient(90deg,#f8bd54,#ec9914)' : 'var(--sage)',
          }"
        />
      </div>

      <!-- Économie estimée -->
      <div class="mt-3 flex items-center justify-between text-[11px]">
        <span class="text-[var(--text-tertiary)]">
          Valorisation
          <span class="font-medium text-[var(--text-secondary)]">{{ eur(r.valorisationEur) }}</span>
        </span>
        <span class="text-[var(--text-tertiary)]">
          Marge estimée
          <span
            class="font-semibold"
            :class="r.margeEur >= 0 ? 'text-[var(--sage-deep)]' : 'text-[var(--status-bad)]'"
          >
            {{ eur(r.margeEur) }}
          </span>
        </span>
      </div>
    </div>

    <p
      v-if="ruchers.length"
      class="px-1 pt-1 text-[10px] leading-relaxed text-[var(--text-quaternary)]"
    >
      kg/ruche = donnée réelle issue de vos récoltes. Valorisation & marge sont estimées (production
      × {{ prixMoyenKg }} €/kg, coûts répartis au prorata) — les ventes ne sont pas rattachées à un
      rucher.
    </p>
  </div>
</template>

<script setup lang="ts">
interface RentabiliteRucher {
  rucherId: string;
  nom: string;
  nbRuches: number;
  productionKg: number;
  kgParRuche: number;
  valorisationEur: number;
  coutsEur: number;
  margeEur: number;
}

const props = defineProps<{
  ruchers: RentabiliteRucher[];
  prixMoyenKg: number;
}>();

const maxKgRuche = computed(() => Math.max(0, ...props.ruchers.map((r) => r.kgParRuche)));

function eur(n: number) {
  return `${n.toLocaleString('fr-FR')} €`;
}
</script>
