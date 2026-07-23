<!--
  KpiWidget — petit indicateur du tableau de bord (widget « petit »). Générique :
  les 4 KPI (ruches / production / CA / alertes) l'utilisent avec des props
  différentes, fournies par WidgetGrid selon l'id du widget.
-->
<template>
  <div class="flex flex-col gap-1.5 p-4 sm:p-5">
    <p
      class="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style="color: var(--text-tertiary)"
    >
      {{ label }}
    </p>
    <div>
      <p class="mt-1 text-[24px] font-semibold tabular-nums" :style="`color:${couleur}`">
        {{ value
        }}<span v-if="suffix" class="text-[14px] font-medium" style="color: var(--text-tertiary)">{{
          suffix
        }}</span>
      </p>
      <NuxtLink
        v-if="to"
        :to="to"
        class="mt-0.5 inline-block text-[11.5px] hover:underline"
        style="color: var(--honey-deep)"
      >
        {{ toLabel ?? 'Voir' }} →
      </NuxtLink>
      <p v-else-if="sub" class="mt-0.5 text-[11.5px]" style="color: var(--text-tertiary)">
        {{ sub }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
  sub?: string;
  to?: string;
  toLabel?: string;
}>();

const couleur = computed(() => props.color ?? 'var(--text-primary)');
</script>
