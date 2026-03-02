<template>
  <div
    class="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- Subtle sparkline background -->
    <svg
      v-if="sparkline && sparkline.length > 1"
      class="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full opacity-40"
      preserveAspectRatio="none"
      :viewBox="`0 0 ${sparkline.length - 1} 1`"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F5A623" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#F5A623" stop-opacity="0" />
        </linearGradient>
      </defs>
      <polygon :points="areaPoints" :fill="`url(#${gradientId})`" />
      <polyline
        :points="linePoints"
        fill="none"
        stroke="#F5A623"
        stroke-width="0.06"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!-- Content -->
    <div class="relative">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-stone-400">{{ label }}</p>
        <span
          v-if="trend !== undefined && trend !== 0"
          class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          :class="trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
        >
          <UIcon
            :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="h-2.5 w-2.5"
          />
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </span>
      </div>
      <p
        class="mt-1.5 animate-count-up text-3xl font-bold tabular-nums tracking-tight text-stone-900"
      >
        {{ prefix }}{{ formattedValue
        }}<span v-if="suffix" class="text-lg font-semibold text-stone-400">{{ suffix }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string;
  value: number;
  label: string;
  trend?: number;
  prefix?: string;
  suffix?: string;
  sparkline?: number[];
}>();

const formattedValue = computed(() => {
  return new Intl.NumberFormat('fr-FR').format(props.value);
});

const gradientId = computed(() => `spark-${props.label.replace(/\s+/g, '-').toLowerCase()}`);

const normalizedPoints = computed(() => {
  if (!props.sparkline || props.sparkline.length < 2) return [];
  const max = Math.max(...props.sparkline);
  const min = Math.min(...props.sparkline);
  const range = max - min || 1;
  return props.sparkline.map((v) => 1 - (v - min) / range);
});

const linePoints = computed(() => {
  return normalizedPoints.value.map((y, i) => `${i},${y}`).join(' ');
});

const areaPoints = computed(() => {
  if (normalizedPoints.value.length === 0) return '';
  const last = normalizedPoints.value.length - 1;
  return `0,1 ${linePoints.value} ${last},1`;
});
</script>
