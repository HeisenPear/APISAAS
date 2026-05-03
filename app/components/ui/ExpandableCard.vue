<template>
  <div
    class="group/card overflow-hidden rounded-2xl border border-stone-200/60 bg-white transition-shadow duration-[var(--duration-base)] ease-[var(--ease-out-expo)]"
    :class="[expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md', cardClass]"
  >
    <!-- Header — always visible, clickable to expand -->
    <button
      type="button"
      class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-[var(--duration-fast)]"
      :class="expanded ? '' : 'hover:bg-stone-50/50'"
      @click="toggle"
    >
      <!-- Icon -->
      <div
        v-if="icon || $slots.icon"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-[var(--duration-base)]"
        :class="iconContainerClass"
      >
        <slot name="icon">
          <UIcon v-if="icon" :name="icon" class="h-[18px] w-[18px]" :class="iconClass" />
        </slot>
      </div>

      <!-- Title + subtitle -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="truncate text-[15px] font-semibold text-stone-900">{{ title }}</h3>
          <slot name="badge" />
        </div>
        <p v-if="subtitle" class="truncate text-xs text-stone-500">{{ subtitle }}</p>
      </div>

      <!-- Right side: value or slot -->
      <div class="flex shrink-0 items-center gap-2">
        <slot name="header-right" />
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)]"
          :class="expanded ? 'bg-stone-100 rotate-180' : 'bg-transparent'"
        >
          <UIcon name="i-lucide-chevron-down" class="h-4 w-4 text-stone-400" />
        </div>
      </div>
    </button>

    <!-- Expandable content — CSS grid trick for smooth height animation -->
    <div
      class="grid transition-[grid-template-rows,opacity] duration-[var(--duration-slow)] ease-[var(--ease-out-expo)]"
      :class="expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <div class="px-5 pb-5">
          <div class="border-t border-stone-100 pt-4">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: string;
    iconContainerClass?: string;
    iconClass?: string;
    cardClass?: string;
    defaultExpanded?: boolean;
  }>(),
  {
    subtitle: undefined,
    icon: undefined,
    cardClass: undefined,
    iconContainerClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
    defaultExpanded: false,
  },
);

const expanded = ref(props.defaultExpanded);

function toggle() {
  expanded.value = !expanded.value;
}

defineExpose({ expanded, toggle });
</script>
