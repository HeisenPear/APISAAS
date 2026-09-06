<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    vous: number;
    moyenne: number;
    unite: string;
    /** true = plus c'est haut, mieux c'est (production) ; false = l'inverse (mortalité). */
    higherIsBetter?: boolean;
    /** Libellé de la ligne de comparaison — personnalisable pour les benchmarks non géographiques. */
    moyenneLabel?: string;
  }>(),
  { moyenneLabel: 'Moyenne du département' },
);

const max = computed(() => Math.max(props.vous, props.moyenne, 1));
const vousPct = computed(() => Math.round((props.vous / max.value) * 100));
const moyennePct = computed(() => Math.round((props.moyenne / max.value) * 100));
const better = computed(() =>
  props.higherIsBetter ? props.vous >= props.moyenne : props.vous <= props.moyenne,
);
const delta = computed(() => {
  if (props.moyenne === 0) return null;
  return Math.round(((props.vous - props.moyenne) / props.moyenne) * 100);
});
</script>

<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-[14px] font-semibold text-[var(--text-primary)]">{{ label }}</h2>
      <span
        v-if="delta !== null"
        class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        :style="{
          color: better ? 'var(--sage-deep)' : 'var(--clay-deep)',
          background: better ? 'var(--sage-soft)' : 'var(--clay-soft)',
        }"
      >
        {{ delta > 0 ? '+' : '' }}{{ delta }}% vs moyenne
      </span>
    </div>
    <div class="space-y-2.5">
      <div>
        <div class="mb-1 flex justify-between text-[12px]">
          <span class="font-medium text-[var(--text-secondary)]">Vous</span>
          <span class="font-semibold tabular-nums text-[var(--text-primary)]"
            >{{ vous }} {{ unite }}</span
          >
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${vousPct}%`, background: better ? 'var(--sage)' : 'var(--clay)' }"
          />
        </div>
      </div>
      <div>
        <div class="mb-1 flex justify-between text-[12px]">
          <span class="font-medium text-[var(--text-tertiary)]">{{ moyenneLabel }}</span>
          <span class="font-semibold tabular-nums text-[var(--text-tertiary)]"
            >{{ moyenne }} {{ unite }}</span
          >
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            class="h-full rounded-full bg-[var(--tint-idle)] transition-all"
            :style="{ width: `${moyennePct}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
