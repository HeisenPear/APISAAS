<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <KpiCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :value="stat.value"
      :label="stat.label"
      :trend="stat.trend"
      :prefix="stat.prefix"
      :suffix="stat.suffix"
    />
  </div>
</template>

<script setup lang="ts">
interface StatItem {
  icon: string;
  value: number;
  label: string;
  trend?: number;
  prefix?: string;
  suffix?: string;
}

defineProps<{
  stats: StatItem[];
}>();
</script>
