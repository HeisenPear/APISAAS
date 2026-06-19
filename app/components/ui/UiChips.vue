<!--
  UiChips — choix MULTIPLE au tap. "Actions menées", "Flore dominante"…
  Usage : <UiChips v-model="actions" :options="['Hausse posée','Nourrissement','Traitement']" />
-->
<template>
  <div class="chips">
    <button
      v-for="o in options"
      :key="o"
      type="button"
      class="chip"
      :class="{ 'is-sel': modelValue.includes(o) }"
      @click="toggle(o)"
    >
      <UIcon v-if="modelValue.includes(o)" name="i-lucide-check" class="h-3.5 w-3.5" />
      {{ o }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string[]; options: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>();
function toggle(o: string) {
  const set = new Set(props.modelValue);
  if (set.has(o)) set.delete(o);
  else set.add(o);
  emit('update:modelValue', [...set]);
}
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 11px 14px;
  border: 1.5px solid var(--border-strong, rgba(168, 162, 158, 0.5));
  border-radius: 10px;
  background: var(--surface-card);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.chip.is-sel {
  border-color: var(--honey);
  background: var(--honey-soft);
  color: var(--honey-deep);
}
</style>
