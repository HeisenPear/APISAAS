<template>
  <!-- Desktop : table classique -->
  <div class="hidden lg:block">
    <table class="w-full bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
      <thead>
        <tr class="border-b border-[var(--border-default)]">
          <th
            v-for="col in columns"
            :key="col.key"
            class="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] px-4 py-3"
            :class="col.class"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-[14px]"
            :class="col.class"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile : cards empilées -->
  <div class="lg:hidden space-y-3">
    <div
      v-for="(row, i) in rows"
      :key="i"
      class="bg-white border border-[var(--border-default)] rounded-[12px] p-4"
    >
      <!-- Slot custom ou auto-layout -->
      <slot name="mobile-card" :row="row">
        <div class="space-y-2">
          <div
            v-for="col in columns.filter(c => !c.mobileHidden)"
            :key="col.key"
            class="flex justify-between items-start gap-2"
          >
            <span class="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide shrink-0">
              {{ col.label }}
            </span>
            <span class="text-[14px] text-right">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </span>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string; mobileHidden?: boolean; class?: string }[];
  rows: Record<string, unknown>[];
  mobileCardSlot?: boolean; // Si true, utilise le slot #mobile-card au lieu de l'auto-layout
}>();
</script>