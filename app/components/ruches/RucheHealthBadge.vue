<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="badgeClass"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  statut: string;
  qualiteReine?: string | null;
  forceColonie?: number | null;
  santeScore?: number | null;
}>();

type HealthLevel = 'excellent' | 'bon' | 'attention' | 'critique';

const healthLevel = computed<HealthLevel>(() => {
  // If we have the real computed score, use it directly
  if (props.santeScore != null) {
    if (props.santeScore >= 70) return 'excellent';
    if (props.santeScore >= 50) return 'bon';
    if (props.santeScore >= 30) return 'attention';
    return 'critique';
  }

  // Fallback: statut-based logic
  if (['morte', 'vendue', 'fusionnee'].includes(props.statut)) return 'critique';
  if (['orpheline', 'essaimee'].includes(props.statut)) return 'attention';
  if (props.statut === 'faible') {
    if (props.forceColonie && props.forceColonie <= 2) return 'critique';
    return 'attention';
  }

  // Active with forceColonie
  if (props.forceColonie) {
    if (props.forceColonie >= 4) return 'excellent';
    if (props.forceColonie >= 3) return 'bon';
    return 'attention';
  }

  return 'bon';
});

const label = computed(() => {
  const labels: Record<HealthLevel, string> = {
    excellent: 'Excellente',
    bon: 'Bonne',
    attention: 'Attention',
    critique: 'Critique',
  };
  return labels[healthLevel.value];
});

const badgeClass = computed(() => {
  const classes: Record<HealthLevel, string> = {
    excellent: 'bg-emerald-50 text-emerald-700',
    bon: 'bg-sky-50 text-sky-700',
    attention: 'bg-amber-50 text-amber-700',
    critique: 'bg-red-50 text-red-700',
  };
  return classes[healthLevel.value];
});

const dotClass = computed(() => {
  const classes: Record<HealthLevel, string> = {
    excellent: 'bg-emerald-500',
    bon: 'bg-sky-500',
    attention: 'bg-amber-500',
    critique: 'bg-red-500',
  };
  return classes[healthLevel.value];
});
</script>
