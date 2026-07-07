<template>
  <div class="rounded-[14px] border bg-white p-5" style="border-color: var(--border-default)">
    <div class="mb-4 flex items-center justify-between gap-3">
      <p
        class="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        {{ title }}
      </p>
      <div class="flex items-center gap-3">
        <span v-if="badge" class="text-[12.5px] font-medium" style="color: var(--text-secondary)">{{
          badge
        }}</span>
        <span v-else-if="hint" class="text-[11px]" style="color: var(--text-tertiary)">{{
          hint
        }}</span>
        <NuxtLink
          v-if="detailTo"
          :to="detailTo"
          class="shrink-0 text-[12px] hover:underline"
          style="color: var(--text-tertiary)"
          >Détail →</NuxtLink
        >
        <a
          v-else-if="external"
          :href="external"
          target="_blank"
          rel="noopener"
          class="shrink-0 text-[12px] hover:underline"
          style="color: var(--text-tertiary)"
          >Ouvrir ↗</a
        >
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  badge?: string;
  hint?: string;
  detailTo?: string;
  external?: string;
}>();
</script>
