<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-stone-900">{{ title }}</h3>
      <slot name="actions" />
    </div>

    <!-- Bar chart using simple CSS -->
    <div v-if="type === 'bar' && chartData.length > 0" class="space-y-3">
      <div v-for="item in chartData" :key="item.label" class="flex items-center gap-3">
        <span class="w-20 shrink-0 text-right text-xs text-stone-500">{{ item.label }}</span>
        <div class="flex-1">
          <div class="h-7 w-full rounded-lg bg-stone-100">
            <div
              class="flex h-7 items-center rounded-lg px-2 text-xs font-medium text-white transition-all duration-500"
              :class="item.color ?? 'bg-amber-500'"
              :style="{ width: `${Math.max(item.percent, 3)}%` }"
            >
              <span v-if="item.percent > 15">{{ item.value }} kg</span>
            </div>
          </div>
        </div>
        <span class="w-16 shrink-0 text-right text-xs font-medium text-stone-700">
          {{ item.value }} kg
        </span>
      </div>
    </div>

    <!-- Monthly area chart (simplified with bars) -->
    <div v-else-if="type === 'monthly' && chartData.length > 0">
      <div class="flex items-end gap-1" style="height: 180px">
        <div
          v-for="item in chartData"
          :key="item.label"
          class="group relative flex flex-1 flex-col items-center justify-end"
          style="height: 100%"
        >
          <div
            class="w-full rounded-t-md bg-amber-500/80 transition-colors group-hover:bg-amber-500"
            :style="{ height: `${Math.max(item.percent, 2)}%` }"
          />
          <span class="mt-1 text-[10px] text-stone-400">{{ item.label }}</span>
          <!-- Tooltip -->
          <div
            class="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-stone-800 px-2 py-1 text-xs text-white group-hover:block"
          >
            {{ item.value }} kg
          </div>
        </div>
      </div>
    </div>

    <!-- Donut / pie chart (simplified list) -->
    <div v-else-if="type === 'donut' && chartData.length > 0" class="space-y-2">
      <div v-for="(item, i) in chartData" :key="item.label" class="flex items-center gap-3">
        <div class="h-3 w-3 rounded-full" :class="donutColors[i % donutColors.length]" />
        <span class="flex-1 text-sm text-stone-700">{{ item.label }}</span>
        <span class="text-sm font-medium text-stone-900">{{ item.value }} kg</span>
        <span class="text-xs text-stone-400">{{ item.percent.toFixed(0) }}%</span>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="flex items-center justify-center py-12 text-sm text-stone-400">
      Aucune donnee
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ChartDataItem {
  label: string;
  value: number;
  percent: number;
  color?: string;
}

defineProps<{
  title: string;
  type: 'bar' | 'monthly' | 'donut';
  chartData: ChartDataItem[];
}>();

const donutColors = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
];
</script>
