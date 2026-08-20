<template>
  <div class="settings-row" :class="{ 'first-row': first }">
    <span class="row-label">{{ label }}</span>
    <div>
      <div v-if="editing && $slots.input" class="row-input-wrap">
        <slot name="input" />
      </div>
      <template v-else>
        <span :class="value ? 'row-value' : 'row-value-empty'">
          {{ value ?? 'Non renseigné' }}
        </span>
        <p v-if="hint" class="row-hint">{{ hint }}</p>
      </template>
    </div>
    <button
      v-if="!editing"
      type="button"
      class="row-action"
      :disabled="busy"
      :aria-busy="busy || undefined"
      @click="$emit('edit')"
    >
      {{ busy ? (busyLabel ?? 'En cours…') : action }}
    </button>
    <span v-else />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value?: string | null;
  hint?: string | null;
  action?: string;
  editing?: boolean;
  first?: boolean;
  /** Action longue en cours : le bouton se verrouille au lieu d'accepter un second clic. */
  busy?: boolean;
  busyLabel?: string;
}>();

defineEmits<{
  edit: [];
  cancel: [];
}>();
</script>

<style scoped>
.settings-row {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 24px;
  padding: 18px 0;
  align-items: start;
  border-bottom: 1px solid var(--border-default);
  transition: background 120ms;
}
.settings-row:hover {
  background: rgba(0, 0, 0, 0.015);
}
.settings-row.first-row {
  border-top: 1px solid var(--border-default);
}
.row-label {
  font-size: 13.5px;
  color: var(--text-secondary);
  font-weight: 500;
  padding-top: 1px;
}
.row-value {
  font-size: 14.5px;
  color: var(--text-primary);
}
.row-value-empty {
  font-size: 14.5px;
  color: var(--text-tertiary);
  font-style: italic;
}
.row-hint {
  font-size: 12.5px;
  color: var(--text-tertiary);
  margin: 2px 0 0;
}
.row-action {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  text-decoration: none;
  transition: color 150ms;
  white-space: nowrap;
  padding-top: 2px;
}
.row-action:hover:not(:disabled) {
  color: var(--text-primary);
}
.row-action:disabled {
  cursor: progress;
  opacity: 0.55;
}
.row-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (max-width: 767px) {
  .settings-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .row-action {
    justify-self: flex-start;
  }
}
</style>
