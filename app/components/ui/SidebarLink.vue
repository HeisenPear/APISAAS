<script setup lang="ts">
interface NavLeaf {
  icon: string;
  label: string;
  to: string;
  badge?: number | string;
  alertDot?: boolean;
}

const props = defineProps<{
  item: NavLeaf;
  collapsed: boolean;
  isMobile: boolean;
  locked?: boolean;
  alertCount?: number;
}>();

defineEmits<{ navigate: [] }>();

const showLabel = computed(() => !props.collapsed || props.isMobile);
</script>

<template>
  <NuxtLink
    :to="item.to"
    :title="collapsed && !isMobile ? item.label : undefined"
    class="group flex min-h-[44px] items-center gap-3 rounded-[10px] px-[10px] py-[9px] transition-all duration-[var(--duration-fast)] hover:bg-[rgba(255,255,255,0.08)]"
    :class="{ 'opacity-60': locked }"
    active-class="!bg-[rgba(255,255,255,0.10)] sidebar-active-item"
    @click="$emit('navigate')"
  >
    <UIcon :name="item.icon" class="h-4 w-4 shrink-0" style="color: rgba(255, 255, 255, 0.65)" />
    <span
      v-if="showLabel"
      class="flex-1 truncate text-[13px] font-medium"
      style="color: rgba(255, 255, 255, 0.65)"
    >
      {{ item.label }}
    </span>
    <UIcon
      v-if="showLabel && locked"
      name="i-lucide-lock"
      class="ml-auto h-3 w-3 shrink-0"
      style="color: rgba(255, 255, 255, 0.3)"
    />
    <span
      v-else-if="showLabel && item.alertDot && (alertCount ?? 0) > 0"
      class="ml-auto h-1.5 w-1.5 rounded-full"
      style="background-color: var(--status-warn)"
    />
    <span
      v-else-if="showLabel && item.badge !== undefined"
      class="ml-auto rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold"
      style="background: rgba(245, 166, 35, 0.18); color: #f5a623"
      >{{ item.badge }}</span
    >
  </NuxtLink>
</template>
