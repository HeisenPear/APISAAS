<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
    :class="`${meta.bgColor} ${meta.textColor}`"
  >
    <UIcon :name="meta.icon" class="h-3.5 w-3.5" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
import { INTERVENTION_META, type TypeIntervention } from '~/types/interventions';

const props = defineProps<{
  type: TypeIntervention;
}>();

const meta = computed(() => INTERVENTION_META[props.type] ?? INTERVENTION_META.commentaire);
</script>
