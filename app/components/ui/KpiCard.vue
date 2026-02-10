<template>
  <div
    class="group rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="flex items-start justify-between">
      <!-- Icon -->
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
        <UIcon :name="icon" class="h-5 w-5 text-amber-600" />
      </div>

      <!-- Trend badge -->
      <span
        v-if="trend !== undefined && trend !== 0"
        class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
      >
        <UIcon
          :name="trend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
          class="h-3 w-3"
        />
        {{ trend > 0 ? '+' : '' }}{{ trend }}%
      </span>
    </div>

    <!-- Value -->
    <div class="mt-3">
      <p class="animate-count-up text-2xl font-bold tracking-tight text-stone-900">
        {{ prefix }}{{ formattedValue }}{{ suffix }}
      </p>
      <p class="mt-0.5 text-sm text-stone-500">
        {{ label }}
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
}>();

const formattedValue = computed(() => {
  return new Intl.NumberFormat('fr-FR').format(props.value);
});
</script>
