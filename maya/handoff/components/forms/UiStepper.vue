<!--
  UiStepper — saisie numérique au pouce (±). "Cadres de couvain", "Hausses posées"…
  Cible : app/components/ui/UiStepper.vue
  Usage : <UiStepper v-model="cadres" :min="0" :max="12" unit="cadres" />
-->
<template>
  <div class="step">
    <button type="button" class="step-btn" :disabled="modelValue <= min" @click="bump(-1)">
      <UIcon name="i-lucide-minus" class="h-[18px] w-[18px]" />
    </button>
    <span class="step-val">
      {{ modelValue }}<span v-if="unit" class="step-unit"> {{ unit }}</span>
    </span>
    <button type="button" class="step-btn" :disabled="modelValue >= max" @click="bump(1)">
      <UIcon name="i-lucide-plus" class="h-[18px] w-[18px]" />
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: number; min?: number; max?: number; step?: number; unit?: string }>(),
  { min: 0, max: 99, step: 1 }
);
const emit = defineEmits<{ 'update:modelValue': [v: number] }>();
function bump(dir: number) {
  const next = Math.max(props.min, Math.min(props.max, props.modelValue + dir * props.step));
  emit('update:modelValue', next);
}
</script>

<style scoped>
.step {
  display: inline-flex;
  align-items: center;
  height: 46px;
  border: 1.5px solid var(--border-strong, rgba(168, 162, 158, 0.5));
  border-radius: 11px;
  overflow: hidden;
}
.step-btn {
  width: 46px;
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--text-primary);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.step-btn:hover:not(:disabled) {
  background: var(--surface-sunk);
}
.step-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.step-val {
  min-width: 64px;
  text-align: center;
  font-family: var(--font-display, inherit);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.step-unit {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
}
</style>
